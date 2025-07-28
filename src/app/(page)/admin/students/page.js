"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllStudents,
  getTeachers,
  getUnlinkedStudentUsers,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/services/students"; // **ตรวจสอบ Path ให้ถูกต้อง**
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
  Tooltip,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  // ดึงข้อมูลทั้งหมด
  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, unlinkedUsersRes] = await Promise.all([
        getAllStudents(),
        getTeachers(),
        getUnlinkedStudentUsers(),
      ]);

      if (studentsRes.success) setStudents(studentsRes.data);
      else message.error("ไม่สามารถดึงข้อมูลนักศึกษาได้: " + studentsRes.error);

      if (teachersRes.success) setTeachers(teachersRes.data);
      else message.error("ไม่สามารถดึงข้อมูลอาจารย์ได้: " + teachersRes.error);

      if (unlinkedUsersRes.success) setUnlinkedUsers(unlinkedUsersRes.data);
      else message.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้: " + unlinkedUsersRes.error);

    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลหลัก");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter((student) => {
    const studentName = student.user?.full_name || "";
    const studentId = student.student_id || "";
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const openModal = (mode, student = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedStudent(student);

    if (mode === 'edit' && student) {
      form.setFieldsValue({
        student_id: student.student_id,
        year_level: student.year_level,
        academic_year: student.academic_year,
        advisor_id: student.advisor?.id,
        // user_id and full_name are for display only in edit mode
      });
    }

    // Fetch latest unlinked users when opening create modal
    if (mode === 'create') {
      getUnlinkedStudentUsers().then(res => {
        if (res.success) setUnlinkedUsers(res.data);
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    try {
      let result;
      if (modalMode === 'create') {
        result = await createStudent(values);
      } else {
        // Exclude user_id from update data as it should not be changed
        const { user_id, ...updateData } = values;
        result = await updateStudent(selectedStudent.id, updateData);
      }

      if (result.success) {
        message.success(modalMode === 'create' ? "เพิ่มนักศึกษาสำเร็จ" : "แก้ไขข้อมูลสำเร็จ");
        fetchData();
        closeModal();
      } else {
        message.error("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    try {
      const result = await deleteStudent(studentId);
      if (result.success) {
        message.success("ลบข้อมูลนักศึกษาสำเร็จ");
        fetchData();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const columns = [
    {
      title: "รหัสนักศึกษา",
      dataIndex: "student_id",
      key: "student_id",
      sorter: (a, b) => a.student_id.localeCompare(b.student_id),
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "full_name",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text>{record.user?.full_name || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: "ชั้นปี",
      dataIndex: "year_level",
      key: "year_level",
      filters: [
        { text: 'ปี 1', value: 1 },
        { text: 'ปี 2', value: 2 },
        { text: 'ปี 3', value: 3 },
        { text: 'ปี 4', value: 4 },
      ],
      onFilter: (value, record) => record.year_level === value,
      render: (year) => <Tag color="blue">ปี {year}</Tag>,
    },
    {
      title: "อาจารย์ที่ปรึกษา",
      key: "advisor",
      render: (_, record) => record.advisor?.full_name || <Text type="secondary">ยังไม่ระบุ</Text>,
    },
    {
      title: "การดำเนินการ",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข">
            <Button icon={<EditOutlined />} onClick={() => openModal('edit', record)} />
          </Tooltip>
          <Popconfirm
            title="ลบข้อมูลนักศึกษา?"
            description={`คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ "${record.user?.full_name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="ใช่"
            cancelText="ไม่"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout title="จัดการนักศึกษา" requiredRole={["admin"]}>
      <div style={{ padding: "24px" }}>
        <Card style={{ marginBottom: "24px" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <SolutionOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
                <div>
                  <Title level={2} style={{ margin: 0 }}>จัดการนักศึกษา</Title>
                  <Text type="secondary">เพิ่ม แก้ไข และจัดการข้อมูลนักศึกษาในระบบ</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">
                เพิ่มนักศึกษาใหม่
              </Button>
            </Col>
          </Row>
        </Card>

        <Card>
          <Input
            placeholder="ค้นหารหัสนักศึกษา หรือ ชื่อ-นามสกุล..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ marginBottom: 16, maxWidth: 400 }}
          />
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title={modalMode === "create" ? "เพิ่มนักศึกษาใหม่" : "แก้ไขข้อมูลนักศึกษา"}
          open={isModalOpen}
          onCancel={closeModal}
          onOk={() => form.submit()}
          confirmLoading={formLoading}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {modalMode === 'create' ? (
              <Form.Item
                name="user_id"
                label="เลือกผู้ใช้ (นักศึกษา)"
                rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}
              >
                <Select
                  showSearch
                  placeholder="ค้นหาชื่อผู้ใช้..."
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={unlinkedUsers.map(u => ({ value: u.id, label: u.full_name }))}
                />
              </Form.Item>
            ) : (
              <Form.Item label="ชื่อ-นามสกุล">
                <Input value={selectedStudent?.user?.full_name} disabled />
              </Form.Item>
            )}

            <Form.Item
              name="student_id"
              label="รหัสนักศึกษา"
              rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา" }]}
            >
              <Input placeholder="เช่น 6612345678" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="year_level"
                  label="ชั้นปี"
                  rules={[{ required: true, message: "กรุณาเลือกชั้นปี" }]}
                >
                  <Select placeholder="เลือกชั้นปี">
                    <Option value={1}>ปี 1</Option>
                    <Option value={2}>ปี 2</Option>
                    <Option value={3}>ปี 3</Option>
                    <Option value={4}>ปี 4</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="academic_year"
                  label="ปีการศึกษาที่เข้า"
                  rules={[{ required: true, message: "กรุณากรอกปีการศึกษา" }]}
                >
                  <InputNumber placeholder="เช่น 2566" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="advisor_id" label="อาจารย์ที่ปรึกษา">
              <Select
                showSearch
                placeholder="เลือกอาจารย์ที่ปรึกษา"
                optionFilterProp="children"
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}