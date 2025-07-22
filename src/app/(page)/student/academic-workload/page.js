"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getAcademicAssignmentsByStudent } from "@/services/workloads";
import { getStudentProfileByUserId } from "@/services/workloads";
import { Table, Card, Typography, Spin, Tag, message } from "antd"; // **เพิ่ม message**
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AcademicWorkloadPage() {
  const { user, userProfile, role, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (studentId) => {
      // --- DEBUG LOG 3 ---
      console.log(`[fetchData] กำลังดึงข้อมูลงานด้วย student.id:`, studentId);

      setLoading(true);
      const res = await getAcademicAssignmentsByStudent(studentId);

      // --- DEBUG LOG 4 ---
      console.log(`[fetchData] ผลลัพธ์ที่ได้กลับมา:`, res);

      if (res.success) {
        setAssignments(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลภาระงานที่ได้รับมอบหมายได้: " + res.error);
      }
      setLoading(false);
    };

    if (!authLoading && user && role === 'student') {
      console.log("--- เริ่มกระบวนการตรวจสอบใน useEffect ---");

      // --- DEBUG LOG 1 ---
      // ดูโครงสร้างทั้งหมดของ userProfile ที่ได้มาจาก AuthContext
      console.log("[useEffect] ตรวจสอบ userProfile จาก Context:", userProfile);

      // ดึง ID ออกมาจาก userProfile
      const idFromProfile = userProfile?.id;

      // --- DEBUG LOG 2 ---
      // ดูว่า ID ที่ดึงมาเป็นค่าอะไร
      console.log(`[useEffect] ID ที่ดึงจาก userProfile คือ:`, idFromProfile);
      console.log(`[useEffect] ID ของ user (จาก auth.user) คือ:`, user?.id);

      // เราสันนิษฐานว่า idFromProfile คือ user_id ไม่ใช่ student_id
      // ดังนั้น เราจะใช้ user.id ไปหา student_id ที่ถูกต้องเสมอ
      if (user?.id) {
        console.log(`[useEffect] กำลังเรียก getStudentProfileByUserId เพื่อหา student.id ที่ถูกต้อง...`);
        getStudentProfileByUserId(user.id).then(res => {
          if (res.success && res.data?.id) {
            // res.data.id คือ student.id ที่แท้จริง
            fetchData(res.data.id);
          } else {
            console.error("[useEffect] ไม่พบโปรไฟล์นักศึกษาที่ผูกกับ user นี้ หรือเกิดข้อผิดพลาด:", res.error);
            setLoading(false);
            message.error("ไม่พบข้อมูลโปรไฟล์นักศึกษาของคุณ");
          }
        });
      } else {
        setLoading(false);
      }

    } else if (!authLoading) {
      // กรณีที่โหลดเสร็จแล้วแต่ไม่ใช่ student
      setLoading(false);
    }

  }, [authLoading, user, role, userProfile]);

  const getStatusTag = (dueDate) => {
    if (dayjs(dueDate).isBefore(dayjs(), 'day')) {
      return <Tag color="error">เลยกำหนด</Tag>;
    }
    return <Tag color="processing">กำลังดำเนินการ</Tag>;
  };

  const columns = [
    { title: 'รายวิชา', key: 'subject', render: (_, record) => `${record.subject?.subject_code || ''} - ${record.subject?.subject_name || ''}` },
    { title: 'ชื่องาน', dataIndex: 'assignment_name', key: 'assignment_name' },
    { title: 'อาจารย์ผู้สอน', dataIndex: ['teacher', 'full_name'], key: 'teacher' },
    { title: 'กำหนดส่ง', dataIndex: 'due_date', key: 'due_date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { title: 'ชั่วโมงที่คาดหวัง', dataIndex: 'estimated_hours', key: 'estimated_hours', align: 'center' },
    { title: 'สถานะ', key: 'status', render: (_, record) => getStatusTag(record.due_date), align: 'center' },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="ภาระงานวิชาการ">
      <div style={{ padding: "24px" }}>
        <Card>
          <Title level={2} style={{ margin: 0, marginBottom: 16 }}>ภาระงานวิชาการ</Title>
          <Text type="secondary">รายการงานทั้งหมดที่ได้รับมอบหมายจากอาจารย์ในรายวิชาที่คุณลงทะเบียน</Text>
          <Table
            style={{ marginTop: 24 }}
            columns={columns}
            dataSource={assignments}
            rowKey="id"
            loading={loading}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}