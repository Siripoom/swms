"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllTemplates, createTemplate, updateTemplate, deleteTemplate
} from "@/services/workloadTemplates";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, Tabs, Spin, Grid, Empty
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined, SearchOutlined, BookOutlined, ExperimentOutlined, TeamOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// --- Component ย่อยสำหรับตาราง ---
const TemplateTable = ({ templates, onEdit, onDelete, loading }) => {
  const columns = [
    { title: 'ชื่อภาระงาน', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', render: (type) => type === 'individual' ? 'งานเดี่ยว' : 'งานกลุ่ม' },
    { title: 'ชม.', dataIndex: 'hours', key: 'hours' },
    { title: 'รายละเอียด', dataIndex: 'description', key: 'description', responsive: ['md'] }, // ซ่อนบนจอมือถือ
    {
      title: 'ดำเนินการ', key: 'actions', align: 'center', width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm title="คุณแน่ใจหรือไม่ที่จะลบเทมเพลตนี้?" onConfirm={() => onDelete(record.id)} okText="ยืนยัน" cancelText="ยกเลิก">
              <Button danger shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];
  return (
    <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: <Empty description="ไม่พบข้อมูลในหมวดหมู่นี้" /> }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
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
  const screens = useBreakpoint();

  // --- Logic เดิม, ไม่มีการเปลี่ยนแปลง ---
  const fetchTemplates = async () => {
    setLoading(true);
    const res = await getAllTemplates();
    if (res.success) setTemplates(res.data);
    else message.error("ไม่สามารถดึงข้อมูลเทมเพลตได้");
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'teacher')) { // อนุญาต teacher เข้าถึงด้วย
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
    const result = modalMode === 'create' ? await createTemplate(values) : await updateTemplate(selectedTemplate.id, values);
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      await fetchTemplates();
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
      await fetchTemplates();
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };
  // --- สิ้นสุด Logic เดิม ---


  const filterTemplates = (category) => {
    if (!templates) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    return templates.filter(t =>
      t.category === category &&
      (t.name?.toLowerCase().includes(lowerSearchTerm) || t.description?.toLowerCase().includes(lowerSearchTerm))
    );
  };

  const tabItems = [
    { key: 'academic', label: <Space><BookOutlined />วิชาการ</Space>, children: <TemplateTable templates={filterTemplates('academic')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} loading={loading} /> },
    { key: 'research', label: <Space><ExperimentOutlined />วิจัย/นวัตกรรม</Space>, children: <TemplateTable templates={filterTemplates('research')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} loading={loading} /> },
    { key: 'academic_service', label: <Space><TeamOutlined />บริการวิชาการ</Space>, children: <TemplateTable templates={filterTemplates('academic_service')} onEdit={(t) => openModal('edit', t)} onDelete={handleDelete} loading={loading} /> },
  ];

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (!['admin', 'teacher'].includes(role)) return <DashboardLayout><div>Access Denied</div></DashboardLayout>;


  return (
    <DashboardLayout title="คลังภาระงาน">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3"><DatabaseOutlined />คลังภาระงาน</Title>
              <Text type="secondary">จัดการต้นแบบภาระงานที่ใช้บ่อย เพื่อความรวดเร็วในการสร้างงาน</Text>
            </div>
            {role === 'admin' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">
                {screens.sm ? 'เพิ่มต้นแบบใหม่' : ''}
              </Button>
            )}
          </div>

          <Tabs
            defaultActiveKey="academic"
            items={tabItems}
            tabBarExtraContent={
              <Input
                placeholder="ค้นหา..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                style={{ width: screens.xs ? 150 : 250 }} // ปรับขนาดช่องค้นหาตามจอ
              />
            }
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center">
            {modalMode === 'create' ? <PlusOutlined className="mr-2" /> : <EditOutlined className="mr-2" />}
            {modalMode === 'create' ? "เพิ่มภาระงานต้นแบบ" : "แก้ไขภาระงานต้นแบบ"}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>,
          <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>บันทึก</Button>
        ]}
        width={screens.md ? 600 : 'auto'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
                <Select placeholder="เลือกหมวดหมู่">
                  <Option value="academic">วิชาการ</Option>
                  <Option value="research">วิจัย/นวัตกรรม</Option>
                  <Option value="academic_service">บริการวิชาการ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="ประเภท" name="type" rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                <Select placeholder="เลือกประเภท">
                  <Option value="individual">งานเดี่ยว</Option>
                  <Option value="group">งานกลุ่ม</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="ชื่อภาระงาน" name="name" rules={[{ required: true, message: 'กรุณากรอกชื่อภาระงาน' }]}>
            <Input placeholder="เช่น การเขียนรายงาน, การทำ Presentation" />
          </Form.Item>

          <Form.Item label="ชั่วโมงที่คาดว่าจะใช้ (โดยประมาณ)" name="hours" rules={[{ required: true, message: 'กรุณากรอกชั่วโมง' }]}>
            <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} addonAfter="ชม." />
          </Form.Item>

          <Form.Item label="รายละเอียด (ไม่บังคับ)" name="description">
            <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดของต้นแบบภาระงานนี้..." />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}