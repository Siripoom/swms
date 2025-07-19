"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRoles,
  getDepartments,
} from "@/services/users";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Avatar,
  Popconfirm,
  message,
  Spin,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  MailOutlined,
  LockOutlined,
  TeamOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create, edit, view
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const roles = getUserRoles();
  const departments = getDepartments();

  // ดึงข้อมูลผู้ใช้
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูล: " + result.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // กรองข้อมูลผู้ใช้
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // เปิด Modal
  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);

    if (user) {
      form.setFieldsValue({
        username: user.username || "",
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "",
        department: user.department || "",
      });
    } else {
      form.resetFields();
    }

    setIsModalOpen(true);
  };

  // ปิด Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    form.resetFields();
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (values) => {
    setFormLoading(true);

    try {
      let result;
      if (modalMode === "create") {
        result = await createUser(values);
      } else if (modalMode === "edit") {
        result = await updateUser(selectedUser.id, values);
      }

      if (result.success) {
        message.success(
          modalMode === "create" ? "เพิ่มผู้ใช้สำเร็จ" : "แก้ไขข้อมูลสำเร็จ"
        );
        fetchUsers();
        closeModal();
      } else {
        message.error("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setFormLoading(false);
    }
  };

  // ลบผู้ใช้
  const handleDelete = async (user) => {
    try {
      // เรียก Service function ที่เราดีบักกัน
      const result = await deleteUser(user.id);

      if (result.success) {
        message.success("ลบผู้ใช้สำเร็จ");

        // ***** จุดที่ต้องเพิ่ม *****
        // หลังจากลบสำเร็จ ให้ดึงข้อมูลผู้ใช้ทั้งหมดมาใหม่
        // เพื่อให้ตารางใน UI อัปเดตและแสดงข้อมูลที่ถูกต้อง
        fetchUsers();

      } else {
        message.error("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
    }
  };

  // แสดงชื่อ role เป็นภาษาไทย
  const getRoleLabel = (role) => {
    const roleObj = roles.find((r) => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  // แสดงชื่อแผนก เป็นภาษาไทย
  const getDepartmentLabel = (department) => {
    const deptObj = departments.find((d) => d.value === department);
    return deptObj ? deptObj.label : department;
  };

  // สีของ Tag สำหรับแต่ละ role
  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "red";
      case "department_head":
        return "purple";
      case "teacher":
        return "blue";
      case "student":
        return "green";
      default:
        return "default";
    }
  };

  // คอลัมน์ของตาราง
  const columns = [
    {
      title: "ผู้ใช้",
      dataIndex: "user_info",
      key: "user_info",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.username} • {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "บทบาท",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
      ),
      filters: roles.map((role) => ({
        text: role.label,
        value: role.value,
      })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "แผนก",
      dataIndex: "department",
      key: "department",
      render: (department) =>
        department ? getDepartmentLabel(department) : "-",
    },
    {
      title: "สร้างเมื่อ",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString("th-TH"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="ดูข้อมูล">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openModal("view", record)}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal("edit", record)}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm
              title="ลบผู้ใช้"
              description={`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${record.full_name}" (${record.username})?`}
              onConfirm={() => handleDelete(record)}
              okText="ใช่"
              cancelText="ไม่"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout title="จัดการผู้ใช้" requiredRole={["admin"]}>
      <div style={{ padding: "24px" }}>
        {/* Header Section */}
        <Card style={{ marginBottom: "24px" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <TeamOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    จัดการผู้ใช้
                  </Title>
                  <Text type="secondary">
                    เพิ่ม แก้ไข และจัดการผู้ใช้ในระบบ
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal("create")}
                size="large"
              >
                เพิ่มผู้ใช้ใหม่
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card style={{ marginBottom: "24px" }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Input
                placeholder="ค้นหาชื่อ, username หรือ email..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                placeholder="เลือกบทบาท"
                value={selectedRole}
                onChange={setSelectedRole}
                allowClear
                style={{ width: "100%" }}
              >
                {roles.map((role) => (
                  <Option key={role.value} value={role.value}>
                    {role.label}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card>
          <div style={{ marginBottom: "16px" }}>
            <Title level={4} style={{ margin: 0 }}>
              รายการผู้ใช้ ({filteredUsers.length} คน)
            </Title>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} จาก ${total} รายการ`,
            }}
            locale={{
              emptyText: (
                <div style={{ textAlign: "center", padding: "48px" }}>
                  <TeamOutlined
                    style={{ fontSize: "48px", color: "#d9d9d9" }}
                  />
                  <div style={{ marginTop: "16px", color: "#999" }}>
                    ไม่มีข้อมูลผู้ใช้
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={
            modalMode === "create"
              ? "เพิ่มผู้ใช้ใหม่"
              : modalMode === "edit"
                ? "แก้ไขข้อมูลผู้ใช้"
                : "ข้อมูลผู้ใช้"
          }
          open={isModalOpen}
          onCancel={closeModal}
          footer={
            modalMode === "view"
              ? [
                <Button key="close" onClick={closeModal}>
                  ปิด
                </Button>,
              ]
              : [
                <Button key="cancel" onClick={closeModal}>
                  ยกเลิก
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={formLoading}
                  onClick={() => form.submit()}
                >
                  บันทึก
                </Button>,
              ]
          }
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={modalMode === "view"}
          >
            <Form.Item
              label="ชื่อผู้ใช้ (Username)"
              name="username"
              rules={[
                { required: true, message: "กรุณากรอกชื่อผู้ใช้" },
                { min: 3, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="กรอกชื่อผู้ใช้" />
            </Form.Item>

            <Form.Item
              label="ชื่อ-นามสกุล"
              name="full_name"
              rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
            >
              <Input placeholder="กรอกชื่อ-นามสกุล" />
            </Form.Item>

            <Form.Item
              label="อีเมล"
              name="email"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="กรอกอีเมล" />
            </Form.Item>

            {modalMode === "create" && (
              <Form.Item
                label="รหัสผ่าน"
                name="password"
                rules={[
                  { required: true, message: "กรุณากรอกรหัสผ่าน" },
                  { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="กรอกรหัสผ่าน"
                />
              </Form.Item>
            )}

            <Form.Item
              label="บทบาท"
              name="role"
              rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}
            >
              <Select placeholder="เลือกบทบาท">
                {roles.map((role) => (
                  <Option key={role.value} value={role.value}>
                    {role.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="แผนก/สาขา" name="department">
              <Select placeholder="เลือกแผนก" allowClear>
                {departments.map((dept) => (
                  <Option key={dept.value} value={dept.value}>
                    {dept.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
