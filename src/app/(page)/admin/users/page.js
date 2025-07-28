"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllUsers, createUser, updateUser, deleteUser, getUserRoles, getDepartments
} from "@/services/users";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Tag, Avatar, Popconfirm, message, Spin, Tooltip, Grid, Empty
} from "antd";
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, MailOutlined, LockOutlined, TeamOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- โค้ดที่แก้ไข (จุดที่ 1) ---
  // เปลี่ยนค่าเริ่มต้นจาก "" เป็น null
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(null);
  // --- สิ้นสุดโค้ดที่แก้ไข ---

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const roles = getUserRoles();
  const initialDepartments = getDepartments();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) { setUsers(result.data); } else { message.error("ดึงข้อมูลผู้ใช้ไม่สำเร็จ: " + result.error); }
    } catch (error) { message.error("เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const allDepartments = useMemo(() => {
    const departmentSet = new Set(initialDepartments.map(d => d.value));
    users.forEach(user => { if (user.department) { departmentSet.add(user.department); } });
    return Array.from(departmentSet).sort().map(dept => ({ label: dept, value: dept }));
  }, [users, initialDepartments]);

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower);

    // --- โค้ดที่แก้ไข (จุดที่ 2) ---
    // เปลี่ยนเงื่อนไขให้เช็คค่าที่เป็น falsy (null, undefined, "") แทนการเช็ค "" อย่างเดียว
    const matchesRole = !selectedRoleFilter || user.role === selectedRoleFilter;
    // --- สิ้นสุดโค้ดที่แก้ไข ---

    return matchesSearch && matchesRole;
  });

  // ... (ส่วน Logic อื่นๆ ไม่มีการเปลี่ยนแปลง) ...
  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    if (user) { form.setFieldsValue({ ...user, department: user.department ? [user.department] : [] }); } else { form.resetFields(); } // ปรับการตั้งค่า department สำหรับโหมด tags
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setSelectedUser(null); form.resetFields(); };
  const handleSubmit = async (values) => {
    setFormLoading(true);
    try {
      const finalValues = { ...values, department: Array.isArray(values.department) ? values.department[0] : values.department };
      const result = modalMode === "create" ? await createUser(finalValues) : await updateUser(selectedUser.id, finalValues);
      if (result.success) {
        message.success(modalMode === "create" ? "เพิ่มผู้ใช้สำเร็จ" : "แก้ไขข้อมูลสำเร็จ");
        await fetchUsers();
        closeModal();
      } else { message.error("เกิดข้อผิดพลาด: " + result.error); }
    } catch (error) { message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล"); }
    finally { setFormLoading(false); }
  };
  const handleDelete = async (user) => {
    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        message.success("ลบผู้ใช้สำเร็จ"); await fetchUsers();
      } else { message.error("เกิดข้อผิดพลาด: " + result.error); }
    } catch (error) { message.error("เกิดข้อผิดพลาดในการลบผู้ใช้"); }
  };
  const getRoleLabel = (role) => roles.find((r) => r.value === role)?.label || role;
  const getDepartmentLabel = (department) => {
    const deptObj = allDepartments.find((d) => d.value === department);
    return deptObj ? deptObj.label : department;
  };
  const getRoleColor = (role) => ({ admin: "red", department_head: "purple", teacher: "blue", student: "green" }[role] || "default");

  const columns = [
    {
      title: "ผู้ใช้", key: "user_info",
      render: (_, record) => (<Space><Avatar icon={<UserOutlined />} src={record.avatar_url} /><div><Text strong>{record.full_name}</Text><Text type="secondary" className="block text-xs">{record.username}</Text></div></Space>),
    },
    { title: "อีเมล", dataIndex: "email", key: "email", responsive: ['lg'] },
    { title: "บทบาท", dataIndex: "role", key: "role", responsive: ['sm'], render: (role) => <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag> },
    { title: "แผนก", dataIndex: "department", key: "department", responsive: ['md'], render: (dept) => dept ? getDepartmentLabel(dept) : "-" },
    {
      title: "การดำเนินการ", key: "actions", align: 'center', width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="ดูข้อมูล"><Button shape="circle" icon={<EyeOutlined />} onClick={() => openModal("view", record)} /></Tooltip>
          <Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => openModal("edit", record)} /></Tooltip>
          <Tooltip title="ลบ"><Popconfirm title={`แน่ใจหรือไม่ที่จะลบ ${record.full_name}?`} onConfirm={() => handleDelete(record)} okText="ยืนยัน" cancelText="ยกเลิก"><Button danger shape="circle" icon={<DeleteOutlined />} /></Popconfirm></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout title="จัดการผู้ใช้" requiredRole={["admin"]}>
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3"><TeamOutlined />จัดการผู้ใช้</Title>
              <Text type="secondary">เพิ่ม แก้ไข และจัดการผู้ใช้ทั้งหมดในระบบ</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("create")} size="large">{screens.sm ? 'เพิ่มผู้ใช้ใหม่' : ''}</Button>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}><Input placeholder="ค้นหาชื่อ, username หรือ email..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} allowClear size="large" /></Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="กรองตามบทบาท"
                value={selectedRoleFilter}
                onChange={setSelectedRoleFilter}
                allowClear
                style={{ width: "100%" }}
                size="large"
              >
                {roles.map((role) => <Option key={role.value} value={role.value}>{role.label}</Option>)}
              </Select>
            </Col>
          </Row>
          <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
            <Table columns={columns} dataSource={filteredUsers} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total}` }} scroll={{ x: 'max-content' }} locale={{ emptyText: <Empty description="ไม่พบข้อมูลผู้ใช้ที่ตรงตามเงื่อนไข" /> }} />
          </div>
        </div>
      </div>
      <Modal
        title={<div className="flex items-center"> {modalMode === 'create' ? <PlusOutlined /> : modalMode === 'edit' ? <EditOutlined /> : <EyeOutlined />} <span className="ml-2">{modalMode === 'create' ? "เพิ่มผู้ใช้ใหม่" : modalMode === 'edit' ? "แก้ไขข้อมูลผู้ใช้" : "ข้อมูลผู้ใช้"}</span></div>}
        open={isModalOpen}
        onCancel={closeModal}
        footer={modalMode === 'view' ? [<Button key="close" onClick={closeModal}>ปิด</Button>] : [<Button key="cancel" onClick={closeModal}>ยกเลิก</Button>, <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>บันทึก</Button>]}
        width={screens.md ? 600 : 'auto'}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={modalMode === "view"} className="mt-6">
            <Row gutter={24}>
              <Col xs={24} md={12}><Form.Item label="ชื่อผู้ใช้ (Username)" name="username" rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }, { min: 3, message: "ต้องมีอย่างน้อย 3 ตัวอักษร" }]}><Input prefix={<UserOutlined />} placeholder="กรอกชื่อผู้ใช้" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item label="ชื่อ-นามสกุล" name="full_name" rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}><Input placeholder="กรอกชื่อ-นามสกุล" /></Form.Item></Col>
            </Row>
            <Form.Item label="อีเมล" name="email" rules={[{ required: true, message: "กรุณากรอกอีเมล" }, { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}><Input prefix={<MailOutlined />} placeholder="กรอกอีเมล" /></Form.Item>
            {modalMode === "create" && (
              <Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }, { min: 6, message: "ต้องมีอย่างน้อย 6 ตัวอักษร" }]}><Input.Password prefix={<LockOutlined />} placeholder="กรอกรหัสผ่าน" /></Form.Item>
            )}
            <Row gutter={24}>
              <Col xs={24} md={12}><Form.Item label="บทบาท" name="role" rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}><Select placeholder="เลือกบทบาท">{roles.map((role) => <Option key={role.value} value={role.value}>{role.label}</Option>)}</Select></Form.Item></Col>
              <Col xs={24} md={12}>
                <Form.Item label="แผนก/สาขา" name="department">
                  <Select
                    mode="tags"
                    placeholder="เลือกหรือพิมพ์แผนก..."
                    allowClear
                    options={allDepartments}
                    tokenSeparators={[',']}
                    maxCount={1}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </DashboardLayout>
  );
}