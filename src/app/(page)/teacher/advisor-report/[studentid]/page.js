"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { getStudentById } from "@/services/students";
import { getDistinctAcademicYears } from "@/services/subjects"; // **Import เพิ่ม**
import { Table, Card, Typography, Spin, message, Button, Empty, Row, Col, Select, Divider } from "antd";
import { BarChartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const categoryTranslations = {
  'academic': 'วิชาการ', 'research': 'วิจัย/นวัตกรรม',
  'academic_service': 'บริการวิชาการ', 'student_affairs': 'กิจการนักศึกษา',
  'personal': 'ส่วนตัว/การใช้ชีวิต'
};

const semesterOptions = [
  { value: 1, label: 'ภาคการศึกษาที่ 1' },
  { value: 2, label: 'ภาคการศึกษาที่ 2' },
  { value: 3, label: 'ภาคฤดูร้อน' },
];

export default function StudentAdvisorReportPage() {
  const { role, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentid;

  const [reportData, setReportData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- States ใหม่สำหรับ Filters ---
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!studentId) return;
      setLoading(true);

      const [studentInfoRes, yearOptionsRes] = await Promise.all([
        getStudentById(studentId),
        getDistinctAcademicYears()
      ]);

      if (studentInfoRes.success) setStudentInfo(studentInfoRes.data);

      if (yearOptionsRes.success && yearOptionsRes.data.length > 0) {
        const options = yearOptionsRes.data.map(year => ({ value: year, label: `ปีการศึกษา ${year}` }));
        setYearOptions(options);
        // ตั้งค่าเริ่มต้นเป็น "ทุกปี" โดยการ set เป็น null
        setSelectedYear(null);
      }

      // ไม่ต้อง fetch report ที่นี่แล้ว useEffect ตัวถัดไปจะทำหน้าที่เอง
      setLoading(false);
    };

    if (!authLoading && (role === 'teacher' || role === 'department_head')) {
      fetchInitialData();
    }
  }, [authLoading, role, studentId]);

  // --- useEffect ใหม่สำหรับดึงข้อมูลรายงานเมื่อ Filter เปลี่ยน ---
  useEffect(() => {
    const fetchReport = async () => {
      if (!studentId) return;
      setLoading(true);
      const filters = {
        student_id: studentId,
        academic_year: selectedYear,
        semester: selectedSemester
      };
      const res = await getMyWorkloadReport(filters);
      if (res.success) {
        setReportData(res.data);
      } else {
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน: " + res.error);
      }
      setLoading(false);
    };

    // จะดึงข้อมูลก็ต่อเมื่อ Auth โหลดเสร็จแล้วเท่านั้น
    if (!authLoading) {
      fetchReport();
    }
  }, [authLoading, studentId, selectedYear, selectedSemester]);

  const summaryData = useMemo(() => {
    const summary = { academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 };
    if (reportData) {
      reportData.forEach(item => { if (item.category in summary) summary[item.category] += item.hours_spent; });
    }
    const data = Object.keys(categoryTranslations).map(key => ({
      key: key,
      category: categoryTranslations[key],
      hours: summary[key] || 0
    }));
    const totalHours = data.reduce((sum, item) => sum + item.hours, 0);
    data.push({ key: 'total', category: 'รวมทั้งหมด', hours: totalHours, isTotal: true });
    return data;
  }, [reportData]);

  const summaryColumns = [
    { title: 'พันธกิจ', dataIndex: 'category', render: (text, record) => record.isTotal ? <Text strong>{text}</Text> : text },
    { title: 'ชั่วโมงรวม', dataIndex: 'hours', render: (h, record) => record.isTotal ? <Text strong>{(h || 0).toFixed(2)}</Text> : (h || 0).toFixed(2) },
    { title: 'เฉลี่ย (ชม./สัปดาห์)', key: 'avg', render: (_, record) => record.isTotal ? <Text strong>{((record.hours || 0) / 16).toFixed(2)}</Text> : ((record.hours || 0) / 16).toFixed(2) },
  ];

  const detailColumns = [
    { title: 'กิจกรรม/ภาระงาน', dataIndex: 'work_name' },
    { title: 'หมวดหมู่', dataIndex: 'category', render: (cat) => categoryTranslations[cat] || cat },
    { title: 'วันที่/ภาคการศึกษา', render: (_, record) => record.work_date ? dayjs(record.work_date).format('DD/MM/YYYY') : `เทอม ${record.semester}/${record.academic_year}` },
    { title: 'ชั่วโมง', dataIndex: 'hours_spent', align: 'right' },
  ];


  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;

  return (
    <DashboardLayout title="รายงานสรุปรายบุคคล">
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mb-4">
          กลับ
        </Button>
        <Card>
          {loading && !studentInfo ? (
            <div className="text-center p-8"><Spin /></div>
          ) : (
            studentInfo ? (
              <>
                <Title level={3}>รายงานสรุปภาระงาน</Title>
                <Text strong>ของ:</Text> <Text>{studentInfo.user.full_name} ({studentInfo.student_id})</Text>

                <Row gutter={16} style={{ margin: '24px 0' }}>
                  <Col>
                    <Select
                      placeholder="ทุกปีการศึกษา"
                      options={yearOptions}
                      value={selectedYear}
                      onChange={setSelectedYear}
                      style={{ width: 200 }}
                      allowClear
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
                <Divider />
                <Title level={4}>สรุปภาระงานรายพันธกิจ</Title>
                <Table columns={summaryColumns} dataSource={summaryData} pagination={false} loading={loading} rowKey="key" />
                <Divider />
                <Title level={4}>รายละเอียดภาระงานทั้งหมด</Title>
                <Table columns={detailColumns} dataSource={reportData} pagination={{ pageSize: 10 }} loading={loading} rowKey="workload_id" />
              </>
            ) : (
              <Empty description="ไม่พบข้อมูลของนักศึกษาคนนี้" />
            )
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}