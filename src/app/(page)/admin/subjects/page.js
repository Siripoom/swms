"use client";

import { useState, useEffect, useCallback } from "react"; // 1. เพิ่ม useCallback
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getAllSubjects, createSubject, updateSubject, deleteSubject,
  getStudentsForEnrollment, getEnrolledStudents, enrollStudents, updateSubjectTeachers
} from "@/services/subjects";
import { getInstructors } from "@/services/students";
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Row, Col, Popconfirm, message, Tooltip, InputNumber, Transfer, Spin, Tag, Grid, Empty
} from "antd";
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined, SearchOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Component ย่อยสำหรับตาราง (ไม่มีการเปลี่ยนแปลง)
const TemplateTable = ({ templates, onEdit, onDelete, loading }) => {
  // ... (This component seems to be a leftover from a previous file, it's not used here, but keeping it doesn't cause harm)
};

export default function AdminSubjectsPage() {
  const { role, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
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
  const screens = useBreakpoint();

  // --- โค้ดที่แก้ไข ---
  // 2. ย้าย fetchData ออกมาและหุ้มด้วย useCallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subjectsRes, instructorsRes] = await Promise.all([getAllSubjects(), getInstructors()]);
    if (subjectsRes.success) setSubjects(subjectsRes.data);
    if (instructorsRes.success) setInstructors(instructorsRes.data);
    setLoading(false);
  }, []); // Dependency ว่าง เพราะไม่ได้อิงกับ state/props ใดๆ

  // 3. useEffect จะเรียกใช้ fetchData ที่เสถียรแล้ว
  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchData();
    }
  }, [authLoading, role, fetchData]); // ใส่ fetchData ใน dependency array
  // --- สิ้นสุดโค้ดที่แก้ไข ---

  const handleSubjectSubmit = async (values) => {
    setFormLoading(true);
    const { teacher_ids, ...subjectData } = values;
    let subjectResult = modalMode === 'create' ? await createSubject(subjectData) : await updateSubject(selectedSubject.id, subjectData);
    if (subjectResult.success && subjectResult.data?.[0]?.id) {
      const subjectId = subjectResult.data[0].id;
      const teacherResult = await updateSubjectTeachers(subjectId, teacher_ids || []);
      if (teacherResult.success) {
        message.success(`บันทึกข้อมูลสำเร็จ`);
        await fetchData(); // <--- ตอนนี้สามารถเรียกได้แล้ว
        setIsSubjectModalOpen(false);
      } else {
        message.warn("บันทึกวิชาสำเร็จ แต่เกิดข้อผิดพลาดในการกำหนดผู้สอน: " + teacherResult.error);
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
      await fetchData(); // <--- ตอนนี้สามารถเรียกได้แล้ว
    } else {
      message.error("เกิดข้อผิดพลาดในการลบ: " + result.error);
    }
  };

  const handleEnrollmentSubmit = async () => {
    setEnrollmentLoading(true);
    const res = await enrollStudents(selectedSubject.id, targetKeys);
    if (res.success) {
      message.success("บันทึกการลงทะเบียนสำเร็จ");
      await fetchData(); // <--- เรียก fetchData เพื่ออัปเดตจำนวน นศ.
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
      form.setFieldsValue({ ...subject, teacher_ids: subject.teachers.map(t => t.id) });
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
    if (studentsRes.success) setAllStudents(studentsRes.data.map(s => ({ key: s.id, title: `${s.user.full_name} (${s.student_id})` })));
    if (enrolledRes.success) setTargetKeys(enrolledRes.data);
    setEnrollmentLoading(false);
  };

  const handleFormValuesChange = (_, allValues) => {
    const { theory_credits = 0, lab_credits = 0 } = allValues;
    form.setFieldsValue({ total_credits: Number(theory_credits) + (Number(lab_credits) / 2) });
  };

  const columns = [
    { title: 'รหัสวิชา', dataIndex: 'subject_code', key: 'code', render: (text) => <Tag color="blue">{text}</Tag> },
    { title: 'ชื่อวิชา', dataIndex: 'subject_name', key: 'name' },
    { title: 'ผู้สอน', dataIndex: 'teachers', key: 'teachers', responsive: ['md'], render: (teachers) => <Space direction="vertical" size={2}>{teachers?.map(t => <Text key={t.id} style={{ fontSize: 12 }}>{t.full_name}</Text>)}</Space> },
    { title: 'ปี/ภาค', key: 'term', responsive: ['lg'], render: (_, r) => `${r.academic_year}/${r.semester}` },
    { title: 'หน่วยกิต', key: 'credits', responsive: ['lg'], render: (_, r) => `${r.total_credits} (${r.theory_credits}-${r.lab_credits}-${r.self_study_credits})` },
    { title: 'นศ.', dataIndex: 'enrollment_count', key: 'enrollments', responsive: ['sm'], render: (count) => `${count}` },
    {
      title: 'ดำเนินการ', key: 'actions', align: 'center', width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="จัดการ นศ."><Button shape="circle" icon={<UsergroupAddOutlined />} onClick={() => openEnrollModal(record)} /></Tooltip>
          <Tooltip title="แก้ไข"><Button shape="circle" icon={<EditOutlined />} onClick={() => openSubjectModal('edit', record)} /></Tooltip>
          <Tooltip title="ลบ"><Popconfirm title="แน่ใจหรือไม่ที่จะลบรายวิชานี้?" onConfirm={() => handleDeleteSubject(record.id)} okText="ยืนยัน" cancelText="ยกเลิก"><Button danger shape="circle" icon={<DeleteOutlined />} /></Popconfirm></Tooltip>
        </Space>
      ),
    },
  ];

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  const filteredSubjects = subjects.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="จัดการรายวิชา">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <Title level={2} className="!mb-1 flex items-center gap-3"><BookOutlined />จัดการรายวิชา</Title>
              <Text type="secondary">เพิ่ม แก้ไข ลบ และจัดการข้อมูลรายวิชาทั้งหมดในระบบ</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openSubjectModal('create')} size="large">
              {screens.sm ? 'เพิ่มรายวิชาใหม่' : ''}
            </Button>
          </div>
          <Input placeholder="ค้นหารหัสวิชา หรือ ชื่อวิชา..." prefix={<SearchOutlined />} onChange={e => setSearchTerm(e.target.value)} size="large" allowClear />
          <div className="shadow-md rounded-lg overflow-hidden border border-gray-200">
            <Table columns={columns} dataSource={filteredSubjects} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 'max-content' }} locale={{ emptyText: <Empty description="ไม่พบข้อมูลรายวิชา" /> }} />
          </div>
        </div>
      </div>
      <Modal
        title={<div className="flex items-center"> {modalMode === 'create' ? <PlusOutlined /> : <EditOutlined />} <span className="ml-2">{modalMode === 'create' ? "เพิ่มรายวิชาใหม่" : "แก้ไขรายวิชา"}</span></div>}
        open={isSubjectModalOpen}
        onCancel={() => setIsSubjectModalOpen(false)}
        footer={[<Button key="back" onClick={() => setIsSubjectModalOpen(false)}>ยกเลิก</Button>, <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>บันทึก</Button>]}
        width={screens.lg ? 800 : 'auto'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubjectSubmit} onValuesChange={handleFormValuesChange} className="mt-6">
          <Row gutter={24}>
            <Col xs={24} sm={12}><Form.Item label="ปีการศึกษา (พ.ศ.)" name="academic_year" rules={[{ required: true }]}><InputNumber placeholder="เช่น 2567" style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label="ภาคการศึกษา" name="semester" rules={[{ required: true }]}><Select placeholder="เลือกภาคเรียน"><Option value={1}>1</Option><Option value={2}>2</Option><Option value={3}>3 (ฤดูร้อน)</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={12}><Form.Item label="รหัสวิชา" name="subject_code" rules={[{ required: true }]}><Input placeholder="เช่น CS101" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item label="ชื่อวิชา" name="subject_name" rules={[{ required: true }]}><Input placeholder="เช่น Introduction to Computer Science" /></Form.Item></Col>
          </Row>
          <Form.Item label="อาจารย์ผู้สอน" name="teacher_ids">
            <Select mode="multiple" placeholder="เลือกอาจารย์ผู้สอน..." allowClear options={instructors.map(i => ({ value: i.id, label: i.full_name }))} optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="จำนวนสัปดาห์ที่ใช้สอน" name="weeks" initialValue={16}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Row gutter={24}>
            <Col xs={24} sm={8}><Form.Item label="ทฤษฎี (ท)" name="theory_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item label="ปฏิบัติ (ป)" name="lab_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item label="ศึกษาเอง (ศ)" name="self_study_credits"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="หน่วยกิตรวม (คำนวณอัตโนมัติ)"><Form.Item name="total_credits" noStyle><InputNumber disabled style={{ width: '100%' }} /></Form.Item></Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`จัดการนักศึกษาลงทะเบียน: ${selectedSubject?.subject_code}`}
        open={isEnrollModalOpen}
        onOk={handleEnrollmentSubmit}
        onCancel={() => setIsEnrollModalOpen(false)}
        width={screens.lg ? 750 : 'auto'}
        confirmLoading={enrollmentLoading}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnClose
      >
        <Spin spinning={enrollmentLoading}>
          <Transfer dataSource={allStudents} showSearch targetKeys={targetKeys} onChange={(keys) => setTargetKeys(keys)} render={item => item.title} listStyle={{ width: '100%', height: 400 }} className="mt-6" />
        </Spin>
      </Modal>
    </DashboardLayout>
  );
}