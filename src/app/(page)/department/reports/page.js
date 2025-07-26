"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getDeptHeadReport } from "@/services/deptHeadReports";
import { getAllSubjects } from "@/services/subjects";
import { getInstructors } from "@/services/students";
import { getAllStudents } from "@/services/students";
import { Table, Button, Select, Card, Typography, Space, Spin, message, Empty } from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import Papa from 'papaparse';

const { Title } = Typography;

// **พจนานุกรมสำหรับแปล**
const typeTranslations = {
  'individual': 'เดี่ยว',
  'group': 'กลุ่ม'
};

export default function DeptHeadReportPage() {
  const { userProfile, role, loading: authLoading } = useAuth();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]); // **State ใหม่**
  const [selectedStudent, setSelectedStudent] = useState(null); // **State ใหม่**

  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {
    if (!authLoading && (role === 'department_head' || role === 'admin')) {
      const department = userProfile?.department?.trim();

      // *** LOG จุดที่ 1: ดู department ของผู้บริหาร ***
      console.log("Dept Head's Department:", department);

      if (!department) {
        console.warn("Cannot filter instructors because department head has no department set.");
        return;
      }

      // ดึงข้อมูลสำหรับ dropdowns
      getAllSubjects().then(res => {
        if (res.success) {
          setSubjects(res.data);
          const years = [...new Set(res.data.map(s => s.academic_year))].sort((a, b) => b.localeCompare(a));
          setAcademicYears(years);
        }
      });
      getInstructors().then(res => {
        if (res.success) {
          // *** LOG จุดที่ 2: ดูรายชื่อ instructors ทั้งหมดที่ดึงมาได้ ***
          console.log("All instructors fetched from DB:", res.data);

          const filteredInstructors = res.data.filter(instructor => {
            const instructorDept = instructor.department?.trim();
            // *** LOG จุดที่ 3: ดูการเปรียบเทียบในแต่ละรอบ ***
            console.log(`Comparing: '${instructorDept}' === '${department}' -> ${instructorDept === department}`);
            return instructorDept === department;
          });

          // *** LOG จุดที่ 4: ดูผลลัพธ์หลังการกรอง ***
          console.log("Instructors after filtering for department:", filteredInstructors);

          setInstructors(filteredInstructors);
        }
      });

      getAllStudents().then(res => { // **ดึงข้อมูลนักศึกษา**
        if (res.success) setStudents(res.data);
      });


    }
  }, [authLoading, role, userProfile]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData([]);
    const cleanDepartment = userProfile?.department?.trim();
    if (!cleanDepartment) {
      message.error("ไม่สามารถระบุภาควิชาได้");
      setLoading(false);
      return;
    }

    const filters = {
      department: cleanDepartment,
      academic_year: selectedYear,
      subject_id: selectedSubject,
      teacher_id: selectedInstructor,
      student_id: selectedStudent,
    };
    const result = await getDeptHeadReport(filters);
    if (result.success) {
      setReportData(result.data);
    } else {
      message.error(`เกิดข้อผิดพลาด: ${result.error}`);
    }
    setLoading(false);
  };

  const handleResetFilters = () => {
    setSelectedYear(null);
    setSelectedSubject(null);
    setSelectedInstructor(null);
    setSelectedStudent(null);
    setReportData([]);
  };

  // **ฟังก์ชัน Export CSV**
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      message.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const dataForCSV = reportData.map(item => ({
      'รหัสวิชา': item.subject_code,
      'ปีการศึกษา': item.academic_year,
      'อาจารย์': item.teacher_name,
      'ชื่อภาระงาน': item.assignment_name,
      'ประเภท': typeTranslations[item.assignment_type] || item.assignment_type,
      'ชม. ที่มอบหมาย': item.estimated_hours
    }));
    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `dept-report-${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { title: 'รายวิชา', dataIndex: 'subject_code' },
    { title: 'ปีการศึกษา', dataIndex: 'academic_year' },
    { title: 'อาจารย์', dataIndex: 'teacher_name' },
    { title: 'ชื่อภาระงาน', dataIndex: 'assignment_name' },
    { title: 'ประเภท', dataIndex: 'assignment_type', render: (type) => typeTranslations[type] || type },
    { title: 'ชม. ที่มอบหมาย', dataIndex: 'estimated_hours' },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'department_head' && role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="รายงานสรุปภาระงาน">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2}><FileTextOutlined style={{ marginRight: 8 }} />รายงานสรุปภาระงาน</Title>
          <div style={{ background: '#f0f2f5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <Title level={4} style={{ marginTop: 0 }}>ตัวกรองรายงาน</Title>
            <Space wrap>
              <Select placeholder="ปีการศึกษาทั้งหมด" value={selectedYear} onChange={setSelectedYear} style={{ width: 180 }} allowClear options={academicYears.map(y => ({ value: y, label: `ปีการศึกษา ${y}` }))} />
              <Select showSearch placeholder="รายวิชาทั้งหมด" value={selectedSubject} onChange={setSelectedSubject} style={{ width: 250 }} allowClear options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))} optionFilterProp="label" />
              <Select showSearch placeholder="อาจารย์ทั้งหมด" value={selectedInstructor} onChange={setSelectedInstructor} style={{ width: 220 }} allowClear options={instructors.map(i => ({ value: i.id, label: i.full_name }))} optionFilterProp="label" />
              <Select
                showSearch
                placeholder="นักศึกษาทั้งหมด"
                value={selectedStudent}
                onChange={setSelectedStudent}
                style={{ width: 220 }}
                allowClear
                options={students.map(s => ({ value: s.id, label: `${s.user.full_name} (${s.student_id})` }))}
                optionFilterProp="label"
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerateReport} loading={loading}>ค้นหา</Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>ล้างค่า</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={reportData.length === 0}>Export CSV</Button>
            </Space>
          </div>
          <Table columns={columns} dataSource={reportData} rowKey="assignment_id" loading={loading} bordered />
        </Card>
      </div>
    </DashboardLayout>
  );
}