"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport, getStudentProfileByUserId } from "@/services/workloads";
import { Table, Card, Typography, Spin, Select, Row, Col, Divider, message } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

const generateYearOptions = () => {
  const currentBuddhistYear = new Date().getFullYear() + 543;
  return Array.from({ length: 5 }, (_, i) => {
    const year = currentBuddhistYear - i;
    return { value: String(year), label: `ปีการศึกษา ${year}` };
  });
};

export default function MyReportPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [studentId, setStudentId] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0
  });

  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear() + 543));
  const [selectedSemester, setSelectedSemester] = useState(null);

  const yearOptions = generateYearOptions();
  const semesterOptions = [
    { value: 1, label: 'ภาคการศึกษาที่ 1' },
    { value: 2, label: 'ภาคการศึกษาที่ 2' },
    { value: 3, label: 'ภาคฤดูร้อน' },
  ];

  const calculateSummary = (data) => {
    const summaryData = {
      academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0
    };

    data.forEach(item => {
      const category = item?.category || item?.workload_category;
      const hours = parseFloat(item?.hours_spent || 0);
      if (category in summaryData && !isNaN(hours)) {
        summaryData[category] += hours;
      }
    });

    setSummary(summaryData);
  };

  const fetchReportData = useCallback(async (currentStudentId) => {
    setLoading(true);
    const filters = {
      student_id: currentStudentId,
      academic_year: selectedYear,
      semester: selectedSemester,
    };

    const res = await getMyWorkloadReport(filters);
    if (res.success && res.data) {
      console.log("--- STEP 2.1: Response from getMyWorkloadReport service:");
      console.table(res.data); // ✅ ใส่ตรงนี้
      console.log(">> FILTER:", filters);

      setReportData(res.data);
      calculateSummary(res.data);
    } else {
      message.error("ไม่สามารถดึงข้อมูลรายงานได้: " + res.error);
      setReportData([]);
      calculateSummary([]);
    }
    setLoading(false);
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    const initializeStudentId = async () => {
      if (!authLoading && user && role === 'student') {
        const profileRes = await getStudentProfileByUserId(user.id);
        if (profileRes.success && profileRes.data?.id) {
          setStudentId(profileRes.data.id);
        } else {
          message.error("ไม่พบข้อมูลโปรไฟล์นักศึกษาของคุณ");
          setLoading(false);
        }
      }
    };
    initializeStudentId();
  }, [authLoading, user, role]);

  useEffect(() => {
    if (studentId) fetchReportData(studentId);
  }, [studentId, fetchReportData]);

  const summaryColumns = [
    { title: 'พันธกิจ', dataIndex: 'category', key: 'category' },
    { title: 'ชั่วโมงรวม', dataIndex: 'hours', key: 'hours', render: (h) => Number(h || 0).toFixed(2) },
    { title: 'เฉลี่ย (ชม./สัปดาห์)', key: 'avg', render: (_, r) => (Number(r.hours || 0) / 16).toFixed(2) },
  ];

  const summaryDataSource = [
    { key: 'student_affairs', category: 'กิจการนักศึกษา', hours: summary.student_affairs },
    { key: 'academic_service', category: 'บริการวิชาการ', hours: summary.academic_service },
    { key: 'academic', category: 'ภาระงานวิชาการ', hours: summary.academic },
    { key: 'research', category: 'วิจัย/นวัตกรรม', hours: summary.research },
    { key: 'personal', category: 'ส่วนตัว/การใช้ชีวิต', hours: summary.personal },
  ];

  const detailColumns = [
    { title: 'กิจกรรม/ภาระงาน', dataIndex: 'work_name', key: 'work_name' },
    { title: 'หมวดหมู่', dataIndex: 'workload_category', key: 'workload_category' },
    { title: 'วันที่/ภาคการศึกษา', key: 'date_semester', render: (_, r) => r.work_date ? dayjs(r.work_date).format('DD/MM/YYYY') : (r.semester ? `เทอม ${r.semester}/${r.academic_year}` : '-') },
    {
      title: 'ชั่วโมง',
      key: 'hours',
      align: 'right',
      render: (_, r) => Number(r.hours_spent || 0).toFixed(2)
    },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานของฉัน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2}>รายงานของฉัน</Title>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col><Select placeholder="ปีการศึกษา" options={yearOptions} value={selectedYear} onChange={setSelectedYear} style={{ width: 200 }} /></Col>
            <Col><Select placeholder="ทุกภาคการศึกษา" options={semesterOptions} value={selectedSemester} onChange={setSelectedSemester} style={{ width: 200 }} allowClear /></Col>
          </Row>
          <Title level={4}>สรุปภาระงานรายพันธกิจ (เฉลี่ย/สัปดาห์)</Title>
          <Table columns={summaryColumns} dataSource={summaryDataSource} pagination={false} loading={loading} rowKey="key" />
          <Divider />
          <Title level={4}>รายละเอียดภาระงานทั้งหมด</Title>
          <Table columns={detailColumns} dataSource={reportData} pagination={{ pageSize: 10 }} loading={loading} rowKey="workload_id" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
