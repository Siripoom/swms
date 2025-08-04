"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllUsers, createUser, updateUser, deleteUser, getUserRoles, getDepartments
} from "@/services/users";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Tag, Avatar, Popconfirm, message, Spin, Tooltip, Grid, Empty, Upload, List, Alert
} from "antd";
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, MailOutlined, LockOutlined, TeamOutlined, ImportOutlined, InboxOutlined
} from "@ant-design/icons";
import Papa from 'papaparse';
import { supabase } from "@/config/supabase"; // Import supabase client

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Dragger } = Upload;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  // States for Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

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
    const matchesRole = !selectedRoleFilter || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    if (user) { form.setFieldsValue({ ...user, department: user.department ? [user.department] : [] }); } else { form.resetFields(); }
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

  const handleImportCSV = (file) => {
    setImporting(true);
    setImportResults(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const usersToCreate = results.data;
        if (!usersToCreate || usersToCreate.length === 0) {
          message.error("ไม่พบข้อมูลผู้ใช้ในไฟล์ CSV");
          setImporting(false);
          return;
        }
        const { data: response, error } = await supabase.functions.invoke('bulk-create-users', {
          body: usersToCreate,
        });
        if (error) {
          message.error("เกิดข้อผิดพลาดร้ายแรง: " + error.message);
          setImportResults({ error: error.message });
        } else {
          message.success(`นำเข้าข้อมูลเสร็จสิ้น: สำเร็จ ${response.success.length}, ล้มเหลว ${response.failed.length}`);
          setImportResults(response);
          await fetchUsers();
        }
        setImporting(false);
      },
      error: (error) => {
        message.error("ไม่สามารถอ่านไฟล์ CSV ได้: " + error.message);
        setImporting(false);
      }
    });
    return false; // Prevent antd default upload action
  };

  const getRoleLabel = (role) => roles.find((r) => r.value === role)?.label || role;
  const getDepartmentLabel = (department) => {
    const deptObj = allDepartments.find((d) => d.value === department);
    return deptObj ? deptObj.label : department;
  };
  const getRoleColor = (role) => ({ admin: "red", department_head: "purple", teacher: "blue", student: "green" }[role] || "default");

  const columns = [
    { title: "ผู้ใช้", key: "user_info", render: (_, record) => (<Space><Avatar icon={<UserOutlined />} src={record.avatar_url} /><div><Text strong>{record.full_name}</Text><Text type="secondary" className="block text-xs">{record.username}</Text></div></Space>) },
    { title: "อีเมล", dataIndex: "email", key: "email", responsive: ['lg'] },
    { title: "บทบาท", dataIndex: "role", key: "role", responsive: ['sm'], render: (role) => <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag> },
    { title: "แผนก", dataIndex: "department", key: "department", responsive: ['md'], render: (dept) => dept ? getDepartmentLabel(dept) : "-" },
    { title: "การดำเนินการ", key: "actions", align: 'center', width: 120, render: (_, record) => (<Space><Tooltip title="ดูข้อมูล"><Button shape="circle" icon={<EyeOutlined />} onClick={() => openModal("view", record)} /></Tooltip><Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => openModal("edit", record)} /></Tooltip><Tooltip title="ลบ"><Popconfirm title={`แน่ใจหรือไม่ที่จะลบ ${record.full_name}?`} onConfirm={() => handleDelete(record)} okText="ยืนยัน" cancelText="ยกเลิก"><Button danger shape="circle" icon={<DeleteOutlined />} /></Popconfirm></Tooltip></Space>) },
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
            <Space>
              <Button icon={<ImportOutlined />} onClick={() => { setIsImportModalOpen(true); setImportResults(null); }} size="large">{screens.sm ? 'Import CSV' : ''}</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("create")} size="large">{screens.sm ? 'เพิ่มผู้ใช้ใหม่' : ''}</Button>
            </Space>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}><Input placeholder="ค้นหาชื่อ, username หรือ email..." prefix={<SearchOutlined />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} allowClear size="large" /></Col>
            <Col xs={24} md={8}><Select placeholder="กรองตามบทบาท" value={selectedRoleFilter} onChange={setSelectedRoleFilter} allowClear style={{ width: "100%" }} size="large">{roles.map((role) => <Option key={role.value} value={role.value}>{role.label}</Option>)}</Select></Col>
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
        <Spin spinning={loading}><Form form={form} layout="vertical" onFinish={handleSubmit} disabled={modalMode === "view"} className="mt-6">
          <Row gutter={24}><Col xs={24} md={12}><Form.Item label="ชื่อผู้ใช้ (Username)" name="username" rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้" }, { min: 3, message: "ต้องมีอย่างน้อย 3 ตัวอักษร" }]}><Input prefix={<UserOutlined />} placeholder="กรอกชื่อผู้ใช้" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="ชื่อ-นามสกุล" name="full_name" rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}><Input placeholder="กรอกชื่อ-นามสกุล" /></Form.Item></Col></Row>
          <Form.Item label="อีเมล" name="email" rules={[{ required: true, message: "กรุณากรอกอีเมล" }, { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}><Input prefix={<MailOutlined />} placeholder="กรอกอีเมล" /></Form.Item>
          {modalMode === "create" && (<Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }, { min: 6, message: "ต้องมีอย่างน้อย 6 ตัวอักษร" }]}><Input.Password prefix={<LockOutlined />} placeholder="กรอกรหัสผ่าน" /></Form.Item>)}
          <Row gutter={24}><Col xs={24} md={12}><Form.Item label="บทบาท" name="role" rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}><Select placeholder="เลือกบทบาท">{roles.map((role) => <Option key={role.value} value={role.value}>{role.label}</Option>)}</Select></Form.Item></Col><Col xs={24} md={12}><Form.Item label="แผนก/สาขา" name="department"><Select mode="tags" placeholder="เลือกหรือพิมพ์แผนก..." allowClear options={allDepartments} tokenSeparators={[',']} maxCount={1} /></Form.Item></Col></Row>
        </Form></Spin>
      </Modal>
      <Modal
        title="นำเข้าผู้ใช้จากไฟล์ CSV"
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsImportModalOpen(false)}>ปิด</Button>]}
        destroyOnClose
      >
        <Alert
          message="รูปแบบไฟล์ CSV ที่ถูกต้อง"
          description="ไฟล์ CSV ต้องมี Header ดังนี้: username, email, password, full_name, role, department (optional)"
          type="info"
          showIcon
          className="mb-4"
        />
        <Dragger
          name="file"
          multiple={false}
          accept=".csv"
          beforeUpload={handleImportCSV}
          showUploadList={false}
          disabled={importing}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">คลิกหรือลากไฟล์ CSV มาวางที่นี่</p>
          <p className="ant-upload-hint">รองรับการอัปโหลดครั้งละ 1 ไฟล์</p>
        </Dragger>
        {importing && <div className="text-center mt-4"><Spin tip="กำลังนำเข้าข้อมูล..." /></div>}
        {importResults && (
          <div className="mt-4 max-h-60 overflow-y-auto">
            <Title level={5}>ผลการนำเข้า:</Title>
            {importResults.success?.length > 0 && (
              <List
                header={<div><strong>สำเร็จ ({importResults.success.length})</strong></div>}
                dataSource={importResults.success}
                renderItem={(item) => <List.Item>{item.email}: <Tag color="success">สร้างสำเร็จ</Tag></List.Item>}
                size="small"
                bordered
              />
            )}
            {importResults.failed?.length > 0 && (
              <List
                header={<div className="mt-2"><strong>ล้มเหลว ({importResults.failed.length})</strong></div>}
                dataSource={importResults.failed}
                renderItem={(item) => <List.Item>{item.email}: <Text type="danger">{item.error}</Text></List.Item>}
                size="small"
                bordered
                className="mt-2"
              />
            )}
            {importResults.error && (
              <Alert message={importResults.error} type="error" showIcon className="mt-2" />
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}