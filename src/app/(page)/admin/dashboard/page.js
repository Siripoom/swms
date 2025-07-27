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
  getDashboardAssignmentVsWorkload
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
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear() + 543));
  const [selectedSemester, setSelectedSemester] = useState(0);

  const fetchData = useCallback(async () => {
    if (authLoading || role !== 'admin') return;

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

    // Process Summary
    setSummaryData(summaryRes.success ? summaryRes.data : null);

    // Process Graph 1: Year Level Stacked Bar
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

    // Process Graph 2: Top Subjects
    if (subjectRes.success && subjectRes.data.length > 0) {
      const topSubjects = subjectRes.data.slice(0, 10);
      setSubjectChart({ series: [{ name: 'ชม. ที่คาดหวัง', data: topSubjects.map(s => parseFloat(s.avg_hours.toFixed(1))) }], options: { chart: { type: 'bar', height: 350 }, plotOptions: { bar: { horizontal: true } }, dataLabels: { enabled: false }, xaxis: { categories: topSubjects.map(s => s.subject_code) } } });
    } else { setSubjectChart(null); }

    // --- Process Graph 3: Workload Distribution (Min/Avg/Max) ---
    if (distributionRes.success && distributionRes.data.length > 0) {
      const data = distributionRes.data;
      const categories = data.map(d => `ปี ${d.year_level}`);
      setDistributionChart({
        series: [
          { name: 'ค่าต่ำสุด', data: data.map(d => parseFloat(d.min_hours.toFixed(1))) },
          { name: 'ค่าเฉลี่ย', data: data.map(d => parseFloat(d.avg_hours.toFixed(1))) },
          { name: 'ค่าสูงสุด', data: data.map(d => parseFloat(d.max_hours.toFixed(1))) }
        ],
        options: {
          chart: { type: 'bar', height: 350 },
          plotOptions: { bar: { horizontal: false, columnWidth: '75%', dataLabels: { position: 'top' } } },
          dataLabels: { enabled: true, formatter: (val) => val.toFixed(0), offsetY: -20, style: { fontSize: '12px', colors: ["#304758"] } },
          stroke: { show: true, width: 2, colors: ['transparent'] },
          xaxis: { categories: categories },
          yaxis: { title: { text: 'ชั่วโมงทำงานรวม' } },
          fill: { opacity: 1 },
          tooltip: { y: { formatter: (val) => val.toFixed(1) + " ชั่วโมง" } }
        }
      });
    } else { setDistributionChart(null); }

    // Process Graph 4: Credit vs Workload
    if (creditRes.success && creditRes.data.length > 0) {
      const rawData = creditRes.data;

      // 1. หากลุ่มหน่วยกิตที่ไม่ซ้ำกันสำหรับแกน X และ Legend
      const creditGroups = [...new Set(rawData.map(d => d.total_credits))].sort((a, b) => a - b);

      // 2. สร้าง series หลายชุด แยกตามกลุ่มหน่วยกิต
      const series = creditGroups.map(creditValue => {
        return {
          name: `${creditValue} หน่วยกิต`,
          data: rawData
            .filter(d => d.total_credits === creditValue)
            .map(d => [d.total_credits, parseFloat(d.avg_hours.toFixed(1))])
        };
      });

      setCreditVsWorkloadChart({
        series: series,
        options: {
          chart: { type: 'scatter', height: 350 },
          xaxis: {
            title: { text: 'จำนวนหน่วยกิต' },
            type: 'numeric',
            // หาค่า min/max จากข้อมูลจริงเพื่อให้แกนสวยงาม
            min: Math.floor(Math.min(...creditGroups)) - 1,
            max: Math.ceil(Math.max(...creditGroups)) + 1,
            // กำหนดจำนวนขีดบนแกน X ให้พอดีกับจำนวนเต็มในช่วงนั้น
            tickAmount: (Math.ceil(Math.max(...creditGroups)) + 1) - (Math.floor(Math.min(...creditGroups)) - 1),
            labels: {
              // บังคับให้แสดงเป็นเลขจำนวนเต็มเสมอ
              formatter: function (val) {
                return val.toFixed(0);
              }
            }
          },
          yaxis: { title: { text: 'ชม. ที่คาดหวังเฉลี่ย' } },
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            markers: { radius: 12 }
          },
          // Tooltip แบบ Custom ที่สามารถหาชื่อวิชากลับมาได้
          tooltip: {
            custom: function ({ seriesIndex, dataPointIndex, w }) {
              // หาข้อมูลของจุดที่กำลังชี้
              const pointData = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
              const creditVal = pointData[0];
              const hourVal = pointData[1];

              // ค้นหาวิชาที่ตรงกับค่า credit และ hour ใน rawData
              // อาจจะมีหลายตัวที่ค่าเท่ากัน, เราจะเอาตัวแรกที่เจอ
              const subject = rawData.find(d =>
                d.total_credits == creditVal &&
                parseFloat(d.avg_hours.toFixed(1)) == hourVal
              );

              const subjectCode = subject ? subject.subject_code : 'N/A';

              return `<div class="p-2 bg-white shadow-lg rounded border">
                              <strong>วิชา: ${subjectCode}</strong><br/>
                              <span>หน่วยกิต: ${creditVal}</span><br/>
                              <span>ชม. เฉลี่ย: ${hourVal}</span>
                            </div>`;
            }
          }
        }
      });
    } else {
      setCreditVsWorkloadChart(null);
    }

    // Process Graph 5: Assignment vs Workload
    if (assignmentVsWorkloadRes.success && assignmentVsWorkloadRes.data.length > 0) {
      const rawData = assignmentVsWorkloadRes.data;

      // 1. หากลุ่มของ "รายวิชา" ที่ไม่ซ้ำกัน (ใช้ subject_name)
      const subjectGroups = [...new Set(rawData.map(d => d.subject_name))];

      // 2. สร้าง series สำหรับ "แต่ละรายวิชา"
      const series = subjectGroups.map(subjectName => {
        // กรองข้อมูลเฉพาะของวิชานี้
        const subjectData = rawData.filter(d => d.subject_name === subjectName);
        return {
          name: subjectName, // ชื่อ series คือชื่อวิชา
          // data คือ Array ของจุด [x, y]
          data: subjectData.map(d => [d.assignment_count, parseFloat(d.avg_hours.toFixed(1))])
        };
      });

      // 3. คำนวณ min/max ของแกน X เพื่อการแสดงผลที่สวยงาม
      const allAssignmentCounts = rawData.map(d => d.assignment_count);
      const minCount = Math.min(...allAssignmentCounts);
      const maxCount = Math.max(...allAssignmentCounts);

      setAssignmentVsWorkloadChart({
        series: series, // ใช้ series ใหม่ที่มีหลายชุด
        options: {
          chart: { type: 'scatter', height: 350 },
          xaxis: {
            title: { text: 'จำนวนชิ้นงานในวิชา' },
            type: 'numeric',
            min: Math.floor(minCount) > 0 ? Math.floor(minCount) - 1 : 0,
            max: Math.ceil(maxCount) + 1,
            tickAmount: Math.ceil(maxCount) - Math.floor(minCount) + 2,
            labels: {
              formatter: function (val) {
                return val.toFixed(0);
              }
            }
          },
          yaxis: { title: { text: 'ชม. ที่คาดหวังเฉลี่ย' } },
          // แสดง Legend เพื่อบอกว่าสีไหนคือวิชาอะไร
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            markers: { radius: 12 }
          },
          tooltip: {
            x: { formatter: (val) => `${val} ชิ้นงาน` },
            y: { formatter: (val) => `${val.toFixed(1)} ชม.` }
          }
        }
      });
    } else {
      setAssignmentVsWorkloadChart(null);
    }
    // Process Graph 6: Proportion Comparison
    if (proportionRes.success && proportionRes.data.length > 0) {
      const categories = proportionRes.data.map(p => categoryTranslations[p.category] || p.category);
      const series = [{ name: 'ตามแผน (%)', data: proportionRes.data.map(p => p.target_percentage) }, { name: 'ตามจริง (%)', data: proportionRes.data.map(p => parseFloat(p.actual_percentage.toFixed(1))) }];
      setProportionChart({ series, options: { chart: { type: 'bar', height: 350 }, xaxis: { categories: categories }, yaxis: { title: { text: 'สัดส่วน (%)' } } } });
    } else { setProportionChart(null); }

    setLoading(false);
  }, [authLoading, role, selectedYear, selectedSemester]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: '100%' }} size="large" options={[{ value: '2568', label: 'ปี 2568' }, { value: '2567', label: 'ปี 2567' }, { value: '2566', label: 'ปี 2566' }]} />
              <Select value={selectedSemester} onChange={setSelectedSemester} style={{ width: '100%' }} size="large" options={[{ value: 0, label: 'ทุกภาคการศึกษา' }, { value: 1, label: 'ภาคเรียนที่ 1' }, { value: 2, label: 'ภาคเรียนที่ 2' }, { value: 3, label: 'ภาคฤดูร้อน' }]} />
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