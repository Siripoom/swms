"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getStudentsForEnrollment,
  getEnrolledStudents,
  enrollStudents,
} from "@/services/subjects";
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, Transfer, Spin,
} from "antd";
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined, SearchOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;



export default function AdminSubjectsPage() {
  // --- Auth State ---
  const { role, loading: authLoading } = useAuth();
  console.log("Auth State in Subjects Page:", { role, authLoading });

  // --- Page Specific States ---
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // States for Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  // States for Enrollment Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    const res = await getAllSubjects();
    if (res.success) {
      setSubjects(res.data);
    } else {
      message.error("ไม่สามารถดึงข้อมูลรายวิชาได้: " + res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchSubjects();
    }
  }, [authLoading, role]);

  const handleSubjectSubmit = async (values) => {
    setFormLoading(true);
    const action = modalMode === 'create' ? createSubject(values) : updateSubject(selectedSubject.id, values);
    const result = await action;
    if (result.success) {
      message.success(`บันทึกข้อมูลรายวิชาสำเร็จ`);
      fetchSubjects();
      setIsSubjectModalOpen(false);
    } else {
      message.error("เกิดข้อผิดพลาด: " + result.error);
    }
    setFormLoading(false);
  };

  const handleDeleteSubject = async (subjectId) => {
    const result = await deleteSubject(subjectId);
    if (result.success) {
      message.success("ลบรายวิชาสำเร็จ");
      fetchSubjects();
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };

  const handleEnrollmentSubmit = async () => {
    setEnrollmentLoading(true);
    const res = await enrollStudents(selectedSubject.id, targetKeys);
    if (res.success) {
      message.success("บันทึกการลงทะเบียนสำเร็จ");
      fetchSubjects();
      setIsEnrollModalOpen(false);
    } else {
      message.error("เกิดข้อผิดพลาด: " + res.error);
    }
    setEnrollmentLoading(false);
  };

  const openSubjectModal = (mode, subject = null) => {
    form.resetFields();
    setModalMode(mode);
    setSelectedSubject(subject);
    if (mode === 'edit' && subject) {
      form.setFieldsValue(subject);
    } else {
      form.setFieldsValue({ weeks: 16, theory_credits: 0, lab_credits: 0, self_study_credits: 0, total_credits: 0 });
    }
    setIsSubjectModalOpen(true);
  };

  const openEnrollModal = async (subject) => {

    setSelectedSubject(subject);
    setEnrollmentLoading(true);
    setIsEnrollModalOpen(true);
    const [studentsRes, enrolledRes] = await Promise.all([getStudentsForEnrollment(), getEnrolledStudents(subject.id)]);
    console.log("All Students Response:", studentsRes);
    console.log("Enrolled Students Response:", enrolledRes);
    if (studentsRes.success) {
      setAllStudents(studentsRes.data.map(s => ({ key: s.id, title: `${s.user.full_name} (${s.student_id})` })));
    }
    if (enrolledRes.success) setTargetKeys(enrolledRes.data);
    setEnrollmentLoading(false);
  };

  const handleFormValuesChange = (_, allValues) => {
    const { theory_credits = 0, lab_credits = 0 } = allValues;
    form.setFieldsValue({ total_credits: Number(theory_credits) + Number(lab_credits) });
  };

  const columns = [
    { title: 'รหัสวิชา', dataIndex: 'subject_code', key: 'subject_code', sorter: (a, b) => a.subject_code.localeCompare(b.subject_code) },
    { title: 'ชื่อวิชา', dataIndex: 'subject_name', key: 'subject_name', width: '30%' },
    { title: 'ปี/ภาค', key: 'acad_year', render: (_, r) => `${r.academic_year}/${r.semester}` },
    { title: 'หน่วยกิต (ท-ป-ศ)', key: 'credits', render: (_, r) => `${r.total_credits}(${r.theory_credits}-${r.lab_credits}-${r.self_study_credits})` },
    { title: 'นศ. ลงทะเบียน', dataIndex: 'enrollment_count', key: 'enrollment_count', render: (count) => `${count} คน` },
    {
      title: 'การดำเนินการ', key: 'actions', render: (_, record) => (
        <Space>
          <Tooltip title="จัดการ นศ. ลงทะเบียน"><Button icon={<UsergroupAddOutlined />} onClick={() => openEnrollModal(record)} /></Tooltip>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => openSubjectModal('edit', record)} /></Tooltip>
          <Popconfirm title="ลบรายวิชานี้?" onConfirm={() => handleDeleteSubject(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  // --- Conditional Rendering ---
  if (authLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (role !== 'admin') {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Access Denied</h1>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้ บทบาทของคุณคือ: {role || 'Not logged in'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredSubjects = subjects.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="จัดการรายวิชา">
      <div style={{ padding: "24px" }}>
        <Card style={{ marginBottom: "24px" }}>
          <Row justify="space-between" align="middle">
            <Col><Title level={2} style={{ margin: 0 }}>จัดการรายวิชา</Title></Col>
            <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => openSubjectModal('create')} size="large">เพิ่มรายวิชาใหม่</Button></Col>
          </Row>
        </Card>

        <Card>
          <Input placeholder="ค้นหารหัสวิชา หรือ ชื่อวิชา..." prefix={<SearchOutlined />} onChange={e => setSearchTerm(e.target.value)} style={{ marginBottom: 16, maxWidth: 400 }} />
          <Table columns={columns} dataSource={filteredSubjects} rowKey="id" loading={loading} />
        </Card>

        <Modal title={modalMode === 'create' ? "เพิ่มรายวิชาใหม่" : "แก้ไขรายวิชา"} open={isSubjectModalOpen} onCancel={() => setIsSubjectModalOpen(false)} onOk={() => form.submit()} confirmLoading={formLoading}>
          <Form form={form} layout="vertical" onFinish={handleSubjectSubmit} onValuesChange={handleFormValuesChange}>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="ปีการศึกษา" name="academic_year" rules={[{ required: true }]}><InputNumber placeholder="เช่น 2567" style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="ภาคการศึกษา" name="semester" rules={[{ required: true }]}><Select><Option value={1}>1</Option><Option value={2}>2</Option><Option value={3}>3 (ฤดูร้อน)</Option></Select></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="รหัสวิชา" name="subject_code" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item label="ชื่อวิชา" name="subject_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Form.Item label="จำนวนสัปดาห์" name="weeks"><InputNumber style={{ width: '100%' }} /></Form.Item>
            <Row gutter={16}>
              <Col span={8}><Form.Item label="ทฤษฎี (ท)" name="theory_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="ปฏิบัติ (ป)" name="lab_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="ศึกษาเอง (ศ)" name="self_study_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item label="หน่วยกิตรวม (คำนวณอัตโนมัติจาก ท+ป)"><Form.Item name="total_credits" noStyle><InputNumber disabled style={{ width: '100%' }} /></Form.Item></Form.Item>
          </Form>
        </Modal>

        <Modal title={`จัดการนักศึกษาลงทะเบียน: ${selectedSubject?.subject_name}`} open={isEnrollModalOpen} onOk={handleEnrollmentSubmit} onCancel={() => setIsEnrollModalOpen(false)} width={700} confirmLoading={enrollmentLoading}>
          <Transfer dataSource={allStudents} showSearch targetKeys={targetKeys} onChange={(keys) => setTargetKeys(keys)} render={item => item.title} listStyle={{ width: 300, height: 400 }} disabled={enrollmentLoading} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}