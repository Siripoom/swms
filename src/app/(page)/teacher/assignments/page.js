"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAssignmentsByTeacher,
  getSubjectsForTeacher,
  createAssignmentAndDistribute,
  updateAssignment,
  deleteAssignment,
} from "@/services/assignments"; // **ตรวจสอบ Path**
import { getAllTemplates } from "@/services/workloadTemplates"; // **Import เพิ่ม**
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, DatePicker, Spin, Tag
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined
} from "@ant-design/icons";
import dayjs from 'dayjs'; // **ต้องติดตั้ง dayjs: npm install dayjs**

const { Title, Text } = Typography;
const { Option } = Select;

export default function TeacherAssignmentsPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async (teacherId) => {
    setLoading(true);
    const [assignRes, subjRes, tplRes] = await Promise.all([
      getAssignmentsByTeacher(teacherId),
      getSubjectsForTeacher(),
      getAllTemplates(),
    ]);
    if (assignRes.success) setAssignments(assignRes.data);
    else message.error("ไม่สามารถดึงข้อมูลภาระงานได้");

    if (subjRes.success) setSubjects(subjRes.data);
    else message.error("ไม่สามารถดึงข้อมูลรายวิชาได้");

    if (tplRes.success) setTemplates(tplRes.data);
    else message.error("ไม่สามารถดึงข้อมูลจากคลังได้");

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && role === 'teacher') {
      fetchData(user.id);
    }
  }, [authLoading, user, role]);

  const openModal = (mode, assignment = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedAssignment(assignment);
    if (mode === 'edit' && assignment) {
      form.setFieldsValue({
        ...assignment,
        assigned_date: dayjs(assignment.assigned_date),
        due_date: dayjs(assignment.due_date),
      });
    }
    setIsModalOpen(true);
  };

  const handleTemplateChange = (templateId) => {
    const selectedTpl = templates.find(t => t.id === templateId);
    if (selectedTpl) {
      form.setFieldsValue({
        assignment_name: selectedTpl.name,
        description: selectedTpl.description,
        type: selectedTpl.type,
        estimated_hours: selectedTpl.hours,
      });
    }
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    const assignmentData = {
      ...values,
      teacher_id: user.id,
      assigned_date: values.assigned_date.format('YYYY-MM-DD'),
      due_date: values.due_date.format('YYYY-MM-DD'),
    };

    const action = modalMode === 'create'
      ? createAssignmentAndDistribute(assignmentData) : updateAssignment(selectedAssignment.id, assignmentData);
    const result = await action;

    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      fetchData(user.id);
      setIsModalOpen(false);
    } else {
      message.error("เกิดข้อผิดพลาด: " + result.error);
    }
    setFormLoading(false);
  };

  const handleDelete = async (assignmentId) => {
    const result = await deleteAssignment(assignmentId);
    if (result.success) {
      message.success("ลบภาระงานสำเร็จ");
      fetchData(user.id);
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };

  const getStatusTag = (dueDate) => {
    if (dayjs(dueDate).isBefore(dayjs(), 'day')) {
      return <Tag color="error">เลยกำหนด</Tag>;
    }
    return <Tag color="success">กำลังดำเนินการ</Tag>;
  };

  const columns = [
    { title: 'ชื่องาน', dataIndex: 'assignment_name', key: 'assignment_name' },
    { title: 'รายวิชา', dataIndex: ['subject', 'subject_name'], key: 'subject' },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', render: (type) => type === 'individual' ? 'เดี่ยว' : 'กลุ่ม' },
    { title: 'วันที่มอบหมาย', dataIndex: 'assigned_date', key: 'assigned_date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { title: 'กำหนดส่ง', dataIndex: 'due_date', key: 'due_date', render: (date) => dayjs(date).format('DD/MM/YYYY') },

    {
      title: 'ชั่วโมง',
      dataIndex: 'estimated_hours',
      key: 'estimated_hours',
      render: (value) => `${value} ชม.`
    },

    { title: 'สถานะ', key: 'status', render: (_, record) => getStatusTag(record.due_date) },

    {
      title: 'การดำเนินการ',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button icon={<EditOutlined />} onClick={() => openModal('edit', record)} />
          </Tooltip>
          <Popconfirm title="ลบภาระงานนี้?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];


  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }
  if (role !== 'teacher') {
    return <DashboardLayout><div>Access Denied for this role.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="จัดการภาระงาน">
      <div style={{ padding: "24px" }}>
        <Card style={{ marginBottom: "24px" }}>
          <Row justify="space-between" align="middle">
            <Col><Title level={2} style={{ margin: 0 }}>จัดการภาระงาน (การบ้าน)</Title></Col>
            <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">เพิ่มภาระงาน</Button></Col>
          </Row>
        </Card>

        <Card>
          <Table columns={columns} dataSource={assignments} rowKey="id" loading={loading} />
        </Card>

        <Modal title={modalMode === 'create' ? "เพิ่มภาระงานใหม่" : "แก้ไขภาระงาน"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="ดึงข้อมูลจากคลัง (ไม่บังคับ)" name="workload_template_id">
              <Select placeholder="เลือกต้นแบบภาระงาน..." allowClear onChange={handleTemplateChange}>
                {templates.map(tpl => <Option key={tpl.id} value={tpl.id}>{`[${tpl.category}] ${tpl.name}`}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="ชื่อภาระงาน" name="assignment_name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="รายวิชา" name="subject_id" rules={[{ required: true }]}>
              <Select placeholder="เลือกรายวิชา">
                {subjects.map(sub => <Option key={sub.id} value={sub.id}>{`${sub.subject_code} - ${sub.subject_name}`}</Option>)}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ประเภทงาน" name="type" rules={[{ required: true }]}>
                  <Select><Option value="individual">งานเดี่ยว</Option><Option value="group">งานกลุ่ม</Option></Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="ชั่วโมงที่คาดว่าจะใช้" name="estimated_hours" rules={[{ required: true }]}>
                  <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="วันที่มอบหมาย" name="assigned_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="กำหนดส่ง" name="due_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
              </Col>
            </Row>
            <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description"><Input.TextArea rows={4} /></Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}