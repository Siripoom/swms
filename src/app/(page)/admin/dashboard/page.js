"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAdminDashboardSummary,
  getDashboardWorkloadByYearLevel,
  getDashboardWorkloadBySubject,
  getDashboardCreditVsWorkload,
  getDashboardProportionComparison,
  getDashboardWorkloadDistribution,
  getDashboardAssignmentVsWorkload,
  getDistinctAcademicYears // **Import เพิ่ม**
} from "@/services/adminDashboard";
import { Spin, Card, Typography, Row, Col, Select, message, Empty, Space } from "antd";
import dynamic from 'next/dynamic';
import {
  BarChartOutlined, AreaChartOutlined, DotChartOutlined, PieChartOutlined, TeamOutlined, BookOutlined, RiseOutlined, ApartmentOutlined, UsergroupAddOutlined
} from "@ant-design/icons";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text } = Typography;

const categoryTranslations = {
  'academic': 'วิชาการ', 'research': 'วิจัย', 'academic_service': 'บริการวิชาการ',
  'student_affairs': 'กิจการนักศึกษา', 'personal': 'ส่วนตัว'
};

const StatCard = ({ title, value, unit, icon, color }) => (
  <Card bordered={false} className="shadow-md h-full">
    <div className="flex items-start">
      <div className="text-2xl p-3 rounded-lg mr-4" style={{ backgroundColor: `${color}1A`, color: color }}>{icon}</div>
      <div>
        <Text type="secondary" className="font-medium">{title}</Text>
        <Title level={4} className="!mt-1 !mb-0">{value} <span className="text-lg font-normal text-gray-500">{unit}</span></Title>
      </div>
    </div>
  </Card>
);

const ChartCard = ({ title, icon, chartData, loading, type = 'bar', emptyText = "ไม่มีข้อมูลสำหรับแสดงผล" }) => (
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
        <div className="flex items-center justify-center h-full"><Empty description={emptyText} /></div>
      )}
    </div>
  </Card>
);

export default function AdminDashboardPage() {
  const { role, loading: authLoading } = useAuth();

  const [summaryData, setSummaryData] = useState(null);
  const [yearLevelChart, setYearLevelChart] = useState(null);
  const [subjectChart, setSubjectChart] = useState(null);
  const [creditVsWorkloadChart, setCreditVsWorkloadChart] = useState(null);
  const [proportionChart, setProportionChart] = useState(null);
  const [distributionChart, setDistributionChart] = useState(null);
  const [assignmentVsWorkloadChart, setAssignmentVsWorkloadChart] = useState(null);

  const [loading, setLoading] = useState(true);

  // States for filters
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(0);

  // useEffect ใหม่สำหรับดึงข้อมูล Filter (ทำงานครั้งเดียว)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const yearRes = await getDistinctAcademicYears();
      if (yearRes.success && yearRes.data.length > 0) {
        const options = yearRes.data.map(year => ({ value: year, label: `ปีการศึกษา ${year}` }));
        setYearOptions(options);
        // ตั้งค่าปีเริ่มต้นเป็นปีล่าสุดที่มีข้อมูล
        if (!selectedYear) {
          setSelectedYear(options[0].value);
        }
      } else {
        // กรณีไม่มีข้อมูลเลย ให้ใช้ปีปัจจุบันเป็นค่าเริ่มต้น
        const currentYear = String(new Date().getFullYear() + 543);
        setYearOptions([{ value: currentYear, label: `ปีการศึกษา ${currentYear}` }]);
        if (!selectedYear) {
          setSelectedYear(currentYear);
        }
      }
    };
    if (!authLoading && role === 'admin') {
      fetchFilterOptions();
    }
  }, [authLoading, role]); // Dependency ที่ถูกต้อง

  const fetchData = useCallback(async () => {
    // จะไม่ทำงานถ้ายังไม่มี selectedYear
    if (authLoading || role !== 'admin' || !selectedYear) {
      setLoading(false);
      return;
    };

    setLoading(true);
    const [
      summaryRes, yearLevelRes, subjectRes, creditRes,
      proportionRes, distributionRes, assignmentVsWorkloadRes
    ] = await Promise.all([
      getAdminDashboardSummary(selectedYear, selectedSemester),
      getDashboardWorkloadByYearLevel(selectedYear, selectedSemester),
      getDashboardWorkloadBySubject(selectedYear, selectedSemester),
      getDashboardCreditVsWorkload(selectedYear, selectedSemester),
      getDashboardProportionComparison(selectedYear, selectedSemester, 0),
      getDashboardWorkloadDistribution(selectedYear, selectedSemester),
      getDashboardAssignmentVsWorkload(selectedYear, selectedSemester)
    ]);

    setSummaryData(summaryRes.success ? summaryRes.data : null);

    if (yearLevelRes.success && yearLevelRes.data.length > 0) {
      const categories = Object.keys(categoryTranslations);
      const yearLevels = [...new Set(yearLevelRes.data.map(item => item.year_level))].sort();
      const series = categories.map(category => ({
        name: categoryTranslations[category],
        data: yearLevels.map(year => {
          const item = yearLevelRes.data.find(d => d.year_level === year && d.category === category);
          const avgHours = (item && item.student_count > 0) ? (item.total_hours / item.student_count) : 0;
          return parseFloat(avgHours.toFixed(1));
        })
      }));
      setYearLevelChart({ series, options: { chart: { stacked: true }, xaxis: { categories: yearLevels.map(y => `ปี ${y}`) }, yaxis: { title: { text: 'ชม.เฉลี่ย/คน' } } } });
    } else { setYearLevelChart(null); }

    if (subjectRes.success && subjectRes.data.length > 0) {
      const topSubjects = subjectRes.data.slice(0, 10);
      setSubjectChart({ series: [{ name: 'ชม. ที่คาดหวัง', data: topSubjects.map(s => parseFloat(s.avg_hours.toFixed(1))) }], options: { chart: { type: 'bar', height: 350 }, plotOptions: { bar: { horizontal: true } }, dataLabels: { enabled: false }, xaxis: { categories: topSubjects.map(s => s.subject_code) } } });
    } else { setSubjectChart(null); }

    if (distributionRes.success && distributionRes.data.length > 0) {
      const categories = distributionRes.data.map(d => `ปี ${d.year_level}`);
      setDistributionChart({
        series: [
          { name: 'ค่าต่ำสุด', data: distributionRes.data.map(d => parseFloat(d.min_hours.toFixed(1))) },
          { name: 'ค่าเฉลี่ย', data: distributionRes.data.map(d => parseFloat(d.avg_hours.toFixed(1))) },
          { name: 'ค่าสูงสุด', data: distributionRes.data.map(d => parseFloat(d.max_hours.toFixed(1))) }
        ],
        options: { chart: { type: 'bar', height: 350 }, plotOptions: { bar: { horizontal: false, columnWidth: '75%', dataLabels: { position: 'top' } } }, dataLabels: { enabled: true, formatter: (val) => val.toFixed(0), offsetY: -20, style: { fontSize: '12px', colors: ["#304758"] } }, stroke: { show: true, width: 2, colors: ['transparent'] }, xaxis: { categories: categories }, yaxis: { title: { text: 'ชั่วโมงทำงานรวม' } } }
      });
    } else { setDistributionChart(null); }

    if (creditRes.success && creditRes.data.length > 0) {
      setCreditVsWorkloadChart({ series: [{ name: 'ภาระงาน', data: creditRes.data.map(d => [d.total_credits, parseFloat(d.avg_hours.toFixed(1))]) }], options: { chart: { type: 'scatter', height: 350 }, xaxis: { title: { text: 'จำนวนหน่วยกิต' } }, yaxis: { title: { text: 'ชม. ที่คาดหวัง' } } } });
    } else { setCreditVsWorkloadChart(null); }

    if (assignmentVsWorkloadRes.success && assignmentVsWorkloadRes.data.length > 0) {
      setAssignmentVsWorkloadChart({ series: [{ name: 'ชม. ที่คาดหวังเฉลี่ย', data: assignmentVsWorkloadRes.data.map(d => [d.assignment_count, parseFloat(d.avg_hours.toFixed(1))]) }], options: { chart: { type: 'scatter', height: 350 }, xaxis: { title: { text: 'จำนวนชิ้นงานในวิชา' }, tickAmount: 'dataPoints', type: 'numeric' }, yaxis: { title: { text: 'ชม. ที่คาดหวังเฉลี่ย' } } } });
    } else { setAssignmentVsWorkloadChart(null); }

    if (proportionRes.success && proportionRes.data.length > 0) {
      const categories = proportionRes.data.map(p => categoryTranslations[p.category] || p.category);
      const series = [{ name: 'ตามแผน (%)', data: proportionRes.data.map(p => p.target_percentage) }, { name: 'ตามจริง (%)', data: proportionRes.data.map(p => parseFloat(p.actual_percentage.toFixed(1))) }];
      setProportionChart({ series, options: { chart: { type: 'bar', height: 350 }, xaxis: { categories: categories }, yaxis: { title: { text: 'สัดส่วน (%)' } } } });
    } else { setProportionChart(null); }

    setLoading(false);
  }, [authLoading, role, selectedYear, selectedSemester]);

  // useEffect เดิมสำหรับดึงข้อมูล Dashboard
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  const summaryStats = [
    { title: "ชม. ภาระงานเฉลี่ย", value: Number(summaryData?.avg_total_hours || 0).toFixed(1), unit: "ชม./คน", icon: <TeamOutlined />, color: '#3b82f6' },
    { title: "ชม. วิชาการเฉลี่ย", value: Number(summaryData?.avg_academic_hours || 0).toFixed(1), unit: "ชม./คน", icon: <BookOutlined />, color: '#8b5cf6' },
    { title: "ชม. กิจการ นศ. เฉลี่ย", value: Number(summaryData?.avg_student_affairs_hours || 0).toFixed(1), unit: "ชม./คน", icon: <ApartmentOutlined />, color: '#16a34a' },
    { title: "ชิ้นงานเฉลี่ย/วิชา", value: Number(summaryData?.avg_assignment_count_per_subject || 0).toFixed(1), unit: "ชิ้น/วิชา", icon: <RiseOutlined />, color: '#f97316' },
    { title: "นศ. ที่ลงทะเบียน", value: summaryData?.total_students || 0, unit: "คน", icon: <UsergroupAddOutlined />, color: '#ef4444' }
  ];

  const chartCards = [
    { title: "ภาพรวมภาระงานตามชั้นปี (กราฟ 1)", icon: <BarChartOutlined />, chartData: yearLevelChart, type: 'bar' },
    { title: "10 อันดับรายวิชาภาระงานสูงสุด (กราฟ 2)", icon: <AreaChartOutlined />, chartData: subjectChart, type: 'bar' },
    { title: "การกระจายตัวของภาระงาน (กราฟ 3)", icon: <BarChartOutlined />, chartData: distributionChart, type: 'bar' },
    { title: "หน่วยกิต vs ภาระงาน (กราฟ 4)", icon: <DotChartOutlined />, chartData: creditVsWorkloadChart, type: 'scatter' },
    { title: "ชิ้นงาน vs ชั่วโมงทำงาน (กราฟ 5)", icon: <DotChartOutlined />, chartData: assignmentVsWorkloadChart, type: 'scatter' },
    { title: "สัดส่วนภาระงาน: แผน vs จริง (กราฟ 6)", icon: <PieChartOutlined />, chartData: proportionChart, type: 'bar' }
  ];

  return (
    <DashboardLayout title="Dashboard ผู้ดูแลระบบ">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1">Dashboard ภาพรวม</Title>
              <Text type="secondary">ภาพรวมข้อมูลภาระงานทั้งหมดในระบบ</Text>
            </div>
            <Space direction="vertical" align="end" className="w-full sm:w-auto sm:flex-row">
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: '100%', minWidth: 150 }}
                size="large"
                options={yearOptions}
                loading={yearOptions.length === 0}
              />
              <Select
                value={selectedSemester}
                onChange={setSelectedSemester}
                style={{ width: '100%', minWidth: 180 }}
                size="large"
                options={[
                  { value: 0, label: 'ทุกภาคการศึกษา' },
                  { value: 1, label: 'ภาคเรียนที่ 1' },
                  { value: 2, label: 'ภาคเรียนที่ 2' },
                  { value: 3, label: 'ภาคฤดูร้อน' }
                ]}
              />
            </Space>
          </div>
          {loading ? <div className="text-center py-10"><Spin size="large" /></div> : (
            <>
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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}