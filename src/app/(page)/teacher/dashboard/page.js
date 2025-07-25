"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getTeacherDashboardStats } from "@/services/teacherDashboard";
import { Spin, Card, Typography, message, Empty } from "antd";
import Link from 'next/link';

const { Title, Text } = Typography;

export default function TeacherDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!authLoading && user && role === 'teacher') {
        setLoading(true);
        const res = await getTeacherDashboardStats(user.id);
        if (res.success) {
          setDashboardData(res.data);
        } else {
          message.error("ไม่สามารถดึงข้อมูลรายวิชาได้: " + res.error);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user, role]);

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

  if (authLoading || loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'teacher') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="Dashboard อาจารย์">
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <Card>
          <Title level={2}>Dashboard</Title>
          <Text>ภาพรวมรายวิชาที่คุณรับผิดชอบ</Text>
        </Card>

        <div className="space-y-6">
          {academicYears.length > 0 ? (
            academicYears.map(year => (
              <Card key={year} title={`ปีการศึกษา ${year}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectsByYear[year].map(subject => (
                    <Link href={`/teacher/subjects/${subject.id}`} key={subject.id}>
                      <div className="border p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white h-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <Title level={5}>{subject.subject_code}</Title>
                            <Text type="secondary">{subject.subject_name}</Text>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            เทอม {subject.semester}
                          </span>
                        </div>
                        <div className="mt-4 pt-2 border-t text-sm">
                          <Text>นักศึกษา: {subject.enrollment_count} คน</Text>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card><Empty description="คุณยังไม่ได้รับมอบหมายให้รับผิดชอบรายวิชาใดๆ" /></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}