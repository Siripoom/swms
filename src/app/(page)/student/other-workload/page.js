"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getOtherWorkloadsByStudent,
  createOtherWorkload,
  updateOtherWorkload,
  deleteOtherWorkload,
  getAcademicAssignmentsByStudent,
} from "@/services/workloads";
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, DatePicker, Tabs, Spin, Empty
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ContainerOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// --- 1. สร้าง Component การ์ดสำหรับแสดงผลบนมือถือ ---
const WorkloadItemCard = ({ workload, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
    <div className="flex justify-between items-start gap-4">
      <Text strong className="block text-base flex-1">{workload.activity_name}</Text>
      <Text type="secondary" className="whitespace-nowrap">{dayjs(workload.work_date).format('DD/MM/YYYY')}</Text>
    </div>
    <div className="mt-3 flex justify-between items-center">
      <div>
        <Text type="secondary">ชั่วโมงที่ใช้: </Text>
        <Text strong className="text-blue-600">{workload.hours_spent}</Text>
      </div>
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(workload)}>แก้ไข</Button>
        <Popconfirm title="ลบรายการนี้?" onConfirm={() => onDelete(workload.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  </div>
);

// --- 2. สร้าง Component ตารางที่ Responsive ---
const ResponsiveWorkloadList = ({ workloads, onEdit, onDelete, loading }) => {
  const columns = [
    { title: 'ชื่อกิจกรรม/งาน', dataIndex: 'activity_name', key: 'activity_name', ellipsis: true },
    { title: 'วันที่ทำ', dataIndex: 'work_date', key: 'work_date', render: (date) => dayjs(date).format('DD/MM/YYYY'), width: 120, responsive: ['md'] },
    { title: 'ชั่วโมงที่ใช้', dataIndex: 'hours_spent', key: 'hours_spent', width: 120, align: 'right' },
    {
      title: 'การดำเนินการ', key: 'actions', width: 120, align: 'center', render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => onEdit(record)} /></Tooltip>
          <Popconfirm title="ลบรายการนี้?" onConfirm={() => onDelete(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Spin /></div>;
  }

  if (!workloads || workloads.length === 0) {
    return <div className="py-10"><Empty description="ไม่พบข้อมูลในหมวดหมู่นี้" /></div>;
  }

  return (
    <>
      {/* สำหรับจอ Desktop (md ขึ้นไป) */}
      <div className="hidden md:block">
        <Table columns={columns} dataSource={workloads} rowKey="id" />
      </div>
      {/* สำหรับจอมือถือ (เล็กกว่า md) */}
      <div className="block md:hidden">
        {workloads.map(w => <WorkloadItemCard key={w.id} workload={w} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </>
  );
};


const categories = [
  // { key: 'academic', label: 'วิชาการ' },
  { key: 'research', label: 'วิจัย/นวัตกรรม' },
  { key: 'academic_service', label: 'บริการวิชาการ' },
  { key: 'student_affairs', label: 'กิจการนักศึกษา' },
  { key: 'personal', label: 'ส่วนตัว' },
];

export default function OtherWorkloadPage() {
  const { role, loading: authLoading, studentId } = useAuth();
  const [workloads, setWorkloads] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('academic');
  const [isAcademic, setIsAcademic] = useState(true);

  // --- ส่วน Logic (ไม่มีการเปลี่ยนแปลง) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) { setLoading(false); return; }
      setLoading(true);
      const [workloadsRes, assignmentsRes] = await Promise.all([
        getOtherWorkloadsByStudent(studentId),
        getAcademicAssignmentsByStudent(studentId)
      ]);
      if (workloadsRes.success) setWorkloads(workloadsRes.data);
      if (assignmentsRes.success) setAcademicAssignments(assignmentsRes.data);
      setLoading(false);
    };

    if (!authLoading && role === 'student') {
      fetchData();
    }
  }, [authLoading, role, studentId]);

  const openModal = (mode, workload = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedWorkload(workload);
    const isCurrentlyAcademic = workload ? workload.category === 'academic' : activeTab === 'academic';
    setIsAcademic(isCurrentlyAcademic);

    if (mode === 'edit' && workload) {
      form.setFieldsValue({ ...workload, work_date: dayjs(workload.work_date) });
    } else {
      form.setFieldsValue({ category: activeTab, work_date: dayjs() });
    }
    setIsModalOpen(true);
  };

  const handleFormValuesChange = (changedValues) => {
    if ('category' in changedValues) {
      const isNowAcademic = changedValues.category === 'academic';
      setIsAcademic(isNowAcademic);
      form.setFieldsValue({ activity_name: undefined, assignment_id: null });
    }
    if ('assignment_id' in changedValues) {
      const selectedAsn = academicAssignments.find(a => a.id === changedValues.assignment_id);
      form.setFieldsValue({ activity_name: selectedAsn ? selectedAsn.assignment_name : undefined });
    }
  };

  const handleSubmit = async (values) => {
    if (!studentId) { message.error("ไม่พบข้อมูลนักศึกษา"); return; }
    setFormLoading(true);
    const workloadData = {
      ...values, student_id: studentId,
      work_date: values.work_date.format('YYYY-MM-DD'),
      assignment_id: (values.category === 'academic' && values.assignment_id) ? values.assignment_id : null,
    };
    const action = modalMode === 'create' ? createOtherWorkload(workloadData) : updateOtherWorkload(selectedWorkload.id, workloadData);
    const result = await action;
    if (result.success) {
      message.success(`บันทึกข้อมูลสำเร็จ`);
      const workloadsRes = await getOtherWorkloadsByStudent(studentId);
      if (workloadsRes.success) setWorkloads(workloadsRes.data);
      setIsModalOpen(false);
    } else { message.error("เกิดข้อผิดพลาด: " + result.error); }
    setFormLoading(false);
  };

  const handleDelete = async (workloadId) => {
    const result = await deleteOtherWorkload(workloadId);
    if (result.success) {
      message.success("ลบรายการสำเร็จ");
      const workloadsRes = await getOtherWorkloadsByStudent(studentId);
      if (workloadsRes.success) setWorkloads(workloadsRes.data);
    } else { message.error("เกิดข้อผิดพลาดในการลบ: " + result.error); }
  };
  // --- สิ้นสุดส่วน Logic ---


  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'student') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  // --- 3. ย้ายปุ่มเพิ่มรายการออกมาเพื่อใช้ใน tabBarExtraContent ---
  const addButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')}>
      เพิ่มรายการ
    </Button>
  );

  const tabItems = categories.map(cat => ({
    key: cat.key,
    label: cat.label,
    children: <ResponsiveWorkloadList
      loading={loading}
      workloads={workloads.filter(w => w.category === cat.key)}
      onEdit={(w) => openModal('edit', w)}
      onDelete={handleDelete}
    />
  }));

  return (
    <DashboardLayout title="บันทึกภาระงาน">
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* 4. ปรับปรุง Header */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg mr-4">
                <ContainerOutlined style={{ fontSize: '24px' }} />
              </div>
              <div>
                <Title level={2} className="!m-0">บันทึกภาระงาน</Title>
                <Text type="secondary">บันทึกชั่วโมงการทำงานและกิจกรรมต่างๆ ของคุณ</Text>
              </div>
            </div>
          </div>

          {/* 5. ปรับปรุง Card และ Tabs */}
          <Card bordered={false} className="shadow-sm">
            <Tabs
              defaultActiveKey="academic"
              items={tabItems}
              onChange={(key) => setActiveTab(key)}
              tabBarExtraContent={addButton}
            />
          </Card>
        </div>

        {/* Modal ไม่มีการเปลี่ยนแปลงมากนัก */}
        <Modal title={modalMode === 'create' ? "บันทึกภาระงาน" : "แก้ไขภาระงาน"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading} destroyOnClose>
          <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleFormValuesChange} initialValues={{ work_date: dayjs() }}>
            <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true }]}>
              <Select>{categories.map(cat => <Option key={cat.key} value={cat.key}>{cat.label}</Option>)}</Select>
            </Form.Item>
            {/* {isAcademic && (
              <Form.Item label="งานที่ได้รับมอบหมาย (ถ้ามี)" name="assignment_id">
                <Select placeholder="เลือกงาน หรือเว้นว่างสำหรับงานวิชาการอื่นๆ" allowClear>
                  {academicAssignments.map(a => <Option key={a.id} value={a.id}>{`[${a.subject.subject_code}] ${a.assignment_name}`}</Option>)}
                </Select>
              </Form.Item>
            )} */}
            <Form.Item label="ชื่อกิจกรรม/ภาระงาน" name="activity_name" rules={[{ required: true }]}>
              <Input disabled={isAcademic && !!form.getFieldValue('assignment_id')} placeholder={isAcademic && !!form.getFieldValue('assignment_id') ? "จะถูกเติมอัตโนมัติ" : "กรอกชื่อกิจกรรม/งาน"} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}><Form.Item label="วันที่ทำ" name="work_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item label="ชั่วโมงที่ใช้" name="hours_spent" rules={[{ required: true }]}><InputNumber min={0.5} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item label="รายละเอียด" name="description"><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}