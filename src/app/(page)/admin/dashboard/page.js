"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAdminDashboardSummary,
  getDashboardWorkloadByYearLevel,
  getDashboardWorkloadBySubject,
  getDashboardCreditVsWorkload,
  getDashboardProportionComparison,
} from "@/services/adminDashboard";
import { Spin, Card, Typography, Row, Col, Select, message, Empty, Space } from "antd";
import dynamic from 'next/dynamic';
import {
  BarChartOutlined, AreaChartOutlined, DotChartOutlined, PieChartOutlined, TeamOutlined, BookOutlined, RiseOutlined, ApartmentOutlined, UsergroupAddOutlined
} from "@ant-design/icons";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text } = Typography;

// --- 1. ออกแบบ StatCard ใหม่ ---
const StatCard = ({ title, value, unit, icon, color }) => (
  <Card bordered={false} className="shadow-md h-full">
    <div className="flex items-start">
      <div className="text-2xl p-3 rounded-lg mr-4" style={{ backgroundColor: `${color}1A`, color: color }}>
        {icon}
      </div>
      <div>
        <Text type="secondary" className="font-medium">{title}</Text>
        <Title level={4} className="!mt-1 !mb-0">{value} <span className="text-lg font-normal">{unit}</span></Title>
      </div>
    </div>
  </Card>
);

// --- 2. สร้าง ChartCard Component เพื่อความสะอาด ---
const ChartCard = ({ title, icon, chartData, loading, type = 'bar' }) => (
  <Card
    title={<div className="flex items-center gap-2"><div className="text-lg">{icon}</div>{title}</div>}
    bordered={false}
    className="shadow-md h-full"
  >
    <div style={{ height: 350 }}>
      {loading ? (
        <div className="flex items-center justify-center h-full"><Spin /></div>
      ) : chartData ? (
        <Chart options={chartData.options} series={chartData.series} type={type} height="100%" />
      ) : (
        <div className="flex items-center justify-center h-full"><Empty description="ไม่มีข้อมูลสำหรับแสดงผล" /></div>
      )}
    </div>
  </Card>
);


// --- Main Component ---
export default function AdminDashboardPage() {
  const { role, loading: authLoading } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [yearLevelChart, setYearLevelChart] = useState(null);
  const [subjectChart, setSubjectChart] = useState(null);
  const [creditVsWorkloadChart, setCreditVsWorkloadChart] = useState(null);
  const [proportionChart, setProportionChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear() + 543));
  const [selectedSemester, setSelectedSemester] = useState(0);

  // --- Logic เดิม, แค่ลบ console.log ออก ---
  const transformYearLevelData = (data) => {
    if (!data || data.length === 0) return null;
    const categories = ['academic', 'research', 'academic_service', 'student_affairs', 'personal'];
    const categoryLabels = { academic: 'วิชาการ', research: 'วิจัย', academic_service: 'บริการวิชาการ', student_affairs: 'กิจการนักศึกษา', personal: 'ส่วนตัว' };
    const yearLevels = [...new Set(data.map(item => item.year_level))].sort();
    const series = categories.map(category => ({
      name: categoryLabels[category],
      data: yearLevels.map(year => {
        const item = data.find(d => d.year_level === year && d.category === category);
        const avgHours = (item && item.student_count > 0) ? (item.total_hours / item.student_count) : 0;
        return parseFloat(avgHours.toFixed(1));
      })
    }));
    return { series, options: { chart: { type: 'bar', height: 350, stacked: true }, plotOptions: { bar: { horizontal: false, borderRadius: 4 } }, xaxis: { categories: yearLevels.map(y => `ปี ${y}`) }, yaxis: { title: { text: 'ชม.เฉลี่ย/คน' } }, tooltip: { y: { formatter: (val) => `${val} ชม.` } }, legend: { position: 'top' } } };
  };

  const fetchData = useCallback(async () => {
    if (authLoading || role !== 'admin') return;
    setLoading(true);
    try {
      const [summaryRes, yearLevelRes, subjectRes, creditRes, proportionRes] = await Promise.all([
        getAdminDashboardSummary(selectedYear, selectedSemester),
        getDashboardWorkloadByYearLevel(selectedYear, selectedSemester),
        getDashboardWorkloadBySubject(selectedYear, selectedSemester),
        getDashboardCreditVsWorkload(selectedYear, selectedSemester),
        getDashboardProportionComparison(selectedYear, selectedSemester, 0)
      ]);

      setSummaryData(summaryRes.success ? summaryRes.data : null);
      setYearLevelChart(yearLevelRes.success ? transformYearLevelData(yearLevelRes.data) : null);

      if (subjectRes.success) {
        const topSubjects = subjectRes.data.slice(0, 10);
        setSubjectChart({ series: [{ name: 'ชม. ที่คาดหวัง', data: topSubjects.map(s => parseFloat(s.avg_hours.toFixed(1))) }], options: { chart: { type: 'bar', height: 350 }, plotOptions: { bar: { horizontal: true, borderRadius: 4 } }, dataLabels: { enabled: false }, xaxis: { categories: topSubjects.map(s => s.subject_code) } } });
      } else { setSubjectChart(null); }

      if (creditRes.success) {
        setCreditVsWorkloadChart({ series: [{ name: 'ภาระงาน', data: creditRes.data.map(d => [d.total_credits, parseFloat(d.avg_hours.toFixed(1))]) }], options: { chart: { type: 'scatter', height: 350, zoom: { enabled: false } }, xaxis: { title: { text: 'จำนวนหน่วยกิต' }, tickAmount: 5 }, yaxis: { title: { text: 'ชม. ที่คาดหวัง' } } } });
      } else { setCreditVsWorkloadChart(null); }

      if (proportionRes.success) {
        setProportionChart({ series: [{ name: 'ตามแผน (%)', data: proportionRes.data.map(p => p.target_percentage) }, { name: 'ตามจริง (%)', data: proportionRes.data.map(p => parseFloat(p.actual_percentage.toFixed(1))) }], options: { chart: { type: 'bar', height: 350 }, xaxis: { categories: proportionRes.data.map(p => p.category) }, yaxis: { title: { text: 'สัดส่วน (%)' } } } });
      } else { setProportionChart(null); }

    } catch (error) { message.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์"); }
    finally { setLoading(false); }
  }, [authLoading, role, selectedYear, selectedSemester]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  // --- 3. สร้าง Array สำหรับ Stat Cards และ Chart Cards ---
  const summaryStats = [
    { title: "ชม. ภาระงานเฉลี่ย", value: Number(summaryData?.avg_total_hours || 0).toFixed(1), unit: "ชม./คน", icon: <TeamOutlined />, color: '#3b82f6' },
    { title: "ชม. วิชาการเฉลี่ย", value: Number(summaryData?.avg_academic_hours || 0).toFixed(1), unit: "ชม./คน", icon: <BookOutlined />, color: '#8b5cf6' },
    { title: "ชม. กิจการ นศ. เฉลี่ย", value: Number(summaryData?.avg_student_affairs_hours || 0).toFixed(1), unit: "ชม./คน", icon: <ApartmentOutlined />, color: '#16a34a' },
    { title: "ชิ้นงานเฉลี่ย/วิชา", value: Number(summaryData?.avg_assignment_count_per_subject || 0).toFixed(1), unit: "ชิ้น/วิชา", icon: <RiseOutlined />, color: '#f97316' },
    { title: "นศ. ที่ลงทะเบียน", value: summaryData?.total_students || 0, unit: "คน", icon: <UsergroupAddOutlined />, color: '#ef4444' }
  ];

  const chartCards = [
    { title: "ภาพรวมภาระงานตามชั้นปี", icon: <BarChartOutlined />, chartData: yearLevelChart, loading: loading, type: 'bar' },
    { title: "10 อันดับรายวิชาภาระงานสูงสุด", icon: <AreaChartOutlined />, chartData: subjectChart, loading: loading, type: 'bar' },
    { title: "หน่วยกิต vs ภาระงาน", icon: <DotChartOutlined />, chartData: creditVsWorkloadChart, loading: loading, type: 'scatter' },
    { title: "สัดส่วนภาระงาน: แผน vs จริง", icon: <PieChartOutlined />, chartData: proportionChart, loading: loading, type: 'bar' }
  ];

  return (
    <DashboardLayout title="Dashboard ผู้ดูแลระบบ">
      {/* --- 4. ปรับ Layout หลักและ Header ให้ Responsive --- */}
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1">Dashboard ภาพรวม</Title>
              <Text type="secondary">ภาพรวมข้อมูลภาระงานทั้งหมดในระบบ</Text>
            </div>
            <Space direction="vertical" align="end" className="w-full sm:w-auto sm:flex-row">
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: '100%' }} size="large" options={[{ value: '2568', label: 'ปี 2568' }, { value: '2567', label: 'ปี 2567' }, { value: '2566', label: 'ปี 2566' }]} />
              <Select value={selectedSemester} onChange={setSelectedSemester} style={{ width: '100%' }} size="large" options={[{ value: 0, label: 'ทุกภาคการศึกษา' }, { value: 1, label: 'ภาคเรียนที่ 1' }, { value: 2, label: 'ภาคเรียนที่ 2' }, { value: 3, label: 'ภาคฤดูร้อน' }]} />
            </Space>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {summaryStats.map(stat => <StatCard key={stat.title} {...stat} />)}
          </div>

          <Row gutter={[24, 24]}>
            {chartCards.map(chart => (
              <Col xs={24} lg={12} key={chart.title}>
                <ChartCard {...chart} />
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </DashboardLayout>
  );
}