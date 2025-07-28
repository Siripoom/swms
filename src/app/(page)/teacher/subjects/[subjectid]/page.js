"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getSubjectDashboardDetails } from "@/services/teacherDashboard";
import { Spin, message, Card, Typography, Row, Col, Progress, Empty, Button } from "antd";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  ContainerOutlined,
  BarChartOutlined,
  DashboardOutlined,
  PieChartOutlined
} from '@ant-design/icons';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text, Paragraph } = Typography;

// --- 1. สร้าง StatCard Component เพื่อการตกแต่ง ---
const StatCard = ({ title, value, icon, color }) => (
  <Card bordered={false} className="shadow-md h-full">
    <div className="flex items-start">
      <div className={`text-2xl p-3 rounded-lg mr-4`} style={{ backgroundColor: `${color}1A`, color: color }}>
        {icon}
      </div>
      <div>
        <Text type="secondary" className="font-medium">{title}</Text>
        <Title level={4} className="!mt-1 !mb-0">{value}</Title>
      </div>
    </div>
  </Card>
);

export default function SubjectDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const params = useParams();
  const subjectid = params.subjectid;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const fetchData = useCallback(async () => {
    // ... (ส่วน Logic เดิม ไม่มีการเปลี่ยนแปลง)
    if (!userId || !subjectid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getSubjectDashboardDetails(subjectid, userId);
    if (res.success && res.data) {
      setDetails(res.data);
    } else {
      message.error("ไม่สามารถดึงข้อมูลได้: " + (res.error || "Unknown error"));
      setDetails(null);
    }
    setLoading(false);
  }, [subjectid, userId]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[80vh]"><Spin size="large" /></div>
      </DashboardLayout>
    );
  }

  if (!details || !details.subject_info) {
    return (
      <DashboardLayout title="ไม่พบข้อมูล">
        <div className="p-6 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4}>ไม่พบข้อมูลรายวิชา</Title>
                <Text type="secondary">อาจเป็นเพราะข้อมูลไม่มีอยู่จริง หรือคุณไม่มีสิทธิ์เข้าถึง</Text>
              </div>
            }
          >
            <Button type="primary" href="/teacher/dashboard">กลับหน้า Dashboard</Button>
          </Empty>
        </div>
      </DashboardLayout>
    );
  }

  const { subject_info, assignments_summary } = details;
  const totalAssignments = assignments_summary?.total_assignments || 0;
  const totalHours = assignments_summary?.total_estimated_hours || 0;
  const individualCount = assignments_summary?.individual_count || 0;
  const groupCount = assignments_summary?.group_count || 0;

  const coveragePercentage = subject_info.self_study_hours > 0
    ? Math.min(100, Math.round((totalHours / subject_info.self_study_hours) * 100))
    : 0;

  const typeChartSeries = [individualCount, groupCount];
  const typeChartOptions = {
    labels: ['งานเดี่ยว', 'งานกลุ่ม'],
    colors: ['#3b82f6', '#16a34a'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '14px' },
    plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'รวม' } } } } }
  };

  const summaryStats = [

    { title: 'จำนวนนักศึกษา', value: `${subject_info.student_count} คน`, icon: <TeamOutlined />, color: '#3b82f6' },
    { title: 'Self-study รวม', value: `${subject_info.self_study_hours} ชม.`, icon: <FieldTimeOutlined />, color: '#16a34a' },
    { title: 'งานที่มอบหมาย', value: `${totalAssignments} งาน`, icon: <ContainerOutlined />, color: '#f97316' },
    { title: 'ชั่วโมงภาระงาน', value: `${totalHours.toFixed(1)} ชม.`, icon: <BarChartOutlined />, color: '#ef4444' }
  ];

  return (
    <DashboardLayout title={`Dashboard: ${subject_info.subject_name}`}>
      {/* 2. เปลี่ยนพื้นหลังเป็นสีขาว และจัด Layout ด้วย max-w */}
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* 3. ปรับปรุง Header */}
          <div className="p-5 rounded-lg border border-gray-200">
            <Link href="/teacher/dashboard">
              <Button type="text" icon={<ArrowLeftOutlined />} className="mb-4 !px-0">
                กลับหน้า Dashboard หลัก
              </Button>
            </Link>
            <Title level={2} className="!mb-1">{subject_info.subject_code} - {subject_info.subject_name}</Title>
            <Text type="secondary">ภาพรวมภาระงานและสถิติของรายวิชา</Text>
          </div>

          {/* ใช้ StatCard ที่สร้างขึ้น */}
          <Row gutter={[24, 24]}>
            {summaryStats.map(stat => (
              <Col xs={24} sm={12} lg={6} key={stat.title}>
                <StatCard {...stat} />
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            {/* 4. ปรับปรุงการ์ด Progress Chart */}
            <Col xs={24} md={12}>
              <Card
                title={<div className="flex items-center"><DashboardOutlined className="mr-2" />ความครอบคลุมภาระงาน</div>}
                bordered={false}
                className="shadow-md h-full"
              >
                <div className="text-center">
                  <Progress
                    type="circle"
                    percent={coveragePercentage}
                    strokeWidth={10}
                    format={(percent) => <span className="font-bold text-2xl">{percent}%</span>}
                  />
                  <Title level={5} className="!mt-4">{totalHours.toFixed(1)} / {subject_info.self_study_hours} ชั่วโมง</Title>
                  <Paragraph type="secondary" className="mt-2 max-w-xs mx-auto">
                    ภาระงานที่มอบหมายเทียบกับชั่วโมง Self-study ตามหลักสูตร
                  </Paragraph>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title={<div className="flex items-center"><PieChartOutlined className="mr-2" />ประเภทภาระงาน</div>}
                bordered={false}
                className="shadow-md h-full"
              >
                {totalAssignments > 0 ? (
                  <Chart options={typeChartOptions} series={typeChartSeries} type="donut" height={325} />
                ) : (
                  <div className="flex items-center justify-center h-[325px]">
                    <Empty description="ยังไม่มีข้อมูลงานที่มอบหมาย" />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </DashboardLayout>
  );
}