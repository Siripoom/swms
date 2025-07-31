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

const WorkloadTable = ({ workloads, onEdit, onDelete }) => {
  const columns = [
    { title: 'ชื่อกิจกรรม', dataIndex: 'activity_name', key: 'activity_name', ellipsis: true },
    { title: 'วันที่ทำ', dataIndex: 'work_date', key: 'work_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), width: 120 },
    { title: 'ชั่วโมงที่ใช้', dataIndex: 'hours_spent', key: 'hours_spent', width: 120, align: 'right' },
    {
      title: 'การดำเนินการ', key: 'actions', width: 120, render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Popconfirm title="ลบรายการนี้?" onConfirm={() => onDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];
  return <Table columns={columns} dataSource={workloads} rowKey="id" />;
};

// --- จุดที่แก้ไข 1: เอา 'academic' ออก ---
const categories = [
  { key: 'research', label: 'วิจัย/นวัตกรรม' },
  { key: 'academic_service', label: 'บริการวิชาการ' },
  { key: 'student_affairs', label: 'กิจการนักศึกษา' },
  { key: 'personal', label: 'ส่วนตัว/การใช้ชีวิต' },
];

const generateYearOptions = () => {
  const currentBuddhistYear = new Date().getFullYear() + 543;
  const years = [];
  for (let i = 0; i < 5; i++) {
    const year = currentBuddhistYear - i;
    years.push({ value: String(year), label: `ปีการศึกษา ${year}` });
  }
  return years;
};

const semesterOptions = [
  { value: 1, label: 'ภาคการศึกษาที่ 1' },
  { value: 2, label: 'ภาคการศึกษาที่ 2' },
  { value: 3, label: 'ภาคฤดูร้อน' },
  { value: 0, label: 'นอกภาคการศึกษา / ปิดเทอม' }
];

export default function OtherWorkloadPage() {
  const { role, loading: authLoading, studentId } = useAuth();

  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('research'); // เริ่มที่ tab แรกที่ไม่ใช่ academic
  const yearOptions = generateYearOptions();

  // --- จุดที่แก้ไข 2: fetchData ง่ายขึ้น ---
  const fetchData = async () => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    // ดึงเฉพาะ "ภาระงานอื่นๆ" เท่านั้น
    const workloadsRes = await getOtherWorkloadsByStudent(studentId);
    if (workloadsRes.success) {
      setWorkloads(workloadsRes.data);
    } else {
      message.error("ไม่สามารถดึงข้อมูลภาระงานได้: " + workloadsRes.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && role === 'student') {
      fetchData();
    }
  }, [authLoading, role, studentId]);

  const openModal = (mode, workload = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedWorkload(workload);
    if (mode === 'edit' && workload) {
      form.setFieldsValue({ ...workload, work_date: dayjs(workload.work_date) });
    } else {
      form.setFieldsValue({
        category: activeTab, // ตั้งค่า category เริ่มต้นตาม Tab ที่เปิดอยู่
        academic_year: String(new Date().getFullYear() + 543)
      });
    }
    setIsModalOpen(true);
  };

  // --- จุดที่แก้ไข 3: handleSubmit ง่ายขึ้น ---
  const handleSubmit = async (values) => {
    if (!studentId) { message.error("ไม่พบข้อมูลนักศึกษา"); return; }
    setFormLoading(true);
    const workloadData = {
      ...values,
      student_id: studentId,
      work_date: values.work_date.format('YYYY-MM-DD'),
      assignment_id: null, // หน้านี้ไม่มีการเชื่อมกับ assignment
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
        <Modal title={modalMode === 'create' ? "บันทึกภาระงาน" : "แก้ไขภาระงาน"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ปีการศึกษา" name="academic_year" rules={[{ required: true, message: 'กรุณาเลือกปีการศึกษา' }]}>
                  <Select options={yearOptions} placeholder="เลือกปีการศึกษา" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ภาคการศึกษา" name="semester" rules={[{ required: true, message: 'กรุณาเลือกภาคการศึกษา' }]}>
                  <Select options={semesterOptions} placeholder="เลือกภาคการศึกษา" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true }]}>
              <Select>{categories.map(cat => <Option key={cat.key} value={cat.key}>{cat.label}</Option>)}</Select>
            </Form.Item>
            {/* **ลบ Form.Item ของ assignment_id และ logic ที่เกี่ยวข้องออกไป** */}
            <Form.Item label="ชื่อกิจกรรม" name="activity_name" rules={[{ required: true }]}>
              <Input placeholder="กรอกชื่อกิจกรรม" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="วันที่ทำ" name="work_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
              <Col span={12}><Form.Item label="ชั่วโมงที่ใช้" name="hours_spent" rules={[{ required: true }]}><InputNumber min={0.5} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item label="รายละเอียด" name="description"><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}