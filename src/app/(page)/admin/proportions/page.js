"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getProportionsByYear, upsertProportions } from "@/services/proportions";
import { Form, InputNumber, Button, Card, Typography, Row, Col, Spin, Select, Alert, Grid, Tag } from "antd";
import { SaveOutlined, BookOutlined, ExperimentOutlined, TeamOutlined, UserOutlined, HeartOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Component ย่อยสำหรับ Form Item (ไม่มีการเปลี่ยนแปลง)
const ProportionInput = ({ name, label, icon }) => (
  <Form.Item name={name} className="!mb-4">
    <InputNumber min={0} max={100} step={0.5} addonBefore={<div className="w-8 text-center">{icon}</div>} addonAfter={<div className="w-8 text-center">%</div>} placeholder={label} style={{ width: '100%' }} />
  </Form.Item>
);

export default function ProportionsPage() {
  const { role, loading: authLoading } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear() + 543));
  const [total, setTotal] = useState(100);
  const [isExistingData, setIsExistingData] = useState(false);
  const screens = useBreakpoint();

  // --- โค้ดที่แก้ไข ---
  // 1. เพิ่ม State สำหรับเก็บค่าที่กำลังพิมพ์
  const [searchValue, setSearchValue] = useState('');
  // --- สิ้นสุดโค้ดที่แก้ไข ---


  // ส่วน Logic อื่นๆ ทั้งหมดไม่มีการเปลี่ยนแปลง
  const updateTotal = useCallback((values) => {
    const percentageKeys = ["academic_percentage", "research_percentage", "academic_service_percentage", "student_affairs_percentage", "personal_percentage"];
    const sum = percentageKeys.reduce((acc, key) => acc + (Number(values[key]) || 0), 0);
    setTotal(sum);
  }, []);

  const fetchData = useCallback(async (year) => {
    if (!year || String(year).trim().length < 4) {
      const defaultValues = { academic_percentage: 40.0, research_percentage: 20.0, academic_service_percentage: 15.0, student_affairs_percentage: 15.0, personal_percentage: 10.0 };
      form.setFieldsValue(defaultValues);
      updateTotal(defaultValues);
      setIsExistingData(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getProportionsByYear(year);
    if (res.success && res.data) {
      setIsExistingData(true);
      form.setFieldsValue(res.data);
      updateTotal(res.data);
    } else {
      setIsExistingData(false);
      const defaultValues = { academic_percentage: 40.0, research_percentage: 20.0, academic_service_percentage: 15.0, student_affairs_percentage: 15.0, personal_percentage: 10.0 };
      form.setFieldsValue(defaultValues);
      updateTotal(defaultValues);
    }
    setLoading(false);
  }, [form, updateTotal]);

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchData(selectedYear);
    }
  }, [selectedYear, role, authLoading, fetchData]);

  const handleValuesChange = (changedValues, allValues) => {
    updateTotal(allValues);
  };

  const handleSubmit = async (values) => {
    if (Math.round(total) !== 100) {
      Swal.fire({ icon: 'error', title: 'ข้อมูลไม่ถูกต้อง', text: 'ผลรวมของสัดส่วนทั้งหมดต้องเท่ากับ 100%!' });
      return;
    }
    const performUpsert = async () => {
      setFormLoading(true);
      const result = await upsertProportions({ ...values, academic_year: selectedYear });
      setFormLoading(false);
      if (result.success) {
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', timer: 1500, showConfirmButton: false });
        setIsExistingData(true);
      } else {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: result.error });
      }
    };
    if (isExistingData) {
      Swal.fire({
        title: 'ยืนยันการแก้ไข', text: `ข้อมูลสำหรับปี ${selectedYear} มีอยู่แล้ว คุณต้องการบันทึกทับใช่หรือไม่?`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, บันทึกทับ', cancelButtonText: 'ยกเลิก'
      }).then((result) => { if (result.isConfirmed) { performUpsert(); } });
    } else {
      performUpsert();
    }
  };

  // --- โค้ดที่แก้ไข ---
  // 2. สร้าง options แบบไดนามิกที่รวมค่าที่พิมพ์และค่าที่เลือกไว้เสมอ
  const dynamicYearOptions = useMemo(() => {
    const baseYears = [...Array(5)].map((_, i) => String(new Date().getFullYear() + 543 - i));
    const potentialNewYears = [selectedYear, searchValue].filter(Boolean);
    const yearSet = new Set([...baseYears, ...potentialNewYears]);
    return Array.from(yearSet)
      .filter(year => year && String(year).trim().length > 0)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({ label: year, value: year }));
  }, [selectedYear, searchValue]);

  // 3. สร้าง Handlers สำหรับ Select
  const handleYearSearch = (value) => {
    setSearchValue(value);
  };
  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSearchValue(''); // เคลียร์ค่าค้นหาเมื่อมีการเลือก
  };
  const handleYearBlur = () => {
    // ถ้ามีค่าที่พิมพ์ค้างอยู่ ให้ตั้งเป็นค่าที่เลือก
    if (searchValue && !dynamicYearOptions.some(opt => opt.value === searchValue)) {
      setSelectedYear(searchValue);
    }
  };
  // --- สิ้นสุดโค้ดที่แก้ไข ---

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  const chartSeries = Object.values(form.getFieldsValue(["academic_percentage", "research_percentage", "academic_service_percentage", "student_affairs_percentage", "personal_percentage"])).map(v => Number(v) || 0);
  const chartOptions = {
    labels: ['วิชาการ', 'วิจัย', 'บริการวิชาการ', 'กิจการนักศึกษา', 'ส่วนตัว'],
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'รวม', formatter: () => `${total.toFixed(1)}%` } } } } }
  };

  return (
    <DashboardLayout title="กำหนดสัดส่วนภาระงาน">
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-5 rounded-lg border border-gray-200">
            <Title level={2} className="!mb-1">กำหนดสัดส่วนภาระงาน</Title>
            <Text type="secondary">ระบุปีการศึกษาและกำหนดสัดส่วนภาระงานที่คาดหวังสำหรับนักศึกษาในแต่ละพันธกิจ</Text>
          </div>
          <Card bordered={false} className="shadow-lg">
            <Spin spinning={loading}>
              <Row gutter={[32, 32]} align="middle">
                <Col xs={24} md={12}>
                  <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange}>
                    <Form.Item label="เลือกหรือพิมพ์ปีการศึกษา (พ.ศ.)">
                      {/* --- โค้ดที่แก้ไข --- */}
                      <Select
                        showSearch
                        size="large"
                        value={selectedYear}
                        placeholder="เลือกหรือพิมพ์ปี..."
                        options={dynamicYearOptions}
                        onSearch={handleYearSearch}
                        onChange={handleYearChange}
                        onBlur={handleYearBlur}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={null}
                      />
                      {/* --- สิ้นสุดโค้ดที่แก้ไข --- */}
                    </Form.Item>
                    <Alert message={isExistingData ? "พบข้อมูลสำหรับปีการศึกษานี้" : "ยังไม่มีข้อมูล จะเป็นการสร้างใหม่"} type={isExistingData ? "info" : "warning"} showIcon className="mb-6" />
                    <Paragraph strong>พันธกิจ (รวมกันต้องได้ 100%)</Paragraph>
                    <ProportionInput name="academic_percentage" label="วิชาการ" icon={<BookOutlined />} />
                    <ProportionInput name="research_percentage" label="วิจัย" icon={<ExperimentOutlined />} />
                    <ProportionInput name="academic_service_percentage" label="บริการวิชาการ" icon={<TeamOutlined />} />
                    <ProportionInput name="student_affairs_percentage" label="กิจการนักศึกษา" icon={<UserOutlined />} />
                    <ProportionInput name="personal_percentage" label="ส่วนตัว" icon={<HeartOutlined />} />
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={formLoading} size="large" block>
                        {isExistingData ? 'บันทึกทับข้อมูล' : 'บันทึกข้อมูลใหม่'}
                      </Button>
                    </Form.Item>
                  </Form>
                </Col>
                <Col xs={24} md={12}>
                  <Card bordered={false} className="bg-gray-50 rounded-lg text-center">
                    <Title level={3} className="!mb-1">ผลรวมปัจจุบัน</Title>
                    <Title level={1} className="!mt-0" style={{ color: Math.round(total) === 100 ? '#4ade80' : '#f87171' }}>
                      {total.toFixed(1)}%
                    </Title>
                    {Math.round(total) === 100 ? (
                      <Tag icon={<CheckCircleOutlined />} color="success" className="text-base">ข้อมูลถูกต้อง</Tag>
                    ) : (
                      <Tag icon={<ExclamationCircleOutlined />} color="error" className="text-base">ผลรวมต้องเป็น 100</Tag>
                    )}
                    <div className="mt-6">
                      <Chart options={chartOptions} series={chartSeries} type="donut" width={screens.xs ? "100%" : 380} />
                    </div>
                  </Card>
                </Col>
              </Row>
            </Spin>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}