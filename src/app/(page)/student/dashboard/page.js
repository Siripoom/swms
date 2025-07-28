"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { Spin, Card, Row, Col, Typography, message, Empty } from 'antd';
// --- 1. นำเข้าไอคอนจาก Ant Design ---
import {
  BookOutlined,
  ExperimentOutlined,
  TeamOutlined,
  UserOutlined,
  HeartOutlined
} from "@ant-design/icons";

// --- Dynamic Import สำหรับ ApexCharts ---
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text } = Typography;

// --- 2. อัปเดต Config ให้ใช้ไอคอนที่นำเข้ามา ---
const categoryConfig = {
  academic: { name: "วิชาการ", icon: <BookOutlined />, color: "#3b82f6" },
  research: { name: "วิจัย", icon: <ExperimentOutlined />, color: "#8b5cf6" },
  academic_service: { name: "บริการวิชาการ", icon: <TeamOutlined />, color: "#14b8a6" },
  student_affairs: { name: "กิจการนักศึกษา", icon: <UserOutlined />, color: "#22c55e" },
  personal: { name: "ส่วนตัว", icon: <HeartOutlined />, color: "#ef4444" }
};

// --- Component ย่อยที่สร้างขึ้นมาใหม่ (ปรับปรุงการแสดงผลไอคอน) ---

const CategoryStatCard = ({ icon, title, value, color }) => (
  <Card
    bordered={false}
    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', borderLeft: `5px solid ${color}` }}
  >
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* 3. ปรับสไตล์ให้ไอคอนมีสีตามธีม */}
      <div style={{ fontSize: '28px', marginRight: '16px', color: color }}>
        {icon}
      </div>
      <div>
        <Text type="secondary">{title}</Text>
        <Title level={4} style={{ margin: '0', color: color }}>{value}</Title>
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

// --- หน้าหลัก Dashboard ---
export default function StudentDashboardPage() {
  const { userProfile, role, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;

      setLoading(true);
      const res = await getMyWorkloadReport({ student_id: userProfile.student_profile_id });

      if (res.success) {
        const tempSummary = { academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 };
        res.data.forEach(item => {
          if (item.category in tempSummary) {
            tempSummary[item.category] += parseFloat(item.hours_spent) || 0;
          }
        });
        setSummary(tempSummary);
      } else {
        message.error(`ไม่สามารถดึงข้อมูลได้: ${res.error}`);
      }
      setLoading(false);
    };

    if (!authLoading && role === 'student') {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, userProfile, role]);

  const totalHours = summary ? Object.values(summary).reduce((sum, hours) => sum + hours, 0) : 0;
  const pieData = summary ? Object.entries(summary)
    .map(([key, value]) => ({
      name: categoryConfig[key]?.name,
      value: value,
      color: categoryConfig[key]?.color
    }))
    .filter(item => item.value > 0) : [];

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (role !== "student") {
    return <DashboardLayout><div>Access Denied</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Dashboard นักศึกษา">
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>สรุปภาระงานของคุณ</Title>

        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {summary && Object.entries(summary).map(([key, value]) => {
            const config = categoryConfig[key];
            return (
              <Col xs={24} sm={12} lg={8} xl={4} key={key}>
                <CategoryStatCard
                  icon={config.icon}
                  title={config.name}
                  value={`${value.toFixed(1)} ชม.`}
                  color={config.color}
                />
              </Col>
            );
          })}
          <Col xs={24} sm={12} lg={8} xl={4}>
            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', background: '#1890ff', color: 'white', height: '100%' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <Text style={{ color: 'white', opacity: 0.8 }}>ชั่วโมงรวมทั้งหมด</Text>
                <Title level={2} style={{ margin: '0', color: 'white' }}>{totalHours.toFixed(1)}</Title>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="สัดส่วนภาระงาน" bordered={false}>
              {pieData.length > 0 ? (
                <PieChartComponent data={pieData} />
              ) : (
                <Empty description="ไม่มีข้อมูลสำหรับแสดงผล" style={{ padding: '80px 0' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="ภาระงานแต่ละด้าน" bordered={false}>
              {totalHours > 0 ? (
                <BarChartComponent data={summary} />
              ) : (
                <Empty description="ไม่มีข้อมูลสำหรับแสดงผล" style={{ padding: '80px 0' }} />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}