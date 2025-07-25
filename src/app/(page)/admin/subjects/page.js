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
  updateSubjectTeachers
} from "@/services/subjects";
import { getInstructors } from "@/services/students"; // **เปลี่ยนมาใช้ฟังก์ชันใหม่**
import {
  Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, Transfer, Spin, Tag,
} from "antd";
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined, SearchOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminSubjectsPage() {
  const { role, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]); // **เปลี่ยนชื่อ State**
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [subjectsRes, instructorsRes] = await Promise.all([getAllSubjects(), getInstructors()]);
    if (subjectsRes.success) setSubjects(subjectsRes.data);
    if (instructorsRes.success) setInstructors(instructorsRes.data);
    setLoading(false);
  };

  useEffect(() => { if (!authLoading && role === 'admin') { fetchData(); } }, [authLoading, role]);

  const handleSubjectSubmit = async (values) => {
    setFormLoading(true);
    const { teacher_ids, ...subjectData } = values; // แยก teacher_ids ออกมา

    let subjectResult;
    if (modalMode === 'create') {
      subjectResult = await createSubject(subjectData);
    } else {
      subjectResult = await updateSubject(selectedSubject.id, subjectData);
    }

    if (subjectResult.success && subjectResult.data?.[0]?.id) {
      const subjectId = subjectResult.data[0].id;
      // เรียก service ใหม่เพื่ออัปเดตผู้สอน
      const teacherResult = await updateSubjectTeachers(subjectId, teacher_ids || []);

      if (teacherResult.success) {
        message.success(`บันทึกข้อมูลสำเร็จ`);
        fetchData();
        setIsSubjectModalOpen(false);
      } else {
        message.error("บันทึกวิชาสำเร็จ แต่เกิดข้อผิดพลาดในการกำหนดผู้สอน: " + teacherResult.error);
      }
    } else {
      message.error("เกิดข้อผิดพลาดในการบันทึกรายวิชา: " + (subjectResult.error || "Unknown error"));
    }
    setFormLoading(false);
  };

  const handleDeleteSubject = async (subjectId) => {
    const result = await deleteSubject(subjectId);
    if (result.success) {
      message.success("ลบรายวิชาสำเร็จ");
      fetchData();
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };


  const handleEnrollmentSubmit = async () => {
    setEnrollmentLoading(true);
    const res = await enrollStudents(selectedSubject.id, targetKeys);
    if (res.success) {
      message.success("บันทึกการลงทะเบียนสำเร็จ");
      fetchData();
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
      form.setFieldsValue({
        ...subject,
        teacher_ids: subject.teachers.map(t => t.id) // ดึง id ของ teachers มา
      });
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
    if (studentsRes.success) {
      setAllStudents(studentsRes.data.map(s => ({ key: s.id, title: `${s.user.full_name} (${s.student_id})` })));
    }
    if (enrolledRes.success) setTargetKeys(enrolledRes.data);
    setEnrollmentLoading(false);
  };

  const handleFormValuesChange = (_, allValues) => {
    const { theory_credits = 0, lab_credits = 0 } = allValues;
    // ปรับสูตรคำนวณหน่วยกิตให้ถูกต้อง (สมมติว่า ปฏิบัติหาร 2)
    form.setFieldsValue({ total_credits: Number(theory_credits) + (Number(lab_credits) / 2) });
  };
  const columns = [
    { title: 'รหัสวิชา', dataIndex: 'subject_code' },
    { title: 'ชื่อวิชา', dataIndex: 'subject_name', width: '25%' },
    {
      title: 'ผู้สอน',
      dataIndex: 'teachers',
      render: (teachers) => (
        <Space direction="vertical" size="small">
          {teachers?.map(t => <Tag key={t.id}>{t.full_name}</Tag>)}
        </Space>
      )
    },
    { title: 'ปี/ภาค', render: (_, r) => `${r.academic_year}/${r.semester}` },
    { title: 'หน่วยกิต', render: (_, r) => `${r.total_credits}(${r.theory_credits}-${r.lab_credits}-${r.self_study_credits})` },
    { title: 'นศ. ลงทะเบียน', dataIndex: 'enrollment_count', render: (count) => `${count} คน` },
    {
      title: 'การดำเนินการ', render: (_, record) => (
        <Space>
          <Tooltip title="จัดการ นศ. ลงทะเบียน"><Button icon={<UsergroupAddOutlined />} onClick={() => openEnrollModal(record)} /></Tooltip>
          <Tooltip title="แก้ไข"><Button icon={<EditOutlined />} onClick={() => openSubjectModal('edit', record)} /></Tooltip>
          <Popconfirm title="ลบรายวิชานี้?" onConfirm={() => handleDeleteSubject(record.id)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

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
            {/* ... Form Items เดิมสำหรับข้อมูลวิชา ... */}
            <Row gutter={16}>
              <Col span={12}><Form.Item label="ปีการศึกษา" name="academic_year" rules={[{ required: true }]}><InputNumber placeholder="เช่น 2567" style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item label="ภาคการศึกษา" name="semester" rules={[{ required: true }]}><Select><Option value={1}>1</Option><Option value={2}>2</Option><Option value={3}>3 (ฤดูร้อน)</Option></Select></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="รหัสวิชา" name="subject_code" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item label="ชื่อวิชา" name="subject_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>

            {/* --- Dropdown ที่แก้ไขแล้ว --- */}
            <Form.Item label="อาจารย์ผู้สอน" name="teacher_ids">
              <Select
                mode="multiple"
                placeholder="เลือกอาจารย์ผู้สอน..."
                allowClear
                options={instructors.map(i => ({
                  value: i.id,
                  label: `${i.full_name} (${i.role === 'teacher' ? 'อ.' : 'ผบ.'})`
                }))}
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item label="จำนวนสัปดาห์" name="weeks"><InputNumber style={{ width: '100%' }} /></Form.Item>
            <Row gutter={16}>
              <Col span={8}><Form.Item label="ทฤษฎี (ท)" name="theory_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="ปฏิบัติ (ป)" name="lab_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item label="ศึกษาเอง (ศ)" name="self_study_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item label="หน่วยกิตรวม (คำนวณอัตโนมัติ)"><Form.Item name="total_credits" noStyle><InputNumber disabled style={{ width: '100%' }} /></Form.Item></Form.Item>
          </Form>
        </Modal>

        <Modal title={`จัดการนักศึกษาลงทะเบียน: ${selectedSubject?.subject_name}`} open={isEnrollModalOpen} onOk={handleEnrollmentSubmit} onCancel={() => setIsEnrollModalOpen(false)} width={700} confirmLoading={enrollmentLoading}>
          <Transfer dataSource={allStudents} showSearch targetKeys={targetKeys} onChange={(keys) => setTargetKeys(keys)} render={item => item.title} listStyle={{ width: 300, height: 400 }} disabled={enrollmentLoading} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}