"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getTeacherWorkloadSummary, getSubjectsByTeacher } from "@/services/teacherReports";
import {
  Table, Button, Select, Card, Typography, Space, Spin, message, Empty
} from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import Papa from 'papaparse';

const { Title } = Typography;

export default function TeacherReportPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    if (!authLoading && user && role === 'teacher') {
      getSubjectsByTeacher(user.id).then(res => {
        if (res.success) setSubjects(res.data);
      });
    }
  }, [authLoading, user, role]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData([]); // เคลียร์ข้อมูลเก่า
    const filters = {
      teacher_id: user.id,
      subject_id: selectedSubject,
      year_level: selectedYear,
    };
    const result = await getTeacherWorkloadSummary(filters);
    if (result.success) {
      setReportData(result.data);
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

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const dataForCSV = reportData.map(item => ({
      'รหัสนักศึกษา': item.student_identifier,
      'ชื่อ-นามสกุล': item.student_full_name,
      'ชั้นปี': item.student_year_level,
      'จำนวนงานทั้งหมด': item.total_assignments,
      'ชั่วโมงรวม': item.total_hours_spent,
    }));
    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `teacher-report-${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("ส่งออกข้อมูลสำเร็จ");
  };

  const columns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name' },
    { title: 'ชั้นปี', dataIndex: 'student_year_level', render: (year) => `ปี ${year}` },
    { title: 'จำนวนภาระงาน', dataIndex: 'total_assignments', render: (val) => `${val || 0} รายการ` },
    { title: 'ชั่วโมงรวม', dataIndex: 'total_hours_spent', render: (val) => `${Number(val || 0).toFixed(1)} ชั่วโมง` },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'teacher') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานสรุปภาระงาน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2}><FileTextOutlined style={{ marginRight: 8 }} />รายงานสรุปภาระงาน</Title>
          <div style={{ background: '#f0f2f5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <Title level={4} style={{ marginTop: 0 }}>ตัวกรองรายงาน</Title>
            <Space wrap>
              <Select
                placeholder="รายวิชาทั้งหมดที่สอน" value={selectedSubject} onChange={setSelectedSubject} style={{ width: 250 }} allowClear
                options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))}
              />
              <Select
                placeholder="ชั้นปีทั้งหมด" value={selectedYear} onChange={setSelectedYear} style={{ width: 150 }} allowClear
                options={[{ value: 1, label: 'ปี 1' }, { value: 2, label: 'ปี 2' }, { value: 3, label: 'ปี 3' }, { value: 4, label: 'ปี 4' }]}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>สร้างรายงาน</Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>รีเซ็ต</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={reportData.length === 0}>Export CSV</Button>
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