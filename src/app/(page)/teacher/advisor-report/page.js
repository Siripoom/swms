"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getMyAdvisees } from "@/services/advisor";
import { Table, Card, Typography, Spin, message, Button, Empty, Tooltip } from "antd";
import { TeamOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function AdvisorListPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [advisees, setAdvisees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      const res = await getMyAdvisees(user.id);
      if (res.success) {
        setAdvisees(res.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลนักศึกษาในที่ปรึกษาได้");
      }
      setLoading(false);
    };

    if (!authLoading && (role === 'teacher' || role === 'department_head')) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  const columns = [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'student_identifier',
      key: 'student_identifier',
      sorter: (a, b) => a.student_identifier.localeCompare(b.student_identifier),
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'student_full_name',
      key: 'student_full_name',
    },
    {
      title: 'ชั้นปี',
      dataIndex: 'student_year_level',
      key: 'student_year_level',
      align: 'center',
    },
    {
      title: 'ดูรายงาน',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="ดูรายงานสรุปภาระงานของนักศึกษาคนนี้">
          <Button
            icon={<EyeOutlined />}
            onClick={() => router.push(`/teacher/advisor-report/${record.student_pk_id}`)}
          >
            ดูรายละเอียด
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (role !== 'teacher' && role !== 'department_head') {
    return <DashboardLayout><div>Access Denied</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="นักศึกษาในที่ปรึกษา">
      <div className="p-6">
        <Card>
          <Title level={2}><TeamOutlined className="mr-2" />นักศึกษาในที่ปรึกษา</Title>
          <Text type="secondary">รายชื่อนักศึกษาทั้งหมดที่อยู่ในความดูแลของคุณ</Text>
          <Table
            columns={columns}
            dataSource={advisees}
            loading={loading}
            rowKey="student_pk_id"
            style={{ marginTop: '24px' }}
            locale={{ emptyText: <Empty description="ไม่พบข้อมูลนักศึกษาในที่ปรึกษา" /> }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}