"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllStudents,
  getTeachers,
  getUnlinkedStudentUsers,
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentAdvisors
} from "@/services/students";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Tag, Avatar, Popconfirm, message, Tooltip, InputNumber, Grid, Empty, Spin
} from "antd";
import {
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SolutionOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = useMemo(() => students.filter((student) => {
    const studentName = student.user?.full_name || "";
    const studentId = student.student_id || "";
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }), [students, searchTerm]);

  const openModal = (mode, student = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedStudent(student);
    if (mode === 'edit' && student) {
      form.setFieldsValue({
        ...student,
        advisor_ids: student.advisor_list?.map(a => a.id) || []
      });
    }
    if (mode === 'create') {
      // Re-fetch unlinked users every time to get the latest list
      getUnlinkedStudentUsers().then(res => { if (res.success) setUnlinkedUsers(res.data); });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    const { advisor_ids, ...studentData } = values;

    try {
      let studentResult;
      if (modalMode === 'create') {
        studentResult = await createStudent(studentData);
      } else {
        const { user_id, ...updateData } = studentData;
        studentResult = await updateStudent(selectedStudent.id, updateData);
      }

      if (studentResult.success && studentResult.data?.[0]?.id) {
        const studentId = studentResult.data[0].id;
        const advisorResult = await updateStudentAdvisors(studentId, advisor_ids || []);

        if (advisorResult.success) {
          message.success("บันทึกข้อมูลสำเร็จ");
          await fetchData();
          closeModal();
        } else {
          message.warn("บันทึกข้อมูลนักศึกษาสำเร็จ แต่เกิดข้อผิดพลาดในการกำหนดอาจารย์ที่ปรึกษา");
        }
      } else {
        message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลนักศึกษา: " + (studentResult.error || "Unknown Error"));
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
        await fetchData();
      } else {
        message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const columns = [
    { title: "รหัสนักศึกษา", dataIndex: "student_id", key: "student_id", sorter: (a, b) => a.student_id.localeCompare(b.student_id), render: (text) => <Tag color="cyan">{text}</Tag> },
    { title: "ชื่อ-นามสกุล", key: "full_name", render: (_, record) => (<Space><Avatar src={record.user?.profile_image_url} icon={<UserOutlined />} /><Text>{record.user?.full_name || 'N/A'}</Text></Space>) },
    { title: "ชั้นปี", dataIndex: "year_level", key: "year_level", responsive: ['sm'], render: (year) => <Tag color="blue">ปี {year}</Tag> },
    {
      title: "อาจารย์ที่ปรึกษา",
      dataIndex: "advisor_list",
      key: "advisors",
      responsive: ['md'],
      render: (advisors) => (
        <Space direction="vertical" size={2}>
          {advisors?.length > 0
            ? advisors.map(a => <Text key={a.id} style={{ fontSize: 12 }}>{a.full_name}</Text>)
            : <Text type="secondary" italic>ยังไม่มี</Text>
          }
        </Space>
      )
    },
    {
      title: "ดำเนินการ", key: "actions", align: 'center', width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => openModal('edit', record)} /></Tooltip>
          <Tooltip title="ลบ"><Popconfirm title="ลบข้อมูลนักศึกษา?" description={`คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ "${record.user?.full_name}"?`} onConfirm={() => handleDelete(record.id)} okText="ยืนยัน" cancelText="ยกเลิก"> <Button danger shape="circle" icon={<DeleteOutlined />} /> </Popconfirm></Tooltip>
        </Space>
      )
    },
  ];

  return (
    <DashboardLayout title="จัดการนักศึกษา">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3"><SolutionOutlined />จัดการนักศึกษา</Title>
              <Text type="secondary">เพิ่ม แก้ไข และจัดการข้อมูลนักศึกษาทั้งหมดในระบบ</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('create')} size="large">
              {screens.sm ? 'เพิ่มนักศึกษาใหม่' : ''}
            </Button>
          </div>

          <Input
            placeholder="ค้นหารหัสนักศึกษา หรือ ชื่อ-นามสกุล..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
            allowClear
          />

          <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
            <Table
              columns={columns}
              dataSource={filteredStudents}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty description="ไม่พบข้อมูลนักศึกษา" /> }}
            />
          </div>

        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center">
            {modalMode === 'create' ? <PlusOutlined /> : <EditOutlined />}
            <span className="ml-2">{modalMode === "create" ? "เพิ่มนักศึกษาใหม่" : "แก้ไขข้อมูลนักศึกษา"}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="back" onClick={closeModal}>ยกเลิก</Button>,
          <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>บันทึก</Button>
        ]}
        width={screens.lg ? 800 : 'auto'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
          <Spin spinning={formLoading && modalMode === 'create'}>
            {modalMode === 'create' ? (
              <Form.Item name="user_id" label="เลือกผู้ใช้ (นักศึกษา)" rules={[{ required: true, message: "กรุณาเลือกผู้ใช้" }]}>
                <Select
                  showSearch
                  placeholder="ค้นหาชื่อหรืออีเมลผู้ใช้..."
                  optionFilterProp="label"
                  options={unlinkedUsers.map(u => ({ value: u.id, label: `${u.full_name} (${u.email})` }))}
                  loading={unlinkedUsers.length === 0 && isModalOpen}
                />
              </Form.Item>
            ) : (
              <Form.Item label="ชื่อ-นามสกุล"><Input value={selectedStudent?.user?.full_name} disabled /></Form.Item>
            )}
          </Spin>

          <Form.Item name="student_id" label="รหัสนักศึกษา" rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา" }]}>
            <Input placeholder="เช่น 6612345678" />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item name="year_level" label="ชั้นปี" rules={[{ required: true }]}>
                <Select placeholder="เลือกชั้นปี">
                  {[1, 2, 3, 4].map(year => <Option key={year} value={year}>ปี {year}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="academic_year" label="ปีการศึกษาที่เข้า" rules={[{ required: true }]}>
                <InputNumber placeholder="เช่น 2566" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="advisor_ids" label="อาจารย์ที่ปรึกษา">
            <Select
              mode="multiple"
              showSearch
              placeholder="เลือกอาจารย์ที่ปรึกษา..."
              allowClear
              options={teachers.map(t => ({ value: t.id, label: t.full_name }))}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}