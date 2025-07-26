"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getWorkloadReport } from "@/services/reports";
import { getAllStudents } from "@/services/students";
import { getAllSubjects } from "@/services/subjects";
import {
  Table, Button, Select, Card, Typography, Row, Col, Spin, Tabs, message, Space
} from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import Papa from 'papaparse';

const { Title, Text } = Typography;


const categoryTranslations = {
  'academic': 'วิชาการ',
  'research': 'วิจัย/นวัตกรรม',
  'academic_service': 'บริการวิชาการ',
  'student_affairs': 'กิจการนักศึกษา',
  'personal': 'ส่วนตัว'
};

const typeTranslations = {
  'individual': 'งานเดี่ยว',
  'group': 'งานกลุ่ม'
};


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
          const years = [...new Set(subjectsRes.data.map(s => s.academic_year))].sort((a, b) => b - a);
          setAcademicYears(years);
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
    let filters = {};
    if (filterMode === 'student') filters.student_id = selectedStudent;
    if (filterMode === 'year') filters.academic_year = selectedYear;
    if (filterMode === 'subject') filters.subject_id = selectedSubject;

    // อนุญาตให้กรองแบบไม่เลือกเงื่อนไขได้
    // if (filterMode !== 'year' && !filters.student_id && !filters.subject_id) {
    //     message.warning('กรุณาเลือกเงื่อนไขในการสร้างรายงาน');
    //     return;
    // }

    setLoading(true);
    setReportData([]);
    const result = await getWorkloadReport(filters);
    if (result.success) {
      setReportData(result.data);
      message.info(`พบข้อมูล ${result.data.length} รายการ`);
    } else {
      message.error("เกิดข้อผิดพลาดในการสร้างรายงาน: " + result.error);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออก กรุณาสร้างรายงานก่อน");
      return;
    }

    const dataForCSV = reportData.map(item => ({
      'รหัสนักศึกษา': item.student_identifier,
      'ชื่อ-นามสกุล': item.student_full_name,
      'ภาระงาน': item.workload_name,
      'หมวดหมู่': categoryTranslations[item.workload_category] || item.workload_category, // **ใช้พจนานุกรม**
      'ประเภท': typeTranslations[item.work_type] || '-', // **ใช้พจนานุกรม**
      'ชั่วโมง': item.hours_display,
      'รหัสวิชา': item.subject_code || '-',
      'ชื่อวิชา': item.subject_name || '-',
      'วันที่': item.record_date,
    }));

    const csv = Papa.unparse(dataForCSV);

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report-workload-${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("ส่งออกข้อมูลเป็นไฟล์ CSV สำเร็จ");
  };

  const columns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', key: 'student_identifier' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name', key: 'student_full_name' },
    { title: 'ภาระงาน', dataIndex: 'workload_name', key: 'workload_name' },
    {
      title: 'หมวดหมู่',
      dataIndex: 'workload_category',
      key: 'workload_category',
      // ใช้ render function เพื่อแปลค่า
      render: (category) => categoryTranslations[category] || category
    },
    { title: 'รายวิชา', key: 'subject', render: (_, r) => r.subject_code ? `${r.subject_code}` : '-' },
    // *** จุดที่แก้ไข ***
    { title: 'วันที่', dataIndex: 'record_date', key: 'record_date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { title: 'ชั่วโมง', dataIndex: 'hours_display', key: 'hours_display', align: 'right' },
    {
      title: 'ประเภท',
      dataIndex: 'work_type',
      key: 'work_type',
      // ใช้ render function เพื่อแปลค่า
      render: (type) => type ? (typeTranslations[type] || type) : '-'
    },
  ];

  const renderFilters = () => {
    switch (filterMode) {
      case 'student':
        return <Select showSearch placeholder="เลือกนักศึกษา..." value={selectedStudent} onChange={setSelectedStudent} style={{ width: 300 }} options={students.map(s => ({ value: s.id, label: `${s.user?.full_name || 'N/A'} (${s.student_id})` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear />;
      case 'year':
        return <Select placeholder="เลือกปีการศึกษา..." value={selectedYear} onChange={setSelectedYear} style={{ width: 300 }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} loading={isDropdownLoading} allowClear />;
      case 'subject':
        return <Select showSearch placeholder="เลือกรายวิชา..." value={selectedSubject} onChange={setSelectedSubject} style={{ width: 300 }} options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear />;
      default:
        return null;
    }
  }

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

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
            <Button type="default" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>
              แสดงข้อมูล
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={reportData.length === 0}>
              Export to CSV
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={reportData}
            rowKey="workload_id"
            loading={loading}
            scroll={{ x: 1300 }}
            bordered
            locale={{ emptyText: 'กรุณาเลือกเงื่อนไขและกด "แสดงข้อมูล" เพื่อสร้างรายงาน' }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}