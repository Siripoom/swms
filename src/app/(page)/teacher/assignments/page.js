"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAssignmentsByTeacher,
  getSubjectsForTeacher,
  createAssignmentAndDistribute,
  updateAssignment,
  deleteAssignment,
} from "@/services/assignments";
import { getAllTemplates } from "@/services/workloadTemplates";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, DatePicker, Spin, Tag, Grid // 1. Import Grid
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined, AppstoreAddOutlined
} from "@ant-design/icons";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid; // 2. Destructure useBreakpoint

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
  const screens = useBreakpoint(); // 3. Get screen size status

  // ... (ส่วน Logic เดิมทั้งหมด ไม่มีการเปลี่ยนแปลง) ...
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [assignRes, subjRes, tplRes] = await Promise.all([getAssignmentsByTeacher(user.id), getSubjectsForTeacher(), getAllTemplates()]);
    if (assignRes.success) setAssignments(assignRes.data); else message.error("ดึงข้อมูลภาระงานไม่สำเร็จ");
    if (subjRes.success) setSubjects(subjRes.data); else message.error("ดึงข้อมูลรายวิชาไม่สำเร็จ");
    if (tplRes.success) setTemplates(tplRes.data); else message.error("ดึงข้อมูลคลังไม่สำเร็จ");
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && role === 'teacher') { fetchData(); }
  }, [authLoading, user, role, fetchData]);

  const openModal = (mode, assignment = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedAssignment(assignment);
    if (mode === 'edit' && assignment) {
      form.setFieldsValue({ ...assignment, assigned_date: dayjs(assignment.assigned_date), due_date: dayjs(assignment.due_date) });
    } else {
      form.setFieldsValue({ assigned_date: dayjs() });
    }
    setIsModalOpen(true);
  };

  const handleTemplateChange = (templateId) => {
    const selectedTpl = templates.find(t => t.id === templateId);
    if (selectedTpl) { form.setFieldsValue({ assignment_name: selectedTpl.name, description: selectedTpl.description, type: selectedTpl.type, estimated_hours: selectedTpl.hours }); }
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    const assignmentData = { ...values, teacher_id: user.id, assigned_date: values.assigned_date.format('YYYY-MM-DD'), due_date: values.due_date.format('YYYY-MM-DD') };
    const result = modalMode === 'create' ? await createAssignmentAndDistribute(assignmentData) : await updateAssignment(selectedAssignment.id, assignmentData);
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`); await fetchData(); setIsModalOpen(false);
    } else { message.error("เกิดข้อผิดพลาด: " + result.error); }
    setFormLoading(false);
  };

  const handleDelete = async (assignmentId) => {
    const result = await deleteAssignment(assignmentId);
    if (result.success) {
      message.success("ลบภาระงานสำเร็จ"); await fetchData();
    } else { message.error("เกิดข้อผิดพลาดในการลบ: " + result.error); }
  };

  const getStatusTag = (dueDate) => {
    const isOverdue = dayjs(dueDate).isBefore(dayjs(), 'day');
    return isOverdue ? <Tag color="error" icon={<ClockCircleOutlined />}>เลยกำหนด</Tag> : <Tag color="success" icon={<ClockCircleOutlined />}>กำลังดำเนินการ</Tag>;
  };

  // --- 4. ปรับปรุง Columns ของตารางให้มี `responsive` prop ---
  const columns = [
    { title: 'ชื่องาน', dataIndex: 'assignment_name', key: 'assignment_name', render: (text) => <Text strong>{text}</Text> },
    { title: 'รายวิชา', dataIndex: ['subject', 'subject_code'], key: 'subject', responsive: ['md'], render: (text) => <Tag color="blue">{text}</Tag> },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', responsive: ['lg'], render: (type) => type === 'individual' ? 'เดี่ยว' : 'กลุ่ม' },
    { title: 'วันที่มอบหมาย', dataIndex: 'assigned_date', key: 'assigned_date', responsive: ['lg'], render: (date) => dayjs(date).format('DD MMM YYYY') },
    { title: 'กำหนดส่ง', dataIndex: 'due_date', key: 'due_date', responsive: ['md'], render: (date) => dayjs(date).format('DD MMM YYYY') },
    { title: 'ชม.', dataIndex: 'estimated_hours', key: 'estimated_hours', responsive: ['sm'], render: (value) => `${value}` },
    { title: 'สถานะ', key: 'status', render: (_, record) => getStatusTag(record.due_date) },
    {
      title: 'ดำเนินการ', key: 'actions', align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => openModal('edit', record)} /></Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm title="คุณแน่ใจหรือไม่ที่จะลบภาระงานนี้?" onConfirm={() => handleDelete(record.id)} okText="ยืนยัน" cancelText="ยกเลิก">
              <Button danger shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];

  if (authLoading) { return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>; }
  if (role !== 'teacher') { return <DashboardLayout><div>Access Denied</div></DashboardLayout>; }

  return (
    <DashboardLayout title="จัดการภาระงาน">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 p-5 rounded-lg border border-gray-200">
            <div>
              <Title level={2} className="!mb-1">จัดการภาระงาน (การบ้าน)</Title>
              <Text type="secondary">เพิ่ม แก้ไข หรือลบงานที่มอบหมายให้นักศึกษา</Text>
            </div>
            {/* 5. ปรับปุ่มให้แสดงผลต่างกันตามขนาดจอ */}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">
              {screens.md ? 'เพิ่มภาระงานใหม่' : ''}
            </Button>
          </div>
          <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
            <Table
              columns={columns}
              dataSource={assignments}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 'max-content' }} // เพิ่ม scroll แนวนอนสำหรับจอเล็กมากๆ
            />
          </div>
        </div>
      </div>
      <Modal
        title={<div className="flex items-center"> {modalMode === 'create' ? <PlusOutlined className="mr-2" /> : <EditOutlined className="mr-2" />} {modalMode === 'create' ? "เพิ่มภาระงานใหม่" : "แก้ไขภาระงาน"} </div>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[<Button key="back" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>, <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>บันทึก</Button>]}
        width={screens.md ? 700 : 'auto'} // Modal เต็มความกว้างบนจอมือถือ
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
          <Form.Item label="ดึงข้อมูลจากคลัง (ไม่บังคับ)" name="workload_template_id" tooltip="เลือกงานจากคลังเพื่อกรอกข้อมูลพื้นฐานให้อัตโนมัติ">
            <Select placeholder="เลือกต้นแบบภาระงาน..." allowClear onChange={handleTemplateChange} suffixIcon={<AppstoreAddOutlined />}>
              {templates.map(tpl => <Option key={tpl.id} value={tpl.id}>{`[${tpl.category}] ${tpl.name} (${tpl.hours} ชม.)`}</Option>)}
            </Select>
          </Form.Item>
          {/* 6. ปรับ Col ใน Form ให้รองรับ Responsive */}
          <Row gutter={24}>
            <Col xs={24} lg={12}><Form.Item label="ชื่อภาระงาน" name="assignment_name" rules={[{ required: true, message: 'กรุณากรอกชื่อภาระงาน' }]}><Input placeholder="เช่น รายงานเรื่อง..." /></Form.Item></Col>
            <Col xs={24} lg={12}><Form.Item label="รายวิชา" name="subject_id" rules={[{ required: true, message: 'กรุณาเลือกรายวิชา' }]}><Select placeholder="เลือกรายวิชา" showSearch optionFilterProp="children">{subjects.map(sub => <Option key={sub.id} value={sub.id}>{`${sub.subject_code} - ${sub.subject_name}`}</Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} lg={12}><Form.Item label="ประเภทงาน" name="type" rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}><Select placeholder="เลือกประเภท"><Option value="individual">งานเดี่ยว</Option><Option value="group">งานกลุ่ม</Option></Select></Form.Item></Col>
            <Col xs={24} lg={12}><Form.Item label="ชั่วโมงที่คาดว่าจะใช้" name="estimated_hours" rules={[{ required: true, message: 'กรุณากรอกชั่วโมง' }]}><InputNumber min={0.5} step={0.5} style={{ width: '100%' }} addonAfter="ชม." /></Form.Item></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} lg={12}><Form.Item label="วันที่มอบหมาย" name="assigned_date" rules={[{ required: true, message: 'กรุณาเลือกวันที่มอบหมาย' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" suffixIcon={<CalendarOutlined />} /></Form.Item></Col>
            <Col xs={24} lg={12}><Form.Item label="กำหนดส่ง" name="due_date" rules={[{ required: true, message: 'กรุณาเลือกกำหนดส่ง' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" suffixIcon={<CalendarOutlined />} /></Form.Item></Col>
          </Row>
          <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description"><Input.TextArea rows={4} placeholder="อธิบายรายละเอียดของงานที่มอบหมาย..." /></Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}