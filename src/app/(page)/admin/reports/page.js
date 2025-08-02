"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getWorkloadReport, getFtesSummaryReport } from "@/services/reports";
import { getAllStudents } from "@/services/students";
import { getAllSubjects } from "@/services/subjects";
import {
  Table, Button, Select, Typography, Row, Col, Spin, Tabs, message, Space, Grid, Empty
} from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import Papa from 'papaparse';

const { Title } = Typography;
const { useBreakpoint } = Grid;

// Dictionary สำหรับแปลค่าจาก DB เป็นภาษาไทย เพื่อแสดงผลใน UI และ CSV
const categoryTranslations = {
  'academic': 'วิชาการ',
  'research': 'วิจัย/นวัตกรรม',
  'academic_service': 'บริการวิชาการ',
  'student_affairs': 'กิจการนักศึกษา',
  'personal': 'ส่วนตัว'
};

const typeTranslations = {
  'individual': 'เดี่ยว',
  'group': 'กลุ่ม'
};

export default function ReportPage() {
  const { role, loading: authLoading } = useAuth();
  const screens = useBreakpoint(); // Hook สำหรับเช็คขนาดหน้าจอ (สำคัญสำหรับ Responsive)

  const [activeTab, setActiveTab] = useState('detail-year');

  // State สำหรับเก็บค่าในฟิลเตอร์
  const [filters, setFilters] = useState({
    student: null,
    year: null,
    subject: null,
  });

  // State สำหรับเก็บข้อมูลที่ต้องใช้ใน Dropdown
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [isDropdownLoading, setIsDropdownLoading] = useState(true);

  // State สำหรับเก็บข้อมูลรายงาน
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false); // Loading สำหรับการสร้างรายงาน

  // ดึงข้อมูลสำหรับใส่ใน Dropdown filter
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsDropdownLoading(true);
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          getAllStudents(),
          getAllSubjects()
        ]);
        if (studentsRes.success) setStudents(studentsRes.data);
        if (subjectsRes.success) {
          setSubjects(subjectsRes.data);
          const years = [...new Set(subjectsRes.data.map(s => s.academic_year))].sort((a, b) => b - a);
          setAcademicYears(years);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูลสำหรับตัวกรอง");
      } finally {
        setIsDropdownLoading(false);
      }
    };
    if (!authLoading && role === 'admin') {
      fetchDropdownData();
    }
  }, [authLoading, role]);

  // Handler เมื่อมีการเปลี่ยนค่าในฟิลเตอร์
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handler เมื่อกดปุ่ม "สร้างรายงาน"
  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData([]);
    setSummaryData([]);

    // Logic สำหรับรายงานสรุป (FTES)
    if (activeTab === 'summary') {
      if (!filters.year) {
        message.warning("กรุณาเลือกปีการศึกษาสำหรับรายงานสรุป");
        setLoading(false);
        return;
      }
      const result = await getFtesSummaryReport(filters.year);
      if (result.success) {
        setSummaryData(result.data);
        if (result.data.length > 0) {
          message.success(`สร้างรายงานสรุปสำเร็จ`);
        } else {
          message.info(`ไม่พบข้อมูลสำหรับรายงานสรุปในปีการศึกษา ${filters.year}`);
        }
      } else {
        message.error("เกิดข้อผิดพลาดในการสร้างรายงานสรุป: " + result.error);
      }
    }
    // Logic สำหรับรายงานแบบละเอียด
    else {
      let currentFilters = {};
      let hasFilter = false;
      if (activeTab === 'detail-student' && filters.student) {
        currentFilters.student_id = filters.student;
        hasFilter = true;
      }
      if (activeTab === 'detail-year' && filters.year) {
        currentFilters.academic_year = filters.year;
        hasFilter = true;
      }
      if (activeTab === 'detail-subject' && filters.subject) {
        currentFilters.subject_id = filters.subject;
        hasFilter = true;
      }

      if (!hasFilter) {
        message.warning('กรุณาเลือกเงื่อนไขในการสร้างรายงาน');
        setLoading(false);
        return;
      }

      const result = await getWorkloadReport(currentFilters);
      if (result.success) {
        setReportData(result.data);
        if (result.data.length > 0) {
          message.success(`พบข้อมูล ${result.data.length} รายการ`);
        } else {
          message.info('ไม่พบข้อมูลตามเงื่อนไขที่ระบุ');
        }
      } else {
        message.error("เกิดข้อผิดพลาดในการสร้างรายงาน: " + result.error);
      }
    }
    setLoading(false);
  };

  // Handler เมื่อเปลี่ยน Tab
  const handleTabChange = (key) => {
    setActiveTab(key);
    // Reset ฟิลเตอร์และข้อมูลเมื่อเปลี่ยนแท็บ
    setFilters({ student: null, year: null, subject: null });
    setReportData([]);
    setSummaryData([]);
  };

  // Handler สำหรับ Export CSV (รายงานละเอียด)
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
      'วันที่': dayjs(item.record_date).format('YYYY-MM-DD'),
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

  // Handler สำหรับ Export CSV (รายงานสรุป)
  const handleExportSummaryCSV = () => {
    if (summaryData.length === 0) {
      message.warning("ไม่มีข้อมูลสรุปสำหรับส่งออก");
      return;
    }
    const totalHours = summaryData.reduce((sum, item) => sum + Number(item.total_hours), 0);
    const dataForCSV = summaryData.map(item => ({
      'ประเภทภาระงาน': categoryTranslations[item.category] || item.category,
      'ผลรวมชั่วโมง': item.total_hours
    }));
    dataForCSV.push({ 'ประเภทภาระงาน': 'รวมทั้งหมด', 'ผลรวมชั่วโมง': totalHours });
    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `ftes-summary-report-${filters.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // นิยามคอลัมน์สำหรับตารางรายงานละเอียด พร้อม `responsive` prop
  const detailColumns = [
    { title: 'รหัสนักศึกษา', dataIndex: 'student_identifier', key: 'student_identifier', fixed: 'left', width: 120 },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'student_full_name', key: 'student_full_name', fixed: 'left', width: 200 },
    { title: 'ภาระงาน', dataIndex: 'workload_name', key: 'workload_name', width: 250, responsive: ['lg'] },
    { title: 'หมวดหมู่', dataIndex: 'workload_category', key: 'workload_category', render: (cat) => categoryTranslations[cat] || cat, width: 150, responsive: ['md'] },
    { title: 'รายวิชา', key: 'subject', render: (_, r) => r.subject_code ? `${r.subject_code} - ${r.subject_name}` : '-', width: 250, responsive: ['lg'] },
    { title: 'วันที่', dataIndex: 'record_date', key: 'record_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), width: 120, responsive: ['md'] },
    { title: 'ชั่วโมง', dataIndex: 'hours_display', key: 'hours_display', width: 100, align: 'right' },
    { title: 'ประเภท', dataIndex: 'work_type', key: 'work_type', render: (type) => type ? (typeTranslations[type] || type) : '-', width: 100, responsive: ['sm'] },
  ];

  // นิยามคอลัมน์สำหรับตารางสรุป
  const summaryColumns = [
    { title: 'ประเภทภาระงาน', dataIndex: 'category', render: (cat) => categoryTranslations[cat] || cat },
    { title: 'ผลรวมชั่วโมง', dataIndex: 'total_hours', align: 'right' },
  ];

  // Component สำหรับสร้างแผงฟิลเตอร์แบบ Responsive
  const renderFilterPanel = () => {
    const filterSelects = {
      'detail-student': <Select showSearch placeholder="เลือกนักศึกษา..." value={filters.student} onChange={(v) => handleFilterChange('student', v)} style={{ width: '100%' }} options={students.map(s => ({ value: s.id, label: `${s.user?.full_name || 'N/A'} (${s.student_id})` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear />,
      'detail-year': <Select placeholder="เลือกปีการศึกษา..." value={filters.year} onChange={(v) => handleFilterChange('year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} loading={isDropdownLoading} allowClear />,
      'detail-subject': <Select showSearch placeholder="เลือกรายวิชา..." value={filters.subject} onChange={(v) => handleFilterChange('subject', v)} style={{ width: '100%' }} options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name} (${s.academic_year})` }))} optionFilterProp="label" loading={isDropdownLoading} allowClear />,
      'summary': <Select placeholder="เลือกปีการศึกษา..." value={filters.year} onChange={(v) => handleFilterChange('year', v)} style={{ width: '100%' }} options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} loading={isDropdownLoading} allowClear />,
    };

    return (
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={activeTab === 'detail-subject' ? 10 : 8}>
            {filterSelects[activeTab]}
          </Col>
          <Col xs={24} sm={12} md="auto">
            <Space wrap>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>
                สร้างรายงาน
              </Button>
              {activeTab.startsWith('detail') &&
                <Button icon={<DownloadOutlined />} onClick={handleExportDetailCSV} disabled={reportData.length === 0}>
                  {screens.xs ? '' : 'Export CSV'}
                </Button>
              }
              {activeTab === 'summary' &&
                <Button icon={<DownloadOutlined />} onClick={handleExportSummaryCSV} disabled={summaryData.length === 0}>
                  {screens.xs ? '' : 'Export CSV'}
                </Button>
              }
            </Space>
          </Col>
        </Row>
      </div>
    );
  };

  // แสดง Loading ขณะรอการยืนยันสิทธิ์
  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;

  // แสดง Access Denied หากไม่ใช่ admin
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงาน">
      {/* ใช้ Layout และ Style แบบเดียวกับหน้าจัดการรายวิชา */}
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ส่วนหัวของหน้า */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <Title level={2} className="!mb-1 flex items-center gap-3">
              <FileTextOutlined /> รายงานภาระงาน
            </Title>
          </div>

          {/* ส่วนแท็บและฟิลเตอร์ */}
          <Tabs
            type="card"
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              { label: 'รายบุคคล', key: 'detail-student' },
              { label: 'รายปีการศึกษา', key: 'detail-year' },
              { label: 'รายวิชา', key: 'detail-subject' },
              { label: 'สรุป', key: 'summary' },
            ]}
          />
          {renderFilterPanel()}

          {/* ส่วนแสดงตารางข้อมูล */}
          <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
            {activeTab.startsWith('detail') &&
              <Table
                columns={detailColumns}
                dataSource={reportData}
                loading={loading}
                rowKey="record_id"
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: <Empty description="กรุณาเลือกเงื่อนไขและกด 'สร้างรายงาน'" /> }}
              />
            }
            {activeTab === 'summary' &&
              <Table
                columns={summaryColumns}
                dataSource={summaryData}
                loading={loading}
                rowKey="category"
                pagination={false}
                locale={{ emptyText: <Empty description="กรุณาเลือกปีการศึกษาและกด 'สร้างรายงาน'" /> }}
              />
            }
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}