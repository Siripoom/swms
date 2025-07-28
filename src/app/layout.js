import { AuthProvider } from "@/contexts/AuthContext";
import { DM_Sans } from "next/font/google";
import { ConfigProvider } from 'antd';
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: "ระบบจัดการภาระงานนักศึกษา",
  description: "Student Workload Monitoring System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${dmSans.variable} antialiased`}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: `var(--font-dm-sans), 'Noto Sans Thai', sans-serif`,
            },
          }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}