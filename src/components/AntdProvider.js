// src/components/AntdProvider.js
"use client";

import { ConfigProvider, App } from 'antd';
// ไม่ต้อง import theme แล้ว
// import theme from '../theme/themeConfig'; 

const AntdProvider = ({ children }) => (
  // ไม่ต้องใส่ prop `theme` ให้กับ ConfigProvider
  <ConfigProvider>
    <App>
      {children}
    </App>
  </ConfigProvider>
);

export default AntdProvider;