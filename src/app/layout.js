import { AuthProvider } from "@/contexts/AuthContext"; // <-- 1. Import AuthProvider
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SWMS App", // อาจจะเปลี่ยนชื่อ Title ให้สื่อความหมายมากขึ้น
  description: "Student Workload Monitoring System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}