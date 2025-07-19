"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/services/workloadTemplates";
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, Tabs, Spin
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined, SearchOutlined
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

const TemplateTable = ({ templates, onEdit, onDelete }) => {
  const columns = [
    { title: 'ชื่อภาระงาน', dataIndex: 'name', key: 'name' },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', render: (type) => type === 'individual' ? 'งานเดี่ยว' : 'งานกลุ่ม' },
    { title: 'ชั่วโมง', dataIndex: 'hours', key: 'hours' },
    { title: 'รายละเอียด', dataIndex: 'description', key: 'description' },
    {
      title: 'การดำเนินการ', key: 'actions', render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Popconfirm title="ลบเทมเพลตนี้?" onConfirm={() => onDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];
  return <Table columns={columns} dataSource={templates} rowKey="id" />;
};

export default function WorkloadRepositoryPage() {
  const { role, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");

  const filterTemplates = (category) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return templates.filter(t =>
      t.category === category &&
      (
        t.name?.toLowerCase().includes(lowerSearchTerm) ||
        t.description?.toLowerCase().includes(lowerSearchTerm)
      )
    );
  };

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await getAllTemplates();
    if (res.success) setTemplates(res.data);
    else message.error("ไม่สามารถดึงข้อมูลเทมเพลตได้");
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchTemplates();
    }
  }, [authLoading, role]);

  const openModal = (mode, template = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedTemplate(template);
    if (mode === 'edit' && template) {
      form.setFieldsValue(template);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    const action = modalMode === 'create' ? createTemplate(values) : updateTemplate(selectedTemplate.id, values);
    const result = await action;
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      fetchTemplates();
      setIsModalOpen(false);
    } else {
      message.error("เกิดข้อผิดพลาด: " + result.error);
    }
    setFormLoading(false);
  };

  const handleDelete = async (templateId) => {
    const result = await deleteTemplate(templateId);
    if (result.success) {
      message.success("ลบเทมเพลตสำเร็จ");
      fetchTemplates();
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };

  const tabItems = [
    { key: 'academic', label: 'วิชาการ (Academic)', children: <TemplateTable templates={filterTemplates('academic')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} /> },
    { key: 'research', label: 'วิจัย/นวัตกรรม (Research & Innovation)', children: <TemplateTable templates={filterTemplates('research')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} /> },
    { key: 'academic_service', label: 'บริการวิชาการ (Academic Services)', children: <TemplateTable templates={filterTemplates('academic_service')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} /> },
  ];

  // *** ลบ 2 บรรทัดที่เป็นปัญหาทิ้งไปแล้ว ***

  return (
    <DashboardLayout title="คลังภาระงาน">
      {authLoading ? (
        // ถ้า Auth กำลังโหลด: แสดง Spinner กลาง Layout
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" />
        </div>
      ) : role !== 'admin' ? (
        // ถ้าไม่มีสิทธิ์: แสดงข้อความ Access Denied
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Access Denied</h1>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      ) : (
        // ถ้าผ่านหมด ให้ Render เนื้อหาหลักของหน้า
        <div style={{ padding: "24px" }}>
          <Card style={{ marginBottom: "24px" }}>
            <Row justify="space-between" align="middle">
              <Col><Title level={2} style={{ margin: 0 }}>คลังภาระงาน (Work Repository)</Title></Col>
              <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">เพิ่มภาระงานใหม่</Button></Col>
            </Row>
          </Card>

          <Card>
            <Input
              placeholder="ค้นหาชื่อภาระงาน หรือรายละเอียด..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ marginBottom: 16, maxWidth: 400 }}
            />
            <Tabs defaultActiveKey="academic" items={tabItems} tabBarExtraContent={loading && <Spin />} />
          </Card>

          <Modal title={modalMode === 'create' ? "เพิ่มภาระงานต้นแบบ" : "แก้ไขภาระงานต้นแบบ"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true }]}>
                <Select>
                  <Option value="academic">วิชาการ</Option>
                  <Option value="research">วิจัย/นวัตกรรม</Option>
                  <Option value="academic_service">บริการวิชาการ</Option>
                </Select>
              </Form.Item>
              <Form.Item label="ชื่อภาระงาน" name="name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item label="ประเภท" name="type" rules={[{ required: true }]}>
                <Select>
                  <Option value="individual">งานเดี่ยว</Option>
                  <Option value="group">งานกลุ่ม</Option>
                </Select>
              </Form.Item>
              <Form.Item label="ชั่วโมงที่คาดว่าจะใช้" name="hours" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description"><Input.TextArea rows={3} /></Form.Item>
            </Form>
          </Modal>
        </div>
      )}
    </DashboardLayout>
  );
}