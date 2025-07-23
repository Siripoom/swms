"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getOtherWorkloadsByStudent,
  createOtherWorkload,
  updateOtherWorkload,
  deleteOtherWorkload,
} from "@/services/workloads";
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, DatePicker, Tabs, Spin
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

// Component ย่อยสำหรับแสดงตาราง (ไม่ต้องแก้ไข)
const WorkloadTable = ({ workloads, onEdit, onDelete }) => {
  const columns = [
    { title: 'ชื่อกิจกรรม', dataIndex: 'activity_name', key: 'activity_name', ellipsis: true },
    { title: 'วันที่ทำ', dataIndex: 'work_date', key: 'work_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), width: 120 },
    { title: 'ชั่วโมงที่ใช้', dataIndex: 'hours_spent', key: 'hours_spent', width: 120 },
    { title: 'รายละเอียด', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'การดำเนินการ', key: 'actions', width: 120, render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Popconfirm title="คุณแน่ใจว่าจะลบรายการนี้?" onConfirm={() => onDelete(record.id)} okText="ใช่, ลบเลย" cancelText="ยกเลิก">
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];
  return <Table columns={columns} dataSource={workloads} rowKey="id" />;
};

// ค่าคงที่สำหรับหมวดหมู่ (ไม่ต้องแก้ไข)
const categories = [
  { key: 'research', label: 'วิจัย/นวัตกรรม' },
  { key: 'academic_service', label: 'บริการวิชาการ' },
  { key: 'student_affairs', label: 'กิจการนักศึกษา' },
  { key: 'personal', label: 'ส่วนตัว/การใช้ชีวิต' },
];

export default function OtherWorkloadPage() {
  const { userProfile, role, loading: authLoading } = useAuth();
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true); // State loading ของหน้านี้
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('research');

  // ฟังก์ชันดึงข้อมูล (ไม่ต้องแก้ไข)
  const fetchData = async () => {
    const studentProfileId = userProfile?.student_profile_id;
    if (!studentProfileId) {
      message.error("ไม่สามารถระบุโปรไฟล์นักศึกษาได้");
      setLoading(false);
      return;
    }
    setLoading(true);
    const workloadsRes = await getOtherWorkloadsByStudent(studentProfileId);
    if (workloadsRes.success) {
      setWorkloads(workloadsRes.data);
    } else {
      message.error("ไม่สามารถดึงข้อมูลภาระงานได้: " + workloadsRes.error);
    }
    setLoading(false);
  };

  // useEffect สำหรับดึงข้อมูลครั้งแรก (ไม่ต้องแก้ไข)
  useEffect(() => {
    if (authLoading) return;
    if (role === 'student' && userProfile) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, userProfile, role]);

  // ฟังก์ชันจัดการ Modal และ Form (ไม่ต้องแก้ไข)
  const openModal = (mode, workload = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedWorkload(workload);
    if (mode === 'edit' && workload) {
      form.setFieldsValue({ ...workload, work_date: dayjs(workload.work_date) });
    } else {
      form.setFieldsValue({ category: activeTab });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    const studentProfileId = userProfile?.student_profile_id;
    if (!studentProfileId) {
      message.error("ไม่พบข้อมูลนักศึกษา ไม่สามารถบันทึกได้");
      return;
    }
    setFormLoading(true);
    const workloadData = {
      ...values,
      student_id: studentProfileId,
      work_date: values.work_date.format('YYYY-MM-DD'),
    };
    const action = modalMode === 'create' ? createOtherWorkload(workloadData) : updateOtherWorkload(selectedWorkload.id, workloadData);
    const result = await action;
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      fetchData();
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
      fetchData();
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };


  // --- ส่วนโครงสร้างการแสดงผลที่แก้ไขแล้ว ---

  // 1. จัดการ Loading ของ Auth (กรณีรีเฟรชหน้านี้)
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 2. จัดการสิทธิ์การเข้าถึง
  if (role !== 'student') {
    return (
      <DashboardLayout title="Access Denied">
        <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
      </DashboardLayout>
    );
  }

  // 3. Render Layout หลักเสมอ แล้วเช็ค Loading ของหน้านี้ข้างใน
  return (
    <DashboardLayout title="ภาระงานอื่นๆ">
      {loading ? (
        // ถ้าหน้านี้กำลังโหลดข้อมูล -> แสดง Spinner ในพื้นที่ Content
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '48px' }}>
          <Spin size="large" />
        </div>
      ) : (
        // ถ้าโหลดเสร็จแล้ว -> แสดงเนื้อหาทั้งหมดของหน้า
        <>
          <div style={{ padding: "24px" }}>
            <Card style={{ marginBottom: "24px" }}>
              <Row justify="space-between" align="middle">
                <Col><Title level={2} style={{ margin: 0 }}>ภาระงานอื่นๆ</Title></Col>
                <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">เพิ่มรายการ</Button></Col>
              </Row>
            </Card>
            <Card>
              <Tabs
                defaultActiveKey="research"
                items={categories.map(cat => ({
                  key: cat.key,
                  label: cat.label,
                  children: <WorkloadTable workloads={workloads.filter(w => w.category === cat.key)} onEdit={openModal.bind(null, 'edit')} onDelete={handleDelete} />
                }))}
                onChange={(key) => setActiveTab(key)}
              />
            </Card>
          </div>
          <Modal title={modalMode === 'create' ? "เพิ่มรายการภาระงาน" : "แก้ไขรายการภาระงาน"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
                <Select>
                  {categories.map(cat => <Option key={cat.key} value={cat.key}>{cat.label}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="ชื่อกิจกรรม" name="activity_name" rules={[{ required: true, message: 'กรุณากรอกชื่อกิจกรรม' }]}><Input /></Form.Item>
              <Row gutter={16}>
                <Col span={12}><Form.Item label="วันที่ทำกิจกรรม" name="work_date" rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                <Col span={12}><Form.Item label="ชั่วโมงที่ใช้" name="hours_spent" rules={[{ required: true, message: 'กรุณากรอกชั่วโมง' }]}><InputNumber min={0.5} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
              </Row>
              <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description"><Input.TextArea rows={3} /></Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </DashboardLayout>
  );
}