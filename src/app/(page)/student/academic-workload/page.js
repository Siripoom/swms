"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getAcademicAssignmentsByStudent, getStudentProfileByUserId } from "@/services/workloads";
import { Table, Card, Typography, Spin, Tag, message, Empty, Grid } from "antd"; // เพิ่ม Grid
import dayjs from 'dayjs';
import { BookOutlined, UserOutlined, CalendarOutlined, HourglassOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid; // Import Hook สำหรับเช็คขนาดจอ

// --- 1. Component ที่รวมทั้งตารางและการ์ด และรับผิดชอบเรื่อง Responsive ทั้งหมด ---
const AssignmentDisplay = ({ assignments, loading }) => {
  const screens = useBreakpoint(); // Hook สำหรับเช็คขนาดจอ

  // Function สำหรับสร้าง Tag (ใช้ร่วมกันทั้งตารางและการ์ด)
  const getStatusTag = (dueDate, isCard = false) => {
    const isOverdue = dayjs(dueDate).isBefore(dayjs(), 'day');
    if (isCard) {
      return (
        <Tag color={isOverdue ? "error" : "processing"} icon={isOverdue ? <CloseCircleOutlined /> : <CheckCircleOutlined />}>
          {isOverdue ? "เลยกำหนด" : "กำลังดำเนินการ"}
        </Tag>
      );
    }
    return <Tag color={isOverdue ? "error" : "processing"}>{isOverdue ? "เลยกำหนด" : "กำลังดำเนินการ"}</Tag>;
  };

  const columns = [
    { title: 'รายวิชา', key: 'subject', ellipsis: true, render: (_, record) => `${record.subject?.subject_code || ''} - ${record.subject?.subject_name || ''}` },
    { title: 'ชื่องาน', dataIndex: 'assignment_name', key: 'assignment_name', ellipsis: true },
    { title: 'อาจารย์ผู้สอน', dataIndex: ['teacher', 'full_name'], key: 'teacher', responsive: ['lg'] },
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

  // --- Logic การแสดงผล Responsive ---
  // ถ้าจอใหญ่กว่า sm (>= 768px) ให้แสดงตาราง, ถ้าเล็กกว่าให้แสดงการ์ด
  return screens.md ? (
    <Table
      columns={columns}
      dataSource={assignments}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      scroll={{ x: 'max-content' }}
    />
  ) : (
    <div className="space-y-4">
      {assignments.map(assignment => (
        <div key={assignment.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <Text strong className="block text-base">{assignment.assignment_name}</Text>
              <Text type="secondary" className="text-sm">{`${assignment.subject?.subject_code} - ${assignment.subject?.subject_name}`}</Text>
            </div>
            {getStatusTag(assignment.due_date, true)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center col-span-2"><UserOutlined className="mr-2 text-gray-400" /><Text type="secondary">ผู้สอน: </Text><Text className="ml-1">{assignment.teacher?.full_name}</Text></div>
            <div className="flex items-center"><CalendarOutlined className="mr-2 text-gray-400" /><Text type="secondary">กำหนดส่ง: </Text><Text className="ml-1">{dayjs(assignment.due_date).format('DD/MM/YYYY')}</Text></div>
            <div className="flex items-center"><HourglassOutlined className="mr-2 text-gray-400" /><Text type="secondary">ชม.ที่คาดหวัง: </Text><Text className="ml-1">{assignment.estimated_hours}</Text></div>
          </div>
        </div>
      ))}
    </div>
  );
};


export default function AcademicWorkloadPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (studentId) => {
      setLoading(true);
      const res = await getAcademicAssignmentsByStudent(studentId);
      if (res.success) {
        setAssignments(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลได้: " + res.error);
      }
      setLoading(false);
    };

    if (!authLoading && user && role === 'student') {
      // ใช้ user.id โดยตรงจาก useAuth context
      getStudentProfileByUserId(user.id).then(res => {
        if (res.success && res.data?.id) {
          fetchData(res.data.id);
        } else {
          setLoading(false);
          message.error("ไม่พบข้อมูลโปรไฟล์นักศึกษาของคุณ");
        }
      });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  return (
    <DashboardLayout title="ภาระงานวิชาการ">
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
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

          <Card bordered={false} className="shadow-md">
            <AssignmentDisplay assignments={assignments} loading={loading} />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}