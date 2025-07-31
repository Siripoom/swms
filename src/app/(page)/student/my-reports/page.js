"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { getDistinctAcademicYears } from "@/services/subjects";
import { Table, Card, Typography, Spin, Select, Row, Col, message, Empty, Button } from "antd";
import { BarChartOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import '@/lib/fonts/THSarabunNew-normal.js'; // **ตรวจสอบ Path และชื่อไฟล์ Font ให้ถูกต้อง**

const { Title, Text } = Typography;

export default function MyReportPage() {
  const { userProfile, role, loading: authLoading, studentId } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const categoryTranslations = {
    academic: 'วิชาการ',
    research: 'วิจัย/นวัตกรรม',
    academic_service: 'บริการวิชาการ',
    student_affairs: 'กิจการนักศึกษา',
    personal: 'ส่วนตัว/การใช้ชีวิต'
  };

  const semesterOptions = [
    { value: 1, label: 'ภาคการศึกษาที่ 1' },
    { value: 2, label: 'ภาคการศึกษาที่ 2' },
    { value: 3, label: 'ภาคฤดูร้อน' },
  ];

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const res = await getDistinctAcademicYears();
      if (res.success && res.data.length > 0) {
        const options = res.data.map(year => ({ value: year, label: `ปีการศึกษา ${year}` }));
        setYearOptions(options);
        if (!selectedYear) setSelectedYear(options[0].value);
      } else {
        const currentYear = String(new Date().getFullYear() + 543);
        setYearOptions([{ value: currentYear, label: `ปีการศึกษา ${currentYear}` }]);
        if (!selectedYear) setSelectedYear(currentYear);
      }
    };
    if (!authLoading && role === 'student') fetchFilterOptions();
  }, [authLoading, role, selectedYear]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!studentId || !selectedYear) { setLoading(false); return; }
      setLoading(true);
      const filters = { student_id: studentId, academic_year: selectedYear, semester: selectedSemester };
      const res = await getMyWorkloadReport(filters);
      if (res.success) setReportData(res.data); else message.error("ไม่สามารถดึงข้อมูลรายงานได้: " + res.error);
      setLoading(false);
    };
    if (!authLoading && studentId && selectedYear) fetchReport();
  }, [authLoading, studentId, selectedYear, selectedSemester]);

  const summaryData = useMemo(() => {
    const summary = { academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 };
    if (reportData) {
      reportData.forEach(item => { if (item.category in summary) summary[item.category] += item.hours_spent; });
    }
    return Object.keys(categoryTranslations).map(key => ({
      key: key,
      category: categoryTranslations[key],
      hours: summary[key] || 0
    }));
  }, [reportData]);

  const summaryColumns = [
    { title: 'พันธกิจ', dataIndex: 'category', key: 'category' },
    { title: 'ชั่วโมงรวม', dataIndex: 'hours', key: 'hours', render: (h) => h.toFixed(2) },
    { title: 'เฉลี่ย (ชม./สัปดาห์)', key: 'avg', render: (_, record) => (record.hours / 16).toFixed(2) },
  ];

  const detailColumns = [
    { title: 'กิจกรรม/ภาระงาน', dataIndex: 'work_name', key: 'work_name' },
    { title: 'หมวดหมู่', dataIndex: 'category', key: 'category', responsive: ['sm'], render: (cat) => categoryTranslations[cat] || cat },
    { title: 'วันที่', dataIndex: 'work_date', key: 'date', responsive: ['md'], render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-' },
    { title: 'ชั่วโมง', dataIndex: 'hours_spent', key: 'hours_spent', align: 'right', render: (val) => val.toFixed(1) },
  ];

  // --- จุดที่แก้ไข: ย้ายฟังก์ชันเข้ามาข้างใน Component ---
  const handleDownloadPDF = () => {
    // 1. ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!reportData || reportData.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับสร้าง PDF");
      return;
    }

    // 2. สร้าง instance ของ jsPDF
    const doc = new jsPDF();

    // 3. ตั้งค่า Font ภาษาไทย (ตรวจสอบให้แน่ใจว่าชื่อ 'THSarabunNew' ตรงกับในไฟล์ font)
    doc.setFont('THSarabunNew', 'normal');

    // 4. สร้าง Header ของเอกสาร
    doc.setFontSize(18);
    doc.text("รายงานสรุปภาระงานนักศึกษา", 105, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`ชื่อ-สกุล: ${userProfile?.full_name || 'N/A'}`, 14, 32);
    doc.text(`รหัสนักศึกษา: ${userProfile?.student_identifier || 'N/A'}`, 14, 38);

    // แสดงภาคการศึกษาให้สวยงามขึ้น
    const semesterText = semesterOptions.find(s => s.value === selectedSemester)?.label || 'ทั้งหมด';
    doc.text(`ปีการศึกษา: ${selectedYear} / ภาคการศึกษา: ${semesterText}`, 14, 44);

    // 5. สร้างตารางสรุป
    doc.setFontSize(14);
    doc.text("สรุปภาระงานรายพันธกิจ", 14, 58);
    autoTable(doc, {
      startY: 62,
      head: [['พันธกิจ', 'ชั่วโมงรวม', 'เฉลี่ย (ชม./สัปดาห์)']],
      body: summaryData.map(item => [
        item.category,
        item.hours.toFixed(2),
        (item.hours / 16).toFixed(2)
      ]),
      theme: 'grid',
      headStyles: { font: 'THSarabunNew', fontStyle: 'normal' },
      bodyStyles: { font: 'THSarabunNew', fontStyle: 'normal' },
    });

    // 6. สร้างตารางรายละเอียด
    let finalY = doc.lastAutoTable.finalY; // หาตำแหน่งท้ายตารางล่าสุด
    doc.setFontSize(14);
    doc.text("รายละเอียดภาระงานทั้งหมด", 14, finalY + 12);
    autoTable(doc, {
      startY: finalY + 16,
      head: [['กิจกรรม/ภาระงาน', 'หมวดหมู่', 'วันที่', 'ชั่วโมง']],
      body: reportData.map(item => [
        item.work_name || '-',
        categoryTranslations[item.category] || item.category,
        item.work_date ? dayjs(item.work_date).format('DD/MM/YYYY') : '-',
        (item.hours_spent || 0).toFixed(1)
      ]),
      theme: 'grid',
      headStyles: { font: 'THSarabunNew', fontStyle: 'normal' },
      bodyStyles: { font: 'THSarabunNew', fontStyle: 'normal' },
    });

    // 7. เพิ่มส่วนท้ายสำหรับเซ็นชื่อ
    finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(11);
    doc.text("ลงชื่อ................................................................. อาจารย์ที่ปรึกษา", 150, finalY + 25, { align: 'center' });
    doc.text("(.................................................................)", 150, finalY + 32, { align: 'center' });
    doc.text("วันที่............/............/............", 150, finalY + 39, { align: 'center' });

    // 8. บันทึกไฟล์
    const fileName = `Workload_Report_${userProfile?.student_identifier || 'student'}_${selectedYear}.pdf`;
    doc.save(fileName);
  };

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานของฉัน">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3"><BarChartOutlined />รายงานของฉัน</Title>
              <Text type="secondary">สรุปและรายละเอียดภาระงานของคุณในแต่ละภาคการศึกษา</Text>
            </div>
            {/* ย้ายปุ่มมาไว้ตรงนี้เพื่อให้เห็นชัดเจนขึ้น */}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
              onClick={handleDownloadPDF}
              disabled={reportData.length === 0 || loading}
            >
              Download PDF
            </Button>
          </div>
          <Row gutter={[16, 16]} justify="start">
            <Col>
              <Select placeholder="ปีการศึกษา" options={yearOptions} value={selectedYear} onChange={setSelectedYear} style={{ width: 200 }} loading={yearOptions.length === 0} size="large" />
            </Col>
            <Col>
              <Select placeholder="ทุกภาคการศึกษา" options={semesterOptions} value={selectedSemester} onChange={setSelectedSemester} style={{ width: 200 }} allowClear size="large" />
            </Col>
          </Row>

          <div>
            <Title level={3}>สรุปภาระงานรายพันธกิจ</Title>
            <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
              <Table columns={summaryColumns} dataSource={summaryData} pagination={false} loading={loading} rowKey="key" />
            </div>
          </div>
          <div>
            <Title level={3}>รายละเอียดภาระงานทั้งหมด</Title>
            <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
              <Table columns={detailColumns} dataSource={reportData} pagination={{ pageSize: 10, showSizeChanger: true }} loading={loading} rowKey="workload_id" scroll={{ x: 'max-content' }} locale={{ emptyText: <Empty description="ไม่พบข้อมูลภาระงานตามเงื่อนไขที่เลือก" /> }} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}