// layout.js
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider, App } from "antd";
import "./globals.css";
// ไม่จำเป็นต้อง import Sidebar ที่นี่ เพราะมันถูกเรียกใช้ในหน้าอื่น
// import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "SWMS - Student Workload Management System",
  description: "ระบบจัดการภาระงานนักศึกษา",
  keywords: "workload, student, management, university",
  // viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

const antdTheme = {
  token: {
    fontFamily: `'DM Sans', 'Noto Sans Thai', sans-serif`,
    borderRadius: 6,
    colorPrimary: "#1677ff",
    colorText: "#000000",
    colorTextLightSolid: "#ffffff",
    // ไม่มีการตั้งค่า colorLink ที่นี่อีกต่อไป เพื่อให้สี Link กลับไปเป็นค่าเริ่มต้นของ Ant Design
  },
  components: {
    Layout: {
      bodyBg: "#f5f5f5",
      headerBg: "#fff",
      // siderBg ไม่ได้ถูกใช้โดยตรง เพราะเราใช้ Tailwind ใน Sidebar.js
    },
    Card: {
      borderRadius: 8,
    },
    Button: {
      borderRadius: 6,
    },
  },
};

function AppWrapper({ children }) {
  return <App>{children}</App>;
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#1677ff" />
      </head>
      <body>
        <ConfigProvider theme={antdTheme}>
          <AuthProvider>
            <AppWrapper>{children}</AppWrapper>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}