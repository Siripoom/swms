"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { getDistinctAcademicYears } from "@/services/subjects"; // **Import เพิ่ม**
import { Table, Card, Typography, Spin, Select, Row, Col, Divider, message } from "antd";
import dayjs from 'dayjs';

const { Title } = Typography;

export default function MyReportPage() {
  const { role, loading: authLoading, studentId } = useAuth();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- States สำหรับ Filters ---
  const [yearOptions, setYearOptions] = useState([]); // State สำหรับเก็บตัวเลือกปี
  const [selectedYear, setSelectedYear] = useState(null); // เริ่มต้นเป็น null
  const [selectedSemester, setSelectedSemester] = useState(null);

  const semesterOptions = [
    { value: 1, label: 'ภาคการศึกษาที่ 1' },
    { value: 2, label: 'ภาคการศึกษาที่ 2' },
    { value: 3, label: 'ภาคฤดูร้อน' },
  ];

  // --- useEffect สำหรับดึงข้อมูล Dropdowns (ทำงานครั้งเดียว) ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const res = await getDistinctAcademicYears();
      if (res.success && res.data.length > 0) {
        const options = res.data.map(year => ({
          value: year,
          label: `ปีการศึกษา ${year}`
        }));
        setYearOptions(options);
        // ตั้งค่าปีเริ่มต้นให้เป็นปีล่าสุดที่มีข้อมูล
        setSelectedYear(options[0].value);
      } else {
        // ถ้าไม่มีข้อมูลปีเลย ให้ตั้งค่าเป็นปีปัจจุบัน
        const currentYear = String(new Date().getFullYear() + 543);
        setYearOptions([{ value: currentYear, label: `ปีการศึกษา ${currentYear}` }]);
        setSelectedYear(currentYear);
      }
    };

    if (!authLoading && role === 'student') {
      fetchFilterOptions();
    }
  }, [authLoading, role]);

  // --- useEffect สำหรับดึงข้อมูลรายงาน (ทำงานเมื่อ Filter เปลี่ยน) ---
  useEffect(() => {
    const fetchReport = async () => {
      if (!studentId || !selectedYear) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const filters = {
        student_id: studentId,
        academic_year: selectedYear,
        semester: selectedSemester,
      };
      const res = await getMyWorkloadReport(filters);
      if (res.success) {
        setReportData(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลรายงานได้: " + res.error);
      }
      setLoading(false);
    };

    // จะทำงานก็ต่อเมื่อ Auth และตัวเลือกปีพร้อม
    if (!authLoading && studentId && selectedYear) {
      fetchReport();
    }
  }, [authLoading, studentId, selectedYear, selectedSemester]);

  const summaryData = useMemo(() => {
    const summary = {
      academic: 0, research: 0, academic_service: 0,
      student_affairs: 0, personal: 0
    };
    reportData.forEach(item => {
      if (item.category in summary) {
        summary[item.category] += item.hours_spent;
      }
    });
    return [
      { key: 'student_affairs', category: 'กิจการนักศึกษา', hours: summary.student_affairs },
      { key: 'academic_service', category: 'บริการวิชาการ', hours: summary.academic_service },
      { key: 'academic', category: 'ภาระงานวิชาการ', hours: summary.academic },
      { key: 'research', category: 'วิจัย/นวัตกรรม', hours: summary.research },
      { key: 'personal', category: 'ส่วนตัว/การใช้ชีวิต', hours: summary.personal },
    ];
  }, [reportData]);

  const summaryColumns = [
    { title: 'พันธกิจ', dataIndex: 'category', key: 'category' },
    { title: 'ชั่วโมงรวม', dataIndex: 'hours', key: 'hours', render: (h) => h.toFixed(2) },
    { title: 'เฉลี่ย (ชม./สัปดาห์)', key: 'avg', render: (_, record) => (record.hours / 16).toFixed(2) },
  ];

  const detailColumns = [
    { title: 'กิจกรรม/ภาระงาน', dataIndex: 'work_name', key: 'work_name' },
    { title: 'หมวดหมู่', dataIndex: 'category', key: 'category' },
    { title: 'วันที่/ภาคการศึกษา', key: 'date_semester', render: (_, record) => record.work_date ? dayjs(record.work_date).format('DD/MM/YYYY') : `เทอม ${record.semester}/${record.academic_year}` },
    { title: 'ชั่วโมง', dataIndex: 'hours_spent', key: 'hours_spent', align: 'right' },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานของฉัน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2}>รายงานของฉัน</Title>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col>
              <Select
                placeholder="ปีการศึกษา"
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 200 }}
                loading={yearOptions.length === 0}
              />
            </Col>
            <Col>
              <Select
                placeholder="ทุกภาคการศึกษา"
                options={semesterOptions}
                value={selectedSemester}
                onChange={setSelectedSemester}
                style={{ width: 200 }}
                allowClear
              />
            </Col>
          </Row>

          <Title level={4}>สรุปภาระงานรายพันธกิจ</Title>
          <Table columns={summaryColumns} dataSource={summaryData} pagination={false} loading={loading} rowKey="key" />

          <Divider />

          <Title level={4}>รายละเอียดภาระงานทั้งหมด</Title>
          <Table columns={detailColumns} dataSource={reportData} pagination={{ pageSize: 10 }} loading={loading} rowKey="workload_id" />
        </Card>
      </div>
    </DashboardLayout>
  );
}