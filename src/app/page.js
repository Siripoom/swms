"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  message,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Login attempt:", values);
      message.success("เข้าสู่ระบบสำเร็จ!");

      // Here you would typically redirect to dashboard
      // For demo purposes, we'll just show success message
    } catch (error) {
      message.error("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card
          className="shadow-xl border-0 rounded-2xl overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center text-white">
            <div className="mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserOutlined className="text-3xl text-white" />
              </div>
              <Title level={2} className="text-white mb-2 !text-white">
                ระบบจัดการภาระงานนักศึกษา
              </Title>
              <Text className="text-blue-100 text-sm">
                Student Workload Management System
              </Text>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <Title level={3} className="text-gray-800 mb-2">
                เข้าสู่ระบบ
              </Title>
              <Text className="text-gray-500">
                กรุณากรอกชื่อผู้ใช้และรหัสผ่าน
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "กรุณากรอกชื่อผู้ใช้" },
                  { min: 3, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="ชื่อผู้ใช้"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "กรุณากรอกรหัสผ่าน" },
                  { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="รหัสผ่าน"
                  size="large"
                  className="rounded-lg"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item>
                <div className="flex items-center justify-between">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="text-sm text-gray-600">
                      จดจำการเข้าสู่ระบบ
                    </Checkbox>
                  </Form.Item>
                  <Button type="link" className="p-0 text-sm">
                    ลืมรหัสผ่าน?
                  </Button>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 border-0 hover:from-blue-700 hover:to-indigo-700"
                  style={{ height: "48px" }}
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </Form.Item>

              <div className="text-center text-sm text-gray-500 mt-6">
                <Text>
                  ต้องการความช่วยเหลือ?{" "}
                  <Button type="link" className="p-0 text-sm">
                    ติดต่อผู้ดูแลระบบ
                  </Button>
                </Text>
              </div>
            </Form>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <Text>
            © 2025 ระบบจัดการภาระงานนักศึกษา วิทยาลัยพยาบาลบรมราชชนนี ชัยนาท
          </Text>
          <br />
          <Text className="text-xs">พัฒนาโดย สิริภูมิ อาทรสิริรัตน์</Text>
        </div>
      </div>
    </div>
  );
}
