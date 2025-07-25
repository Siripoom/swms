// path: /app/(page)/department/subjects/[subjectid]/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getDeptSubjectDashboard } from "@/services/deptHeadDashboard";
import { Spin, message, Card, Typography, Row, Col, Progress, Empty, Button } from "antd";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftOutlined, TeamOutlined, FieldTimeOutlined, ContainerOutlined, BarChartOutlined, DashboardOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Component ย่อยสำหรับแสดงสถิติ (ไม่มีการเปลี่ยนแปลง)
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

export default function DeptHeadSubjectDashboardPage() {
  const { role, loading: authLoading } = useAuth();
  const params = useParams();
  const subjectid = params?.subjectid;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!subjectid) return;
    setLoading(true);
    const res = await getDeptSubjectDashboard(subjectid);
    if (res.success && res.data) {
      setDetails(res.data);
    } else {
      setDetails(null);
    }
    setLoading(false);
  }, [subjectid]);

  useEffect(() => {
    if (authLoading) return;
    if (role === 'department_head') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [authLoading, role, fetchData]);

  if (authLoading || loading) {
    return <DashboardLayout><div className="flex justify-center items-center h-[80vh]"><Spin size="large" /></div></DashboardLayout>;
  }
  if (role !== 'department_head') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  if (!details || !details.subject_info) {
    return (
      <DashboardLayout title="ไม่พบข้อมูล">
        <div className="p-6 text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<div><Title level={4}>ไม่พบข้อมูลรายวิชา</Title><Text type="secondary">อาจเป็นเพราะข้อมูลไม่มีอยู่จริง หรือคุณไม่มีสิทธิ์เข้าถึง</Text></div>}>
            <Button type="primary" href="/department/dashboard">กลับหน้า Dashboard</Button>
          </Empty>
        </div>
      </DashboardLayout>
    );
  }

  // --- ส่วนที่แก้ไข ---
  // 1. ไม่ต้องดึง actual_workload_hours มาใช้แล้ว
  const { subject_info, assignments_summary } = details;
  const totalAssignments = assignments_summary?.total_assignments || 0;
  // เปลี่ยนชื่อตัวแปรเพื่อความชัดเจน (เป็นทางเลือก)
  const totalEstimatedHours = assignments_summary?.total_estimated_hours || 0;

  const coveragePercentage = subject_info.self_study_hours > 0
    ? Math.min(100, Math.round((totalEstimatedHours / subject_info.self_study_hours) * 100))
    : 0;

  // 2. สร้าง Array ของ Stat Cards ให้เหมือนกับหน้าของ Teacher
  const summaryStats = [
    { title: 'จำนวนนักศึกษา', value: `${subject_info.student_count} คน`, icon: <TeamOutlined />, color: '#3b82f6' },
    { title: 'Self-study รวม', value: `${subject_info.self_study_hours} ชม.`, icon: <FieldTimeOutlined />, color: '#16a34a' },
    { title: 'งานที่มอบหมาย', value: `${totalAssignments} งาน`, icon: <ContainerOutlined />, color: '#f97316' },
    // *** นี่คือการ์ดที่เปลี่ยนกลับไปให้เหมือนหน้า Teacher ***
    { title: 'ชั่วโมงภาระงาน', value: `${totalEstimatedHours.toFixed(1)} ชม.`, icon: <BarChartOutlined />, color: '#ef4444' }
  ];
  // --- สิ้นสุดส่วนที่แก้ไข ---

  return (
    <DashboardLayout title={`Dashboard: ${subject_info.subject_name}`}>
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-5 rounded-lg border border-gray-200">
            <Link href="/department/dashboard">
              <Button type="text" icon={<ArrowLeftOutlined />} className="mb-4 !px-0">
                กลับหน้า Dashboard หลัก
              </Button>
            </Link>
            <Title level={2} className="!mb-1">{subject_info.subject_code} - {subject_info.subject_name}</Title>
            <Text type="secondary">ภาพรวมภาระงานและสถิติของรายวิชา</Text>
          </div>

          <Row gutter={[24, 24]}>
            {summaryStats.map(stat => (
              <Col xs={24} sm={12} lg={6} key={stat.title}>
                <StatCard {...stat} />
              </Col>
            ))}
          </Row>

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
              {/* ใช้ totalEstimatedHours ในการแสดงผล */}
              <Title level={5} className="!mt-4">{totalEstimatedHours.toFixed(1)} / {subject_info.self_study_hours} ชั่วโมง</Title>
              <Paragraph type="secondary" className="mt-2 max-w-xs mx-auto">
                ภาระงานที่คาดหวังเทียบกับชั่วโมง Self-study ตามหลักสูตร
              </Paragraph>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}