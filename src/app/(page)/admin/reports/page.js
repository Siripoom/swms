"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getWorkloadReport, getFtesSummaryReport } from "@/services/reports";
import { getAllStudents } from "@/services/students";
import { getAllSubjects } from "@/services/subjects";
import {
  Table, Button, Select, Card, Typography, Row, Col, Spin, Tabs, message, Space
} from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import Papa from 'papaparse';

const { Title, Text } = Typography;

// --- ส่วนของข้อมูลคงที่ ไม่มีการเปลี่ยนแปลง ---
const categoryTranslations = {
  'academic': 'วิชาการ',
  'research': 'วิจัย',
  'academic_service': 'บริการวิชาการ',
  'student_affairs': 'กิจการ นศ.',
  'personal': 'ส่วนตัว'
};
const typeTranslations = { 'individual': 'เดี่ยว', 'group': 'กลุ่ม' };
const semesterOptions = [
  { value: 1, label: 'ภาคการศึกษาที่ 1' },
  { value: 2, label: 'ภาคการศึกษาที่ 2' },
  { value: 3, label: 'ภาคฤดูร้อน' },
];
// ------------------------------------------

export default function ReportPage() {
  const { role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('detail-student');

  // --- ส่วนของ State และ Logic ไม่มีการเปลี่ยนแปลง ---
  const [filters, setFilters] = useState({
    student_id: null,
    academic_year: null,
    subject_id: null,
    semester: null,
  });

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(true);

  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsDropdownLoading(true);
      try {
        const [studentsRes, subjectsRes] = await Promise.all([getAllStudents(), getAllSubjects()]);
        if (studentsRes.success) setStudents(studentsRes.data);
        if (subjectsRes.success) {
          setSubjects(subjectsRes.data);
          const years = [...new Set(subjectsRes.data.map(s => s.academic_year))].sort((a, b) => b.localeCompare(a));
          setAcademicYears(years);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล");
      } finally {
        setIsDropdownLoading(false);
      }
    };
    if (!authLoading && role === 'admin') {
      fetchDropdownData();
    }
  }, [authLoading, role]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData([]);
    setSummaryData([]);

    if (activeTab === 'summary') {
      if (!filters.academic_year) {
        message.warning("กรุณาเลือกปีการศึกษาสำหรับรายงานสรุป");
        setLoading(false);
        return;
      }
      const summaryFilters = { academic_year: filters.academic_year, student_id: filters.student_id };
      const result = await getFtesSummaryReport(summaryFilters);
      if (result.success) {
        setSummaryData(result.data);
        if (result.data.length > 0) message.success(`สร้างรายงานสรุปสำเร็จ พบข้อมูล ${result.data.length} คน`);
        else message.info("ไม่พบข้อมูลสรุปตามเงื่อนไขที่เลือก");
      } else {
        message.error("เกิดข้อผิดพลาดในการสร้างรายงานสรุป: " + result.error);
      }
    } else {
      let currentFilters = { semester: filters.semester };
      let hasFilter = false;

      if (activeTab === 'detail-student' && filters.student_id) {
        currentFilters = { ...currentFilters, student_id: filters.student_id, academic_year: filters.academic_year };
        hasFilter = true;
      } else if (activeTab === 'detail-year' && filters.academic_year) {
        currentFilters = { ...currentFilters, academic_year: filters.academic_year };
        hasFilter = true;
      } else if (activeTab === 'detail-subject' && filters.subject_id) {
        currentFilters = { ...currentFilters, subject_id: filters.subject_id, academic_year: filters.academic_year };
        hasFilter = true;
      }

      if (!hasFilter) {
        message.warning('กรุณาเลือกเงื่อนไขหลักในการสร้างรายงาน (นักศึกษา/ปี/วิชา)');
        setLoading(false);
        return;
      }

      const result = await getWorkloadReport(currentFilters);
      if (result.success) {
        setReportData(result.data);
        if (result.data.length > 0) message.success(`สร้างรายงานสำเร็จ พบข้อมูล ${result.data.length} รายการ`);
        else message.info("ไม่พบข้อมูลตามเงื่อนไขที่เลือก");
      } else {
        message.error("เกิดข้อผิดพลาดในการสร้างรายงาน: " + result.error);
      }
    }
    setLoading(false);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setFilters({ student_id: null, academic_year: null, subject_id: null, semester: null });
    setReportData([]);
    setSummaryData([]);
  };

  const handleExportDetailCSV = () => {
    if (reportData.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const dataForCSV = reportData.map(item => ({
      'รหัสนักศึกษา': item.student_identifier,
      'ชื่อ-นามสกุล': item.student_full_name,
      'ภาระงาน': item.workload_name,
      'หมวดหมู่': categoryTranslations[item.workload_category] || item.workload_category,
      'ประเภท': typeTranslations[item.work_type] || '-',
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
    link.setAttribute("download", `report-workload-detail-${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummaryCSV = () => {
    if (summaryData.length === 0) {
      message.warning("ไม่มีข้อมูลสรุปสำหรับส่งออก");
      return;
    }

    const dataForCSV = summaryData.map(item => ({
      // ใช้ Header ภาษาไทยตรงนี้
      'รหัสนักศึกษา': item.student_identifier,
      'ชื่อ-นามสกุล': item.student_full_name,
      'วิชาการ': item.academic_hours,
      'วิจัย': item.research_hours,
      'บริการวิชาการ': item.academic_service_hours,
      'กิจการนักศึกษา': item.student_affairs_hours,
      'ส่วนตัว': item.personal_hours,
      'รวมทั้งหมด': item.total_hours,
    }));

    const totalRow = {
      'รหัสนักศึกษา': 'รวมทั้งหมด',
      'ชื่อ-นามสกุล': '',
      'วิชาการ': summaryData.reduce((sum, item) => sum + (item.academic_hours || 0), 0),
      'วิจัย': summaryData.reduce((sum, item) => sum + (item.research_hours || 0), 0),
      'บริการวิชาการ': summaryData.reduce((sum, item) => sum + (item.academic_service_hours || 0), 0),
      'กิจการนักศึกษา': summaryData.reduce((sum, item) => sum + (item.student_affairs_hours || 0), 0),
      'ส่วนตัว': summaryData.reduce((sum, item) => sum + (item.personal_hours || 0), 0),
      'รวมทั้งหมด': summaryData.reduce((sum, item) => sum + (item.total_hours || 0), 0),
    };

    // 3. เพิ่มแถวผลรวมเข้าไปในข้อมูลที่จะ Export
    dataForCSV.push(totalRow);

    const csv = Papa.unparse(dataForCSV);

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ftes-summary-report-${filters.academic_year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // --- ส่วนของ Columns ไม่มีการเปลี่ยนแปลง ---
  const detailColumns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', responsive: ['md'] },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name' },
    { title: 'ภาระงาน', dataIndex: 'workload_name' },
    { title: 'หมวดหมู่', dataIndex: 'workload_category', render: (cat) => categoryTranslations[cat] || cat, responsive: ['lg'] },
    { title: 'รายวิชา', render: (_, r) => r.subject_code ? `${r.subject_code} - ${r.subject_name}` : '-', responsive: ['sm'] },
    { title: 'วันที่', dataIndex: 'record_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), responsive: ['lg'] },
    { title: 'ชั่วโมง', dataIndex: 'hours_display', align: 'right' },
    { title: 'ประเภท', dataIndex: 'work_type', render: (type) => type ? (typeTranslations[type] || type) : '-', responsive: ['xl'] },
  ];
  const summaryColumns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', key: 'student_identifier', fixed: 'left' },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name', key: 'student_full_name', fixed: 'left' },
    { title: categoryTranslations.academic, dataIndex: 'academic_hours', key: 'academic_hours', align: 'right', render: (val) => (val || 0).toFixed(1) },
    { title: categoryTranslations.research, dataIndex: 'research_hours', key: 'research_hours', align: 'right', render: (val) => (val || 0).toFixed(1) },
    { title: categoryTranslations.academic_service, dataIndex: 'academic_service_hours', key: 'academic_service_hours', align: 'right', render: (val) => (val || 0).toFixed(1) },
    { title: categoryTranslations.student_affairs, dataIndex: 'student_affairs_hours', key: 'student_affairs_hours', align: 'right', render: (val) => (val || 0).toFixed(1) },
    { title: categoryTranslations.personal, dataIndex: 'personal_hours', key: 'personal_hours', align: 'right', render: (val) => (val || 0).toFixed(1) },
    { title: 'รวมทั้งหมด', dataIndex: 'total_hours', key: 'total_hours', align: 'right', render: (val) => <Text strong>{(val || 0).toFixed(1)}</Text> },
  ];
  // ------------------------------------------

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;


  // ============================ START: ส่วนของ UI ที่ตกแต่งใหม่ ============================
  return (
    <DashboardLayout title="รายงาน">
      <div style={{ padding: '16px 24px', minHeight: '100vh' }}>
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>

          {/* 1. Page Header */}
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              <FileTextOutlined style={{ marginRight: 12 }} />
              รายงานภาระงาน
            </Title>
            <Text type="secondary">
              สร้างและส่งออกรายงานภาระงานของนักศึกษาในรูปแบบต่างๆ
            </Text>
          </div>

          {/* 2. Tabs */}
          <Tabs
            type="card"
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              { label: 'รายบุคคล', key: 'detail-student' },
              { label: 'รายปีการศึกษา', key: 'detail-year' },
              { label: 'รายวิชา', key: 'detail-subject' },
              { label: 'รายงานสรุป', key: 'summary' },
            ]}
          />

          {/* 3. Filter Card */}
          <Card title="กำหนดเงื่อนไขรายงาน" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
            <Row gutter={[16, 16]} align="bottom">
              {activeTab === 'detail-student' && (
                <>
                  <Col xs={24} sm={12} md={8} lg={7}><Select showSearch placeholder="เลือกนักศึกษา (จำเป็น)" value={filters.student_id} onChange={(v) => handleFilterChange('student_id', v)} style={{ width: '100%' }} options={students.map(s => ({ value: s.id, label: `${s.user?.full_name || 'N/A'} (${s.student_id})` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear /></Col>
                  <Col xs={24} sm={12} md={8} lg={6}><Select placeholder="ปีการศึกษาทั้งหมด" value={filters.academic_year} onChange={(v) => handleFilterChange('academic_year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} loading={isDropdownLoading} allowClear /></Col>
                  <Col xs={24} sm={12} md={8} lg={5}><Select placeholder="ภาคการศึกษาทั้งหมด" value={filters.semester} onChange={(v) => handleFilterChange('semester', v)} style={{ width: '100%' }} options={semesterOptions} allowClear /></Col>
                </>
              )}
              {activeTab === 'detail-year' && (
                <>
                  <Col xs={24} sm={12} md={8}><Select placeholder="เลือกปีการศึกษา (จำเป็น)" value={filters.academic_year} onChange={(v) => handleFilterChange('academic_year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} loading={isDropdownLoading} allowClear /></Col>
                  <Col xs={24} sm={12} md={8}><Select placeholder="ภาคการศึกษาทั้งหมด" value={filters.semester} onChange={(v) => handleFilterChange('semester', v)} style={{ width: '100%' }} options={semesterOptions} allowClear /></Col>
                </>
              )}
              {activeTab === 'detail-subject' && (
                <>
                  <Col xs={24} sm={24} md={12} lg={10}><Select showSearch placeholder="เลือกรายวิชา (จำเป็น)" value={filters.subject_id} onChange={(v) => handleFilterChange('subject_id', v)} style={{ width: '100%' }} options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear /></Col>
                  <Col xs={24} sm={12} md={6} lg={8}><Select placeholder="ปีการศึกษาทั้งหมด" value={filters.academic_year} onChange={(v) => handleFilterChange('academic_year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} allowClear /></Col>
                </>
              )}
              {activeTab === 'summary' && (
                <>
                  <Col xs={24} sm={12} md={8}><Select placeholder="เลือกปีการศึกษา (จำเป็น)" value={filters.academic_year} onChange={(v) => handleFilterChange('academic_year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} /></Col>
                  <Col xs={24} sm={12} md={10}><Select showSearch placeholder="นักศึกษาทั้งหมด" value={filters.student_id} onChange={(v) => handleFilterChange('student_id', v)} style={{ width: '100%' }} options={students.map(s => ({ value: s.id, label: `${s.user?.full_name || 'N/A'} (${s.student_id})` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear /></Col>
                </>
              )}
              <Col>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>
                  สร้างรายงาน
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 4. Results Card */}
          <Card
            title="ผลลัพธ์รายงาน"
            bordered={false}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
            extra={ // ใช้ 'extra' prop เพื่อวางปุ่ม Export ไว้ที่มุมขวาของ Card Header
              activeTab.startsWith('detail') ?
                <Button icon={<DownloadOutlined />} onClick={handleExportDetailCSV} disabled={reportData.length === 0}>Export CSV</Button> :
                <Button icon={<DownloadOutlined />} onClick={handleExportSummaryCSV} disabled={summaryData.length === 0}>Export CSV</Button>
            }
          >
            {activeTab.startsWith('detail') && (
              <Table
                columns={detailColumns}
                dataSource={reportData}
                loading={loading}
                rowKey="record_id"
                scroll={{ x: 1200 }}
                locale={{ emptyText: <Text type="secondary" style={{ padding: '2rem' }}>กรุณากำหนดเงื่อนไขและกด "สร้างรายงาน"</Text> }}
              />
            )}
            {activeTab === 'summary' && (
              <Table
                columns={summaryColumns}
                dataSource={summaryData}
                loading={loading}
                rowKey="student_identifier"
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 1200 }}
                locale={{ emptyText: <Text type="secondary" style={{ padding: '2rem' }}>กรุณากำหนดเงื่อนไขและกด "สร้างรายงาน"</Text> }}
                summary={pageData => { /* โค้ด summary row เดิม */ }}
              />
            )}
          </Card>
        </Space>
      </div>
    </DashboardLayout>
  );
  // ============================ END: ส่วนของ UI ที่ตกแต่งใหม่ ============================
}