"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  PageLoadingSkeleton,
  SubjectCardSkeleton,
} from "@/components/LoadingSkeleton";
import { getTeacherDashboardStats } from "@/services/teacherDashboard";
import { Card, Typography, message, Empty } from "antd";
import Link from "next/link";
import {
  CalendarOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- 1. ปรับปรุง SubjectCard ให้แสดงแค่จำนวนนักศึกษา ---
const SubjectCard = ({ subject }) => (
  <Link
    href={`/teacher/subjects/${subject.id}`}
    key={subject.id}
    className="block group"
  >
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title
              level={5}
              className="!mb-0 group-hover:text-indigo-600 transition-colors"
            >
              {subject.subject_code}
            </Title>
            <Text
              type="secondary"
              className="text-xs truncate block max-w-[200px]"
            >
              {subject.subject_name}
            </Text>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-1 rounded-full">
            เทอม {subject.semester}
          </span>
        </div>
        <div className="flex items-center text-gray-600 text-sm pt-4 border-t border-gray-100">
          <TeamOutlined className="mr-2 text-gray-400" />
          <span>นักศึกษา:</span>
          <span className="font-semibold text-gray-800 ml-auto">
            {subject.enrollment_count || 0} คน
          </span>
        </div>
      </div>
      <div className="mt-auto bg-gray-50 px-5 py-3 border-t border-gray-200">
        <span className="text-sm font-semibold text-indigo-600 flex items-center justify-between">
          ดู Dashboard รายวิชา{" "}
          <RightOutlined className="transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

export default function TeacherDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Logic เดิม ---
  useEffect(() => {
    const fetchData = async () => {
      if (!authLoading && user && role === "teacher") {
        setLoading(true);
        // *** สำคัญ: Service function นี้ต้องคืนค่า enrollment_count มาด้วย ***
        const res = await getTeacherDashboardStats(user.id);
        if (res.success) {
          setDashboardData(res.data);
        } else {
          message.error("ไม่สามารถดึงข้อมูลได้: " + res.error);
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

  const academicYears = Object.keys(subjectsByYear).sort((a, b) =>
    b.localeCompare(a)
  );
  // --- สิ้นสุด Logic เดิม ---

  if (authLoading)
    return (
      <DashboardLayout title="Dashboard อาจารย์">
        <PageLoadingSkeleton />
      </DashboardLayout>
    );

  if (role !== "teacher")
    return (
      <DashboardLayout>
        <div>Access Denied</div>
      </DashboardLayout>
    );

  if (!dashboardData && !loading)
    return (
      <DashboardLayout>
        <div className="p-6">
          <Empty description="ไม่พบข้อมูล Dashboard" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Dashboard อาจารย์">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl shadow-lg p-6">
            <Title level={2} className="!text-white">
              ยินดีต้อนรับ, {user?.name || "อาจารย์"}
            </Title>
            <Text className="!text-white opacity-80">
              ภาพรวมรายวิชาทั้งหมดที่คุณรับผิดชอบ
            </Text>
          </div>

          {loading ? (
            <SubjectCardSkeleton count={6} />
          ) : (
            <div className="space-y-8">
              {academicYears.length > 0 ? (
                academicYears.map((year) => (
                  <div key={year}>
                    <Title
                      level={3}
                      className="flex items-center mb-4 pb-2 border-b-2 border-gray-100"
                    >
                      <CalendarOutlined className="mr-3 text-indigo-500" />{" "}
                      ปีการศึกษา {year}
                    </Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {subjectsByYear[year].map((subject) => (
                        <SubjectCard key={subject.id} subject={subject} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 rounded-lg p-10 text-center">
                  <Empty
                    description={
                      <Title level={5} type="secondary">
                        คุณยังไม่มีรายวิชาที่รับผิดชอบ
                      </Title>
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
