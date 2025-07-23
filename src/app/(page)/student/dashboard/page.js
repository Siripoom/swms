"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyWorkloadReport } from "@/services/workloads";
import { Card, Col, Row, Spin, Typography, message, Progress, Avatar } from "antd";
import { Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart } from "recharts";
import {
  BookOutlined,
  ExperimentOutlined,
  TeamOutlined,
  UserOutlined,
  HeartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Config and Helper Components (โค้ดเดิมของคุณ ไม่มีการแก้ไข) ---
const COLORS = ["#1890ff", "#722ed1", "#13c2c2", "#52c41a", "#f5222d"];
const GRADIENT_COLORS = [
  "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
  "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
  "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
  "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
  "linear-gradient(135deg, #f5222d 0%, #cf1322 100%)"
];
const categoryConfig = {
  academic: { name: "วิชาการ", icon: <BookOutlined />, color: COLORS[0], gradient: GRADIENT_COLORS[0] },
  research: { name: "วิจัย", icon: <ExperimentOutlined />, color: COLORS[1], gradient: GRADIENT_COLORS[1] },
  academic_service: { name: "บริการวิชาการ", icon: <TeamOutlined />, color: COLORS[2], gradient: GRADIENT_COLORS[2] },
  student_affairs: { name: "กิจการนักศึกษา", icon: <UserOutlined />, color: COLORS[3], gradient: GRADIENT_COLORS[3] },
  personal: { name: "ส่วนตัว", icon: <HeartOutlined />, color: COLORS[4], gradient: GRADIENT_COLORS[4] }
};
const getCategoryNameThai = (key) => categoryConfig[key]?.name || key;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '14px' }}>
            {getCategoryNameThai(entry.dataKey)}: {entry.value.toFixed(2)} ชั่วโมง
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: data.payload.color, fontSize: '14px' }}>
          {data.name}: {data.value.toFixed(2)} ชั่วโมง
        </p>
      </div>
    );
  }
  return null;
};
// --- End of Config ---

export default function StudentDashboardPage() {
  // --- ส่วน Logic ที่แก้ไขแล้ว ---
  const { userProfile, role, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState({ academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (studentProfileId) => {
      setLoading(true);
      const res = await getMyWorkloadReport({ student_id: studentProfileId });
      if (res.success) {
        const tempSummary = { academic: 0, research: 0, academic_service: 0, student_affairs: 0, personal: 0 };
        res.data.forEach(item => {
          if (item.category in tempSummary && !isNaN(parseFloat(item.hours_spent))) {
            tempSummary[item.category] += parseFloat(item.hours_spent);
          }
        });
        setSummary(tempSummary);
      } else {
        message.error("ไม่สามารถดึงข้อมูลรายงานภาระงานได้: " + res.error);
      }
      setLoading(false);
    };

    if (authLoading) return;

    if (role === "student" && userProfile) {
      const studentProfileId = userProfile.student_profile_id;
      if (studentProfileId) {
        fetchData(studentProfileId);
      } else {
        message.error("ไม่พบข้อมูลโปรไฟล์นักศึกษาของคุณ");
        setLoading(false);
      }
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, userProfile, role]);

  const totalHours = Object.values(summary).reduce((sum, hours) => sum + hours, 0);
  const pieData = Object.entries(summary).map(([key, value]) => ({
    name: categoryConfig[key]?.name || key,
    value: value,
    color: categoryConfig[key]?.color
  })).filter(item => item.value > 0);
  const barData = [{ name: "ภาระงานรวม", ...summary }];

  // --- ส่วนแสดงผล ---

  // 1. จัดการ Loading (ใช้ Spinner และสไตล์แบบเดิมของคุณ)
  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" style={{ color: '#1890ff' }} />
          <div style={{ color: '#1890ff', marginTop: 16, fontSize: '16px', fontWeight: '500' }}>
            กำลังโหลดข้อมูล...
          </div>
        </div>
      </div>
    );
  }

  // 2. จัดการสิทธิ์
  if (role !== "student") {
    return (
      <DashboardLayout title="Access Denied">
        <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
      </DashboardLayout>
    );
  }

  // 3. แสดงผลหน้า Dashboard (โค้ด UI เดิมของคุณ + แก้ไข Warning)
  return (
    <DashboardLayout title="Dashboard">
      <div style={{
        padding: '32px',
        background: '#ffffff',
        minHeight: '100vh'
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
            opacity: 0.1
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar size={64} style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <UserOutlined style={{ fontSize: '28px' }} />
                  </Avatar>
                  <div>
                    <Title level={2} style={{ color: 'white', margin: 0 }}>
                      สรุปภาระงานของคุณ
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                      ภาพรวมการทำงานในแต่ละด้าน
                    </Text>
                  </div>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <ClockCircleOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                    <Text style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                      {totalHours.toFixed(1)}
                    </Text>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>ชั่วโมงรวม</div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginBottom: 32,
            flexWrap: 'nowrap', // ไม่ให้ขึ้นบรรทัดใหม่
            justifyContent: 'space-between',
            overflowX: 'auto', // ถ้าหน้าจอเล็กจะ scroll ได้
          }}
        >
          {Object.entries(summary).map(([key, value], idx) => {
            const config = categoryConfig[key];
            const percentage = totalHours > 0 ? (value / totalHours) * 100 : 0;
            return (
              <div key={key} style={{ flex: '1 1 0', minWidth: 0 }}>
                <Card
                  variant="borderless"
                  hoverable
                  style={{ borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}
                  styles={{ body: { padding: '24px', textAlign: 'center', position: 'relative', zIndex: 2 } }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'; }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: config?.gradient || GRADIENT_COLORS[idx] }} />
                  <div style={{ background: config?.gradient || GRADIENT_COLORS[idx], width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', color: 'white' }}>
                    {config?.icon}
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px', fontSize: '16px' }}>{config?.name || key}</Title>
                  <div style={{ marginBottom: '12px' }}>
                    <Text style={{ fontSize: '28px', fontWeight: 'bold', color: config?.color }}>{value.toFixed(1)}</Text>
                    <Text style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '4px' }}>ชั่วโมง</Text>
                  </div>
                  <Progress percent={percentage} showInfo={false} strokeColor={config?.gradient || GRADIENT_COLORS[idx]} size={[6, 6]} />
                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{percentage.toFixed(1)}% ของภาระงานรวม</Text>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}
              styles={{ body: { padding: '32px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', padding: '8px', borderRadius: '8px', color: 'white' }}><TrophyOutlined style={{ fontSize: '20px' }} /></div>
                <Title level={3} style={{ margin: 0 }}>สัดส่วนภาระงาน</Title>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`} labelLine={false}>
                    {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              style={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}
              styles={{ body: { padding: '32px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)', padding: '8px', borderRadius: '8px', color: 'white' }}><CalendarOutlined style={{ fontSize: '20px' }} /></div>
                <Title level={3} style={{ margin: 0 }}>ภาระงานแต่ละด้าน</Title>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => getCategoryNameThai(value)} />
                  {Object.keys(summary).map((cat, index) => (
                    <Bar key={cat} dataKey={cat} name={getCategoryNameThai(cat)} fill={`url(#gradient${index})`} radius={[4, 4, 0, 0]} maxBarSize={60} />
                  ))}
                  <defs>
                    {Object.keys(summary).map((cat, index) => (
                      <linearGradient key={cat} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[index]} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS[index]} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}