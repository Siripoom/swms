"use client";

import Reacexport default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const { message } = App.useApp();

  // Memoized redirect function
  const redirectUserByRole = useCallback(async (userId) => {State, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import { PageLoadingSkeleton } from "@/components/LoadingSkeleton";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  App,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import Image from "next/image";
import myLogo from "@/assets/logo.png";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  // Memoized redirect function
  const redirectUserByRole = useCallback(
    async (userId) => {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (error || !userData) {
          console.error("Error fetching user role:", error);
          message.error("ไม่สามารถดึงข้อมูลบทบาทผู้ใช้ได้");
          return false;
        }

        const role = userData.role;

        switch (role) {
          case "admin":
            await router.push("/admin/dashboard");
            break;
          case "department_head":
            await router.push("/department/dashboard");
            break;
          case "teacher":
            await router.push("/teacher/dashboard");
            break;
          case "student":
            await router.push("/student/dashboard");
            break;
          default:
            message.error("บทบาทผู้ใช้ไม่ถูกต้อง");
            await supabase.auth.signOut();
            return false;
        }

        return true;
      } catch (error) {
        console.error("Error in redirectUserByRole:", error);
        message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        return false;
      }
    },
    [router]
  );

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Redirect ตาม role ถ้ามี session
          await redirectUserByRole(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkExistingSession();
  }, [redirectUserByRole]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.username,
        password: values.password,
      });

      if (error) throw error;

      if (data.user) {
        message.success("เข้าสู่ระบบสำเร็จ!");

        if (values.remember) {
          localStorage.setItem("rememberLogin", "true");
        } else {
          localStorage.removeItem("rememberLogin");
        }

        await redirectUserByRole(data.user.id);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.message === "Invalid login credentials") {
        message.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } else if (error.message === "Email not confirmed") {
        message.error("กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
      } else {
        message.error("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
  };

  // ตัวอย่าง UI ลืมรหัสผ่าน แบบง่าย ๆ (เชื่อมไปหน้าลืมรหัสผ่าน)
  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  // แสดง loading skeleton ขณะตรวจสอบ session
  if (initialLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card
          className="shadow-xl border-0 rounded-2xl overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center text-white">
            <div className="mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 p-1">
                <Image
                  src={myLogo}
                  alt="โลโก้ระบบ"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain rounded-full"
                  priority
                />
              </div>
              <Title level={2} className="!text-white mb-2">
                ระบบจัดการภาระงานนักศึกษา
              </Title>
              <Text className="text-blue-100 text-sm">
                Student Workload Management System
              </Text>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <Title level={3} className="text-gray-800 mb-2">
                เข้าสู่ระบบ
              </Title>
              <Text className="text-gray-500">กรุณากรอกอีเมลและรหัสผ่าน</Text>
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
                  { required: true, message: "กรุณากรอกอีเมล" },
                  { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="อีเมล"
                  size="large"
                  className="rounded-lg"
                  type="email"
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
                  {/* <Button type="link" className="p-0 text-sm" onClick={handleForgotPassword}>
                    ลืมรหัสผ่าน?
                  </Button> */}
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

              {/* <div className="text-center text-sm text-gray-500 mt-6">
                <Text>
                  ต้องการความช่วยเหลือ?{" "}
                  <Button type="link" className="p-0 text-sm">
                    ติดต่อผู้ดูแลระบบ
                  </Button>
                </Text>
              </div> */}
            </Form>
          </div>
        </Card>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <Text>
            © 2025 ระบบจัดการภาระงานนักศึกษา วิทยาลัยพยาบาลบรมราชชนนี ชัยนาท
          </Text>
          <br />
          <Text className="text-xs">พัฒนาโดย สิริภูมิ อาทรสิริรัตน์</Text>
          <br />
          <Text className="text-xs">
            อ.ประกาศิต พูลวงษ์ และ อ.ฮิโรชิเกะ นาราฮารา
          </Text>
        </div>
      </div>
    </div>
  );
}
