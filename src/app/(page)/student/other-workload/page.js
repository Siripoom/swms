// src/app/student/other-workloads/page.js (ฉบับสมบูรณ์)
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getOtherWorkloadsByStudent,
  createOtherWorkload,
  updateOtherWorkload,
  deleteOtherWorkload,
  getStudentProfileByUserId,
  getAcademicAssignmentsByStudent,
} from "@/services/workloads";
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, DatePicker, Tabs, Spin
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const WorkloadTable = ({ workloads, onEdit, onDelete }) => {
  const columns = [
    { title: 'ชื่อกิจกรรม', dataIndex: 'activity_name', key: 'activity_name' },
    { title: 'วันที่ทำ', dataIndex: 'work_date', key: 'work_date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { title: 'ชั่วโมงที่ใช้', dataIndex: 'hours_spent', key: 'hours_spent' },
    { title: 'รายละเอียด', dataIndex: 'description', key: 'description' },
    {
      title: 'การดำเนินการ', key: 'actions', render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Popconfirm title="ลบรายการนี้?" onConfirm={() => onDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];
  return <Table columns={columns} dataSource={workloads} rowKey="id" />;
};

const categories = [
  { key: 'research', label: 'วิจัย/นวัตกรรม' },
  { key: 'academic_service', label: 'บริการวิชาการ' },
  { key: 'student_affairs', label: 'กิจการนักศึกษา' },
  { key: 'personal', label: 'ส่วนตัว/การใช้ชีวิต' },
];

export default function OtherWorkloadPage() {
  const { user, userProfile, role, loading: authLoading } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('research');

  const fetchData = async (currentStudentId) => {
    setLoading(true);
    // ดึงข้อมูลทั้ง 2 ส่วนพร้อมกัน
    const [workloadsRes, assignmentsRes] = await Promise.all([
      getOtherWorkloadsByStudent(currentStudentId),
      getAcademicAssignmentsByStudent(currentStudentId)
    ]);

    if (workloadsRes.success) setWorkloads(workloadsRes.data);
    else message.error("ไม่สามารถดึงข้อมูลภาระงานได้");

    if (assignmentsRes.success) setAcademicAssignments(assignmentsRes.data);
    else message.error("ไม่สามารถดึงข้อมูลงานที่ได้รับมอบหมายได้");

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && role === 'student') {
      // เราได้ student_id จาก userProfile ที่โหลดใน AuthContext แล้ว
      // แต่ถ้าไม่มี เราสามารถดึงใหม่ได้
      if (userProfile?.student_id) { // สมมติว่า student_id อยู่ใน userProfile
        setStudentProfile({ id: userProfile.id }); // student.id จาก userProfile (ถ้าโครงสร้างเป็นแบบนั้น)
        fetchData(userProfile.id);
      } else {
        getStudentProfileByUserId(user.id).then(res => {
          if (res.success) {
            setStudentProfile(res.data);
            fetchData(res.data.id);
          } else {
            setLoading(false);
            message.error("ไม่พบโปรไฟล์นักศึกษาของคุณ");
          }
        });
      }
    }
  }, [authLoading, user, role, userProfile]);

  const openModal = (mode, workload = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedWorkload(workload);
    if (mode === 'edit' && workload) {
      form.setFieldsValue({ ...workload, work_date: dayjs(workload.work_date) });
    } else {
      // ตั้งค่า category เริ่มต้นตาม Tab ที่เปิดอยู่
      form.setFieldsValue({ category: activeTab });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    const workloadData = {
      ...values,
      student_id: studentProfile.id,
      work_date: values.work_date.format('YYYY-MM-DD'),
    };
    const action = modalMode === 'create' ? createOtherWorkload(workloadData) : updateOtherWorkload(selectedWorkload.id, workloadData);
    const result = await action;
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      fetchData(studentProfile.id);
      setIsModalOpen(false);
    } else {
      message.error("เกิดข้อผิดพลาด: " + result.error);
    }
    setFormLoading(false);
  };

  const handleDelete = async (workloadId) => {
    const result = await deleteOtherWorkload(workloadId);
    if (result.success) {
      message.success("ลบรายการสำเร็จ");
      fetchData(studentProfile.id);
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  const tabItems = categories.map(cat => ({
    key: cat.key,
    label: cat.label,
    children: <WorkloadTable workloads={workloads.filter(w => w.category === cat.key)} onEdit={(w) => openModal('edit', w)} onDelete={handleDelete} />
  }));

  return (
    <DashboardLayout title="ภาระงานอื่นๆ">
      <div style={{ padding: "24px" }}>
        <Card style={{ marginBottom: "24px" }}>
          <Row justify="space-between" align="middle">
            <Col><Title level={2} style={{ margin: 0 }}>ภาระงานอื่นๆ</Title></Col>
            <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">เพิ่มรายการ</Button></Col>
          </Row>
        </Card>
        <Card>
          <Tabs defaultActiveKey="research" items={tabItems} onChange={(key) => setActiveTab(key)} />
        </Card>
        <Modal title={modalMode === 'create' ? "เพิ่มรายการภาระงาน" : "แก้ไขรายการภาระงาน"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true }]}>
              <Select>
                {categories.map(cat => <Option key={cat.key} value={cat.key}>{cat.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="ชื่อกิจกรรม" name="activity_name" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="วันที่ทำกิจกรรม" name="work_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
              <Col span={12}><Form.Item label="ชั่วโมงที่ใช้" name="hours_spent" rules={[{ required: true }]}><InputNumber min={0.5} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description"><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}