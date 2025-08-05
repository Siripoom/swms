# การปรับปรุงประสิทธิภาพ SWMS

## การเปลี่ยนแปลงที่ทำ

### 1. Next.js Configuration Optimization
- เปิดใช้งาน SWC minification
- เพิ่ม modular imports สำหรับ Ant Design
- ปรับแต่ง compression และ image optimization
- เพิ่ม performance headers

### 2. Loading Optimization
- สร้าง Loading Skeleton components
- ปรับปรุง AuthContext ให้มี caching
- ใช้ dynamic imports สำหรับ chart components
- เพิ่ม error boundaries

### 3. CSS & Font Optimization
- ใช้ font-display: swap
- เพิ่ม preconnect และ dns-prefetch
- ปรับปรุง CSS animations
- เพิ่ม critical path optimization

### 4. Caching Strategy
- สร้าง custom hooks สำหรับ caching (useCache)
- เพิ่ม Service Worker สำหรับ static assets
- ใช้ request deduplication
- เพิ่ม cache invalidation

### 5. Component Optimization
- ใช้ React.memo สำหรับ components ที่เหมาะสม
- เพิ่ม useCallback และ useMemo
- ปรับปรุง re-rendering ที่ไม่จำเป็น
- เพิ่ม lazy loading

## การใช้งาน

### Loading Skeleton Components
```jsx
import { DashboardCardSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton';

// ใช้ในขณะที่รอข้อมูล
{loading ? <DashboardCardSkeleton count={4} /> : <DashboardCards />}
```

### Cache Hook
```jsx
import { useCache } from '@/hooks/useCache';

const MyComponent = () => {
  const { data, loading, fetchData, invalidateCache } = useCache('my-data-key');
  
  useEffect(() => {
    fetchData(() => apiCall());
  }, []);
};
```

### Performance Monitoring
- ใช้ React Developer Tools Profiler
- ตรวจสอบ Network tab ใน Chrome DevTools
- ใช้ Lighthouse สำหรับ performance audit

## แนะนำเพิ่มเติม

### 1. Database Optimization
- เพิ่ม indexes ที่เหมาะสม
- ใช้ query optimization
- พิจารณา database connection pooling

### 2. API Optimization
- ใช้ pagination สำหรับข้อมูลจำนวนมาก
- เพิ่ม API response caching
- ใช้ GraphQL หรือ tRPC สำหรับ type safety

### 3. Monitoring
- ตั้งค่า performance monitoring (เช่น Sentry)
- ใช้ Web Vitals tracking
- เพิ่ม error logging

### 4. Infrastructure
- ใช้ CDN สำหรับ static assets
- เพิ่ม gzip compression
- พิจารณา Server-Side Rendering (SSR) หรือ Static Site Generation (SSG)

## คำสั่งที่มีประโยชน์

```bash
# Build และ analyze bundle size
ANALYZE=true npm run build

# ตรวจสอบ performance
npm run lighthouse

# Run development with turbopack
npm run dev

# Check bundle size
npx @next/bundle-analyzer
```

## เมตริกที่ควรติดตาม

1. **First Contentful Paint (FCP)** - < 1.8s
2. **Largest Contentful Paint (LCP)** - < 2.5s
3. **First Input Delay (FID)** - < 100ms
4. **Cumulative Layout Shift (CLS)** - < 0.1
5. **Time to Interactive (TTI)** - < 3.8s

## ปัญหาที่พบบ่อยและการแก้ไข

### 1. หน้าโหลดช้า
- ตรวจสอบ Network requests ที่ซ้ำซ้อน
- ใช้ loading states ที่เหมาะสม
- เพิ่ม caching

### 2. JavaScript bundle ใหญ่
- ใช้ dynamic imports
- ลบ dependencies ที่ไม่จำเป็น
- ใช้ tree shaking

### 3. Database queries ช้า
- เพิ่ม indexes
- ใช้ EXPLAIN ANALYZE ใน PostgreSQL
- พิจารณา query optimization

### 4. Memory leaks
- ใช้ cleanup functions ใน useEffect
- ตรวจสอบ event listeners
- ใช้ React DevTools Profiler

### 5. Module import errors
- ตรวจสอบ import statements ให้ถูกต้อง
- ลบ unused imports
- ใช้ named imports แทน default imports เมื่อเหมาะสม

### 6. Ant Design modular imports
- ใน Ant Design v5 ไม่จำเป็นต้องใช้ modularizeImports
- ใช้ tree shaking ที่มาพร้อมกับ Ant Design v5
- หลีกเลี่ยงการ import จาก 'antd/lib/...'

## การแก้ไขปัญหาเฉพาะ

### Module not found: Can't resolve 'antd/lib/Button'
```javascript
// ❌ ไม่ถูกต้อง (สำหรับ Ant Design v5)
modularizeImports: {
  'antd': {
    transform: 'antd/lib/{{member}}',
  },
}

// ✅ ถูกต้อง - ลบ modularizeImports ออก
// Ant Design v5 มี tree shaking อยู่แล้ว
```

### Error: Spin is not defined
```javascript
// ❌ ไม่ถูกต้อง - import แต่ไม่ใช้
import { Spin } from 'antd';

// ✅ ถูกต้อง - ลบ import ที่ไม่ใช้
import { Button, Form } from 'antd';
```