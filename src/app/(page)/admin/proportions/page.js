"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getProportionsByYear, upsertProportions } from "@/services/proportions";
import {
  Form, InputNumber, Button, Card, Typography, Row, Col, Spin,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2'; // Import SweetAlert2

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const { Title, Text } = Typography;

export default function ProportionsPage() {
  const { role, loading: authLoading } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear() + 543));
  const [total, setTotal] = useState(100);
  const [isExistingData, setIsExistingData] = useState(false);

  const updateTotal = (values) => {
    const sum = (
      (Number(values.academic_percentage) || 0) +
      (Number(values.research_percentage) || 0) +
      (Number(values.academic_service_percentage) || 0) +
      (Number(values.student_affairs_percentage) || 0) +
      (Number(values.personal_percentage) || 0)
    );
    setTotal(sum);
  };

  const fetchData = useCallback(async (year) => {
    if (!year || String(year).length < 4) {
      // ถ้าปีไม่สมบูรณ์ ให้ใช้ค่า default และถือว่าเป็นข้อมูลใหม่
      const defaultValues = {
        academic_percentage: 40.0, research_percentage: 20.0,
        academic_service_percentage: 15.0, student_affairs_percentage: 15.0,
        personal_percentage: 10.0,
      };
      form.setFieldsValue(defaultValues);
      updateTotal(defaultValues);
      setIsExistingData(false);
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
      const defaultValues = {
        academic_percentage: 40.0, research_percentage: 20.0,
        academic_service_percentage: 15.0, student_affairs_percentage: 15.0,
        personal_percentage: 10.0,
      };
      form.setFieldsValue(defaultValues);
      updateTotal(defaultValues);
    }
    setLoading(false);
  }, [form]);

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
        title: 'ยืนยันการแก้ไข',
        text: `ข้อมูลสำหรับปี ${selectedYear} มีอยู่แล้ว คุณต้องการบันทึกทับใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, บันทึกทับ',
        cancelButtonText: 'ยกเลิก'
      }).then((result) => {
        if (result.isConfirmed) {
          performUpsert();
        }
      });
    } else {
      performUpsert();
    }
  };

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (role !== 'admin') return <DashboardLayout><div>Access Denied</div></DashboardLayout>;

  const chartSeries = Object.values(form.getFieldsValue([
    "academic_percentage", "research_percentage", "academic_service_percentage",
    "student_affairs_percentage", "personal_percentage",
  ])).map(v => Number(v) || 0);

  const chartOptions = {
    labels: ['วิชาการ', 'วิจัย', 'บริการวิชาการ', 'กิจการนักศึกษา', 'ส่วนตัว'],
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'รวม', formatter: () => `${total.toFixed(1)}%` } } } } }
  };

  return (
    <DashboardLayout title="กำหนดสัดส่วนภาระงาน">
      <div style={{ padding: '24px' }}>
        <Card style={{ marginBottom: 24 }}>
          <Title level={2}>กำหนดสัดส่วนภาระงาน</Title>
          <Text>ระบุปีการศึกษาและกำหนดสัดส่วนภาระงานที่คาดหวังสำหรับนักศึกษา</Text>
        </Card>

        <Card>
          <Row gutter={32}>
            <Col xs={24} md={12}>
              <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange}>
                <Form.Item label="ระบุปีการศึกษา (พ.ศ.)" help={isExistingData ? "พบข้อมูลสำหรับปีนี้" : "ยังไม่มีข้อมูลสำหรับปีนี้ จะเป็นการสร้างใหม่"}>
                  <InputNumber
                    placeholder="เช่น 2567"
                    value={selectedYear}
                    onChange={(value) => setSelectedYear(value ? String(value) : '')}
                    style={{ width: '100%' }}
                    controls={false}
                  />
                </Form.Item>

                {loading ? <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div> : <>
                  <Form.Item label="พันธกิจด้านวิชาการ (%)" name="academic_percentage"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="พันธกิจวิจัย/นวัตกรรม (%)" name="research_percentage"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="พันธกิจบริการวิชาการ (%)" name="academic_service_percentage"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="พันธกิจกิจการนักศึกษา (%)" name="student_affairs_percentage"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="การใช้ชีวิต/ส่วนตัว (%)" name="personal_percentage"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={formLoading} block>
                      {isExistingData ? 'บันทึกทับข้อมูล' : 'บันทึกข้อมูลใหม่'}
                    </Button>
                  </Form.Item>
                </>}
              </Form>
            </Col>
            <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Title level={4}>ผลรวมปัจจุบัน: <span style={{ color: Math.round(total) === 100 ? 'green' : 'red' }}>{total.toFixed(1)}%</span></Title>
              <div id="chart">
                <Chart options={chartOptions} series={chartSeries} type="donut" width={380} />
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </DashboardLayout>
  );
}