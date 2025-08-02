// layout.js
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from 'antd';
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="antialiased">
        <ConfigProvider
          theme={{
            token: {
              fontFamily: `'DM Sans', 'Noto Sans Thai', sans-serif`,
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