// app/dashboard/layout.tsx - Dashboard layout wrapper

import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Layout/DashboardLayout';

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}