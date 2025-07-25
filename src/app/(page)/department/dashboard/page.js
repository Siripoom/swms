"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getDeptHeadDashboard } from "@/services/deptHeadDashboard";
import { Spin, Card, Typography, message, Empty, Row, Col } from "antd";
import Link from 'next/link';
import {
  TeamOutlined,
  CalendarOutlined,
  RightOutlined,
  InfoCircleOutlined // เพิ่มไอคอน
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- Components (ไม่มีการเปลี่ยนแปลง) ---
const StatCard = ({ title, value, icon, color }) => (
  <Card bordered={false} className="shadow-lg h-full">
    <div className="flex items-center space-x-4">
      <div className={`text-2xl p-4 rounded-xl`} style={{ backgroundColor: `${color}1A`, color: color }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </Card>
);

const SubjectCard = ({ subject }) => (
  // *** สำคัญ: ตรวจสอบและแก้ไข Path ให้ถูกต้องตามโครงสร้างโปรเจคของคุณ ***
  <Link href={`/dept-head/subjects/${subject.id}`} key={subject.id} className="block group">
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={5} className="!mb-0 group-hover:text-blue-600 transition-colors">
              {subject.subject_code}
            </Title>
            <Text type="secondary" className="text-xs truncate block max-w-xs">{subject.subject_name}</Text>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
            เทอม {subject.semester}
          </span>
        </div>
      </div>
      <div className="mt-auto bg-gray-50 px-5 py-3 border-t border-gray-200">
        <span className="text-sm font-semibold text-blue-600 flex items-center justify-between">
          ดู Dashboard รายวิชา
          <RightOutlined className="transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);


export default function DeptHeadDashboardPage() {
  const { userProfile, role, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... (ส่วน Logic เดิม ไม่มีการเปลี่ยนแปลง)
  useEffect(() => {
    const fetchData = async () => {
      const department = userProfile?.department;
      if (!authLoading && (role === 'department_head' || role === 'admin') && department) {
        setLoading(true);
        const res = await getDeptHeadDashboard(department);
        if (res.success) {
          setDashboardData(res.data);
        } else {
          message.error("ไม่สามารถดึงข้อมูลแดชบอร์ดได้: " + res.error);
        }
        setLoading(false);
      } else if (!authLoading) {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, userProfile, role]);

  const subjectsByYear = useMemo(() => {
    if (!dashboardData?.subjects) return {};
    return dashboardData.subjects.reduce((acc, subject) => {
      const year = subject.academic_year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(subject);
      return acc;
    }, {});
  }, [dashboardData]);

  const academicYears = Object.keys(subjectsByYear).sort((a, b) => b.localeCompare(a));
  // --- สิ้นสุด Logic เดิม ---

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'department_head' && role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;
  if (!userProfile?.department && role === 'department_head') return <DashboardLayout><div className="p-6"><Empty description="ไม่พบข้อมูลภาควิชาสำหรับผู้ใช้นี้" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Dashboard ผู้บริหารภาควิชา">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl shadow-lg p-6">
            <Title level={2} className="!text-white">Dashboard ผู้บริหาร</Title>
            <Text className="!text-white opacity-80">ภาควิชา: {userProfile.department || 'N/A'}</Text>
          </div>

          {loading ? (
            <div className="text-center py-10"><Spin size="large" /></div>
          ) : (
            // --- 1. ใช้ Row และ Col ในการจัด Layout ใหม่ ---
            <Row gutter={[32, 32]}>
              {/* --- 2. ส่วนซ้าย: เนื้อหาหลัก (รายการวิชา) --- */}
              <Col xs={24} lg={16}>
                <div className="space-y-8">
                  {academicYears.length > 0 ? (
                    academicYears.map(year => (
                      <div key={year}>
                        <Title level={3} className="flex items-center mb-4 pb-2 border-b-2 border-gray-100">
                          <CalendarOutlined className="mr-3 text-sky-500" />
                          ปีการศึกษา {year}
                        </Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                          {subjectsByYear[year].map(subject => (
                            <SubjectCard key={subject.id} subject={subject} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-10 text-center">
                      <Empty description={<Title level={5} type="secondary">ไม่พบข้อมูลรายวิชาที่รับผิดชอบ</Title>} />
                    </div>
                  )}
                </div>
              </Col>

              {/* --- 3. ส่วนขวา: ข้อมูลสรุป --- */}
              <Col xs={24} lg={8}>
                <div className="space-y-4 sticky top-8">
                  <Title level={4} className="flex items-center">
                    <InfoCircleOutlined className="mr-2" />
                    ข้อมูลสรุป
                  </Title>
                  <StatCard
                    title="จำนวนบุคลากรในภาควิชา"
                    value={`${dashboardData?.summary?.total_instructors || 0} คน`}
                    icon={<TeamOutlined />}
                    color="#0ea5e9" // sky-500
                  />
                  {/* สามารถเพิ่ม StatCard อื่นๆ ได้ที่นี่ */}
                </div>
              </Col>
            </Row>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}