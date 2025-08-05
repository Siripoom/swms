"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { getDistinctAcademicYears } from "@/services/subjects";
import { Spin, Card, Row, Col, Typography, message, Empty, Select, Space } from 'antd';
import {
  BookOutlined, ExperimentOutlined, TeamOutlined, UserOutlined, HeartOutlined
} from "@ant-design/icons";
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text } = Typography;

const categoryConfig = {
  academic: { name: "วิชาการ", icon: <BookOutlined />, color: "#3b82f6" },
  research: { name: "วิจัย", icon: <ExperimentOutlined />, color: "#8b5cf6" },
  academic_service: { name: "บริการวิชาการ", icon: <TeamOutlined />, color: "#14b8a6" },
  student_affairs: { name: "กิจการนักศึกษา", icon: <UserOutlined />, color: "#22c55e" },
  personal: { name: "ส่วนตัว", icon: <HeartOutlined />, color: "#ef4444" }
};

const CategoryStatCard = ({ icon, title, value, color }) => (
  <Card bordered={false} className="shadow-sm h-full">
    <div className="flex items-center">
      <div className="text-2xl p-3 rounded-lg mr-4" style={{ backgroundColor: `${color}1A`, color: color }}>{icon}</div>
      <div>
        <Text type="secondary">{title}</Text>
        <Title level={4} style={{ margin: '0' }}>{value}</Title>
      </div>
    </div>
  </Card>
);

// --- Chart Components (ApexCharts - ไม่มีการเปลี่ยนแปลง) ---
const PieChartComponent = ({ data }) => {
  const options = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: data.map(item => item.name),
    colors: data.map(item => item.color),
    legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '14px' },
    tooltip: { y: { formatter: (val) => `${val.toFixed(2)} ชั่วโมง` } },
    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` }
  };
  const series = data.map(item => item.value);
  return <Chart options={options} series={series} type="donut" height={350} />;
};

const BarChartComponent = ({ data }) => {
  const series = Object.keys(categoryConfig).map(key => ({
    name: categoryConfig[key].name,
    data: [data[key] || 0]
  }));
  const options = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'inherit' },
    xaxis: { categories: ['ภาระงานรวม'], labels: { show: false } },
    yaxis: { title: { text: 'ชั่วโมง' } },
    colors: Object.values(categoryConfig).map(c => c.color),
    legend: { position: 'top', horizontalAlign: 'center' },
    tooltip: { y: { formatter: (val) => `${val.toFixed(2)} ชั่วโมง` } },
    dataLabels: { enabled: false }
  };
  return <Chart options={options} series={series} type="bar" height={350} />;
};

export default function StudentDashboardPage() {
  const { role, loading: authLoading, studentId } = useAuth();
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- States ใหม่สำหรับ Filters ---
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null); // null = รวมทั้งหมด

  const semesterOptions = [
    { value: 1, label: 'ภาคการศึกษาที่ 1' },
    { value: 2, label: 'ภาคการศึกษาที่ 2' },
    { value: 3, label: 'ภาคฤดูร้อน' },
  ];

  // --- useEffect สำหรับดึงข้อมูล Dropdowns และข้อมูล Dashboard ---
  useEffect(() => {
    const fetchInitialData = async () => {
      // ดึงรายการปีที่มีอยู่ทั้งหมดมาสร้างเป็นตัวเลือก
      const yearRes = await getDistinctAcademicYears();
      if (yearRes.success && yearRes.data.length > 0) {
        const options = yearRes.data.map(year => ({ value: year, label: `ปีการศึกษา ${year}` }));
        setYearOptions(options);
        // ตั้งค่าปีเริ่มต้นเป็นปีล่าสุดที่มีข้อมูล
        setSelectedYear(options[0].value);
      } else {
        const currentYear = String(new Date().getFullYear() + 543);
        setYearOptions([{ value: currentYear, label: `ปีการศึกษา ${currentYear}` }]);
        setSelectedYear(currentYear);
      }
    };

    if (!authLoading && role === 'student') {
      fetchInitialData();
    }
  }, [authLoading, role]);

  useEffect(() => {
    const fetchData = async () => {
      // จะดึงข้อมูลก็ต่อเมื่อมี studentId และ selectedYear แล้ว
      if (!studentId || !selectedYear) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getMyWorkloadReport({
        student_id: studentId,
        academic_year: selectedYear,
        semester: selectedSemester,
      });

      if (res.success) {
        setWorkloadData(res.data);
      } else {
        message.error(`ไม่สามารถดึงข้อมูลได้: ${res.error}`);
      }
      setLoading(false);
    };

    if (!authLoading && role === 'student') {
      fetchData();
    }
  }, [authLoading, role, studentId, selectedYear, selectedSemester]); // Re-fetch when filters change


  // --- Logic การคำนวณและเตรียมข้อมูลสำหรับกราฟ (ใช้ useMemo) ---
  const summary = useMemo(() => {
    const tempSummary = { academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 };
    if (workloadData) {
      workloadData.forEach(item => {
        if (item.category in tempSummary) {
          tempSummary[item.category] += parseFloat(item.hours_spent) || 0;
        }
      });
    }
    return tempSummary;
  }, [workloadData]);

  const totalHours = useMemo(() => Object.values(summary).reduce((sum, hours) => sum + hours, 0), [summary]);
  const pieData = useMemo(() => Object.entries(summary)
    .map(([key, value]) => ({
      name: categoryConfig[key]?.name,
      value: value,
      color: categoryConfig[key]?.color
    }))
    .filter(item => item.value > 0), [summary]);

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }
  if (role !== "student") {
    return <DashboardLayout><div>Access Denied</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Dashboard นักศึกษา">
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2}>สรุปภาระงานของคุณ</Title>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions}
                style={{ width: 200 }}
                loading={!selectedYear}
              />
              <Select
                placeholder="ทุกภาคการศึกษา"
                value={selectedSemester}
                onChange={setSelectedSemester}
                options={semesterOptions}
                style={{ width: 200 }}
                allowClear
              />
            </Space>
          </Col>
        </Row>

        {loading ? <div className="text-center py-10"><Spin /></div> : (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
              {Object.entries(summary).map(([key, value]) => {
                const config = categoryConfig[key];
                return (
                  <Col xs={24} sm={12} lg={8} xl={4} key={key}>
                    <CategoryStatCard icon={config.icon} title={config.name} value={`${value.toFixed(1)} ชม.`} color={config.color} />
                  </Col>
                );
              })}
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', background: '#1890ff', color: 'white', height: '100%' }}>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Text style={{ color: 'white', opacity: 0.8 }}>ชั่วโมงรวม</Text>
                    <Title level={2} style={{ margin: '0', color: 'white' }}>{totalHours.toFixed(1)}</Title>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title="สัดส่วนภาระงาน" bordered={false}>
                  {pieData.length > 0 ? <PieChartComponent data={pieData} /> : <Empty description="ไม่มีข้อมูลสำหรับแสดงผล" style={{ padding: '80px 0' }} />}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="ภาระงานแต่ละด้าน" bordered={false}>
                  {totalHours > 0 ? <BarChartComponent data={summary} /> : <Empty description="ไม่มีข้อมูลสำหรับแสดงผล" style={{ padding: '80px 0' }} />}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}