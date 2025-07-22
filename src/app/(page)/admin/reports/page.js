"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getWorkloadReport } from "@/services/reports";
import { getAllStudents } from "@/services/students";
import { getAllSubjects } from "@/services/subjects";
import {
  Table, Button, Select, Card, Typography, Spin, Tabs, message, Space
} from "antd";
import { SearchOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ReportPage() {
  const { role, loading: authLoading } = useAuth();

  const [filterMode, setFilterMode] = useState('student');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(true);

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsDropdownLoading(true);
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          getAllStudents(),
          getAllSubjects()
        ]);

        if (studentsRes.success) {
          setStudents(studentsRes.data);
        } else {
          message.error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
        }

        if (subjectsRes.success) {
          setSubjects(subjectsRes.data);
          const years = [...new Set(studentsRes.data.map(s => s.academic_year))];

          setAcademicYears(years.sort((a, b) => b.localeCompare(a))); // เรียงจากมากไปน้อย

        } else {
          message.error("ไม่สามารถดึงข้อมูลรายวิชาได้");
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูลรายงาน");
      } finally {
        setIsDropdownLoading(false);
      }
    };

    if (!authLoading && role === 'admin') {
      fetchDropdownData();
    }
  }, [authLoading, role]);

  const handleGenerateReport = async () => {
    console.log('filterMode:', filterMode);
    console.log('selectedStudent:', selectedStudent);
    console.log('selectedYear:', selectedYear);
    console.log('selectedSubject:', selectedSubject);

    let filters = {};
    if (filterMode === 'student') {
      if (!selectedStudent) {
        message.warning('กรุณาเลือกนักศึกษา');
        return;
      }
      filters.student_id = selectedStudent;
    }

    if (filterMode === 'year') {
      if (!selectedYear) {
        message.warning('กรุณาเลือกปีการศึกษา');
        return;
      }
      filters.academic_year = selectedYear.toString();
    }

    if (filterMode === 'subject') {
      if (!selectedSubject) {
        message.warning('กรุณาเลือกรายวิชา');
        return;
      }
      filters.subject_id = selectedSubject;
    }

    setLoading(true);
    setReportData([]);
    console.log('Filters to send:', filters);

    try {
      const result = await getWorkloadReport(filters);
      console.log('Result:', result);

      if (result.success) {
        setReportData(result.data);
        message.success(`สร้างรายงานสำเร็จ พบ ${result.data.length} รายการ`);
      } else {
        message.error("เกิดข้อผิดพลาดในการสร้างรายงาน: " + result.error);
      }
    } catch (err) {
      message.error("เกิดข้อผิดพลาดในการเรียกข้อมูลรายงาน");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', key: 'student_identifier', fixed: 'left', width: 120 },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name', key: 'student_full_name', fixed: 'left', width: 200 },
    { title: 'ภาระงาน', dataIndex: 'workload_name', key: 'workload_name', width: 250 },
    { title: 'หมวดหมู่', dataIndex: 'workload_category', key: 'workload_category', width: 150 },
    { title: 'รายวิชา', key: 'subject', render: (_, r) => r.subject_code ? `${r.subject_code} - ${r.subject_name}` : '-', width: 250 },
    { title: 'วันที่ทำ', dataIndex: 'work_date', key: 'work_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), width: 120 },
    { title: 'ชั่วโมง', dataIndex: 'hours_spent', key: 'hours_spent', width: 100, align: 'right' },
  ];

  const renderFilters = () => {
    switch (filterMode) {
      case 'student':
        return (
          <Select
            showSearch
            placeholder="เลือกนักศึกษา..."
            value={selectedStudent}
            onChange={setSelectedStudent}
            style={{ width: 300 }}
            options={students.map(s => ({
              value: s.id,
              label: `${s.user?.full_name || 'N/A'} (${s.student_id})`
            }))}
            optionFilterProp="label"
            loading={isDropdownLoading}
            allowClear
          />
        );
      case 'year':
        return (
          <Select
            placeholder="เลือกปีการศึกษา..."
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
            options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))}
            allowClear
          />
        );
      case 'subject':
        return (
          <Select
            showSearch
            placeholder="เลือกรายวิชา..."
            value={selectedSubject}
            onChange={setSelectedSubject}
            style={{ width: 300 }}
            options={subjects.map(s => ({
              value: s.id,
              label: `${s.subject_code} - ${s.subject_name}`
            }))}
            optionFilterProp="label"
            loading={isDropdownLoading}
            allowClear
          />
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <DashboardLayout>
        <div>Access Denied</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="รายงาน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2} style={{ margin: 0, marginBottom: 16 }}>
            <FileTextOutlined style={{ marginRight: 8 }} /> รายงานภาระงานนักศึกษา
          </Title>

          <Tabs
            activeKey={filterMode}
            onChange={(key) => {
              setFilterMode(key);
              setSelectedStudent(null);
              setSelectedYear(null);
              setSelectedSubject(null);
              setReportData([]);
            }}
            items={[
              { label: 'รายบุคคล', key: 'student' },
              { label: 'รายปีการศึกษา', key: 'year' },
              { label: 'รายวิชา', key: 'subject' },
            ]}
          />

          <Space style={{ marginTop: 16, marginBottom: 24 }} wrap>
            {renderFilters()}
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleGenerateReport}
              loading={loading}
            >
              สร้างรายงาน
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={reportData}
            rowKey="workload_id"
            loading={loading}
            scroll={{ x: 1300 }}
            bordered
            locale={{
              emptyText: 'กรุณาเลือกเงื่อนไขและกด "สร้างรายงาน" เพื่อแสดงข้อมูล',
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
