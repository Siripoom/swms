"use client";
import DashboardLayout from "@/components/DashboardLayout";

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout title="Dashboard อาจารย์" requiredRole={["teacher"]}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  รายวิชาที่สอน
                </p>
                <p className="text-2xl font-semibold text-gray-900">3 วิชา</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  นักศึกษาทั้งหมด
                </p>
                <p className="text-2xl font-semibold text-gray-900">87 คน</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  งานที่มอบหมาย
                </p>
                <p className="text-2xl font-semibold text-gray-900">12 งาน</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  ภาระงานเฉลี่ย
                </p>
                <p className="text-2xl font-semibold text-gray-900">24.5 ชม.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              รายวิชาที่รับผิดชอบ
            </h3>
            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
              <option>ปีการศึกษา 2567</option>
              <option>ปีการศึกษา 2566</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">NS101</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  ภาคเรียนที่ 1
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">การพยาบาลพื้นฐาน</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">นักศึกษา:</span>
                  <span className="font-medium">28 คน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">งานที่มอบหมาย:</span>
                  <span className="font-medium">4 งาน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ภาระงานเฉลี่ย:</span>
                  <span className="font-medium">22 ชม.</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>ความครอบคลุม</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">NS202</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ภาคเรียนที่ 1
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                แนวคิดพื้นฐานการพยาบาล
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">นักศึกษา:</span>
                  <span className="font-medium">31 คน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">งานที่มอบหมาย:</span>
                  <span className="font-medium">5 งาน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ภาระงานเฉลี่ย:</span>
                  <span className="font-medium">28 ชม.</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>ความครอบคลุม</span>
                  <span>82%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: "82%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">NS301</h4>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  ภาคเรียนที่ 1
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">การพยาบาลผู้ใหญ่ 1</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">นักศึกษา:</span>
                  <span className="font-medium">28 คน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">งานที่มอบหมาย:</span>
                  <span className="font-medium">3 งาน</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ภาระงานเฉลี่ย:</span>
                  <span className="font-medium">23 ชม.</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>ความครอบคลุม</span>
                  <span>58%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: "58%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ภาระงานเฉลี่ยรายวิชา
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              [กราฟแท่ง - แสดงภาระงานของนักศึกษาในแต่ละวิชา]
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              การกระจายตัวของภาระงาน
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              [Box Plot - แสดงการกระจายตัวของภาระงาน]
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            กิจกรรมล่าสุด
          </h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">
                  เพิ่มงานใหม่: แบบฝึกหัดที่ 6
                </p>
                <p className="text-sm text-gray-500">
                  วิชา NS202 - แนวคิดพื้นฐานการพยาบาล
                </p>
              </div>
              <span className="text-sm text-gray-400">30 นาที ที่แล้ว</span>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">
                  อัปเดตเกณฑ์การประเมิน
                </p>
                <p className="text-sm text-gray-500">
                  วิชา NS101 - การพยาบาลพื้นฐาน
                </p>
              </div>
              <span className="text-sm text-gray-400">2 ชม. ที่แล้ว</span>
            </div>

            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-gray-900">
                  ดูรายงานภาระงานนักศึกษา
                </p>
                <p className="text-sm text-gray-500">ภาคเรียนที่ 1/2567</p>
              </div>
              <span className="text-sm text-gray-400">1 วัน ที่แล้ว</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
