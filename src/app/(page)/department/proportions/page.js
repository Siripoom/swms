"use Client";
import DashboardLayout from "@/components/DashboardLayout";
export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard" requiredRole={["admin"]}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ภาพรวมระบบ</h2>
          <p className="text-gray-600">
            หน้า Dashboard ของผู้ดูแลระบบ - จะมีกราฟและสถิติต่างๆ
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
