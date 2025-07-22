"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getTeacherWorkloadSummary } from "@/services/teacherReports";
import { getSubjectsForTeacher } from "@/services/assignments";
import {
  Table, Button, Select, Card, Typography, Space, Spin, message
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function TeacherReportPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && role === 'teacher') {
      getSubjectsForTeacher().then(res => {
        if (res.success) {
          setSubjects(res.data);
        } else {
          message.error("ไม่สามารถดึงข้อมูลรายวิชาได้");
        }
      });
    }
  }, [authLoading, role]);

  const handleGenerateReport = async () => {
    if (!user?.id) {
      message.error("ไม่สามารถระบุตัวตนอาจารย์ได้ กรุณาลองเข้าสู่ระบบใหม่");
      return;
    }

    setLoading(true);
    setReportData([]); // เคลียร์ข้อมูลเก่าก่อน
    const filters = {
      teacher_id: user.id,
      subject_id: selectedSubject,
      year_level: selectedYear,
    };

    console.log("Generating report with filters:", filters); // Log สำหรับดีบัก

    const result = await getTeacherWorkloadSummary(filters);

    if (result.success) {
      setReportData(result.data);
      message.success(`สร้างรายงานสำเร็จ พบ ${result.data.length} รายการ`);
    } else {
      message.error(`เกิดข้อผิดพลาด: ${result.error}`);
    }
    setLoading(false);
  };

  const handleResetFilters = () => {
    setSelectedSubject(null);
    setSelectedYear(null);
    setReportData([]);
  };

  const columns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', key: 'student_identifier', sorter: (a, b) => a.student_identifier.localeCompare(b.student_identifier) },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name', key: 'student_full_name' },
    { title: 'ชั้นปี', dataIndex: 'student_year_level', key: 'student_year_level', sorter: (a, b) => a.student_year_level - b.student_year_level },
    { title: 'จำนวนงานทั้งหมด', dataIndex: 'total_assignments', key: 'total_assignments', render: (val) => `${val || 0} งาน` },
    { title: 'ชั่วโมงรวม', dataIndex: 'total_hours_spent', key: 'total_hours_spent', render: (val) => `${Number(val || 0).toFixed(1)} ชั่วโมง` },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'teacher') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานสรุปภาระงาน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2}>รายงานสรุปภาระงาน</Title>
          <div style={{ background: '#f0f2f5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <Title level={4} style={{ marginTop: 0 }}>ตัวกรองรายงาน</Title>
            <Space wrap>
              <Select
                placeholder="รายวิชาทั้งหมด"
                value={selectedSubject}
                onChange={setSelectedSubject}
                style={{ width: 250 }}
                allowClear
                options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))}
                optionFilterProp="label"
                showSearch
              />
              <Select
                placeholder="ชั้นปีทั้งหมด"
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 150 }}
                allowClear
                options={[
                  { value: 1, label: 'ปี 1' },
                  { value: 2, label: 'ปี 2' },
                  { value: 3, label: 'ปี 3' },
                  { value: 4, label: 'ปี 4' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>
                สร้างรายงาน
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                รีเซ็ต
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={reportData}
            rowKey="student_record_id"
            loading={loading}
            bordered
            locale={{ emptyText: 'กรุณาเลือกเงื่อนไขและกด "สร้างรายงาน"' }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}