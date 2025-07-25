"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getAcademicAssignmentsByStudent, getStudentProfileByUserId } from "@/services/workloads";
import { Table, Card, Typography, Spin, Tag, message, Empty } from "antd";
import dayjs from 'dayjs';
import { BookOutlined, UserOutlined, ClockCircleOutlined, CalendarOutlined, HourglassOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// --- 1. สร้าง Component การ์ดสำหรับแสดงผลบนมือถือ ---
const AssignmentCard = ({ assignment }) => {
  const isOverdue = dayjs(assignment.due_date).isBefore(dayjs(), 'day');
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="flex justify-between items-start">
        <div>
          <Text strong className="block text-base">{assignment.assignment_name}</Text>
          <Text type="secondary" className="text-sm">{`${assignment.subject?.subject_code} - ${assignment.subject?.subject_name}`}</Text>
        </div>
        <Tag color={isOverdue ? "error" : "processing"} icon={isOverdue ? <CloseCircleOutlined /> : <CheckCircleOutlined />}>
          {isOverdue ? "เลยกำหนด" : "กำลังดำเนินการ"}
        </Tag>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center"><UserOutlined className="mr-2 text-gray-400" /><Text type="secondary">ผู้สอน: </Text><Text className="ml-1">{assignment.teacher?.full_name}</Text></div>
        <div className="flex items-center"><CalendarOutlined className="mr-2 text-gray-400" /><Text type="secondary">กำหนดส่ง: </Text><Text className="ml-1">{dayjs(assignment.due_date).format('DD/MM/YYYY')}</Text></div>
        <div className="flex items-center col-span-2"><HourglassOutlined className="mr-2 text-gray-400" /><Text type="secondary">ชม.ที่คาดหวัง: </Text><Text className="ml-1">{assignment.estimated_hours} ชั่วโมง</Text></div>
      </div>
    </div>
  );
};

// --- 2. สร้าง Component ตารางที่ Responsive ---
const ResponsiveAssignmentTable = ({ assignments, loading }) => {
  const getStatusTag = (dueDate) => {
    if (dayjs(dueDate).isBefore(dayjs(), 'day')) {
      return <Tag color="error">เลยกำหนด</Tag>;
    }
    return <Tag color="processing">กำลังดำเนินการ</Tag>;
  };

  const columns = [
    { title: 'รายวิชา', key: 'subject', ellipsis: true, render: (_, record) => `${record.subject?.subject_code || ''} - ${record.subject?.subject_name || ''}` },
    { title: 'ชื่องาน', dataIndex: 'assignment_name', key: 'assignment_name', ellipsis: true },
    { title: 'อาจารย์ผู้สอน', dataIndex: ['teacher', 'full_name'], key: 'teacher', responsive: ['lg'] }, // responsive: ['lg'] จะแสดงคอลัมน์นี้เมื่อจอใหญ่กว่า lg
    { title: 'กำหนดส่ง', dataIndex: 'due_date', key: 'due_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), align: 'center', responsive: ['md'] },
    { title: 'ชม.ที่คาดหวัง', dataIndex: 'estimated_hours', key: 'estimated_hours', align: 'center' },
    { title: 'สถานะ', key: 'status', render: (_, record) => getStatusTag(record.due_date), align: 'center' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Spin size="large" /></div>;
  }

  if (!assignments || assignments.length === 0) {
    return <div className="py-10"><Empty description="ไม่พบงานที่ได้รับมอบหมาย" /></div>;
  }

  return (
    <>
      {/* สำหรับจอ Desktop (md ขึ้นไป) */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={assignments}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
      {/* สำหรับจอมือถือ (เล็กกว่า md) */}
      <div className="block md:hidden">
        {assignments.map(assignment => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </>
  );
};


export default function AcademicWorkloadPage() {
  const { user, userProfile, role, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- ส่วน Logic การดึงข้อมูล (ไม่มีการเปลี่ยนแปลง) ---
    const fetchData = async (studentId) => {
      setLoading(true);
      const res = await getAcademicAssignmentsByStudent(studentId);
      if (res.success) {
        setAssignments(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลภาระงานที่ได้รับมอบหมายได้: " + res.error);
      }
      setLoading(false);
    };

    if (!authLoading && user && role === 'student') {
      if (user?.id) {
        getStudentProfileByUserId(user.id).then(res => {
          if (res.success && res.data?.id) {
            fetchData(res.data.id);
          } else {
            setLoading(false);
            message.error("ไม่พบข้อมูลโปรไฟล์นักศึกษาของคุณ");
          }
        });
      } else {
        setLoading(false);
      }
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, role, userProfile]);

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="ภาระงานวิชาการ">
      {/* 3. ปรับปรุง Layout โดยรวม */}
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* 4. สร้าง Header ที่สวยงาม */}
          <div className="bg-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <BookOutlined style={{ fontSize: '24px' }} />
              </div>
              <div>
                <Title level={2} className="!text-white !m-0">ภาระงานวิชาการ</Title>
                <Text className="!text-blue-100">รายการงานทั้งหมดที่ได้รับมอบหมายจากอาจารย์</Text>
              </div>
            </div>
          </div>

          {/* 5. ใช้ Component ตารางที่ Responsive */}
          <Card bordered={false} className="shadow-md">
            <ResponsiveAssignmentTable assignments={assignments} loading={loading} />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}