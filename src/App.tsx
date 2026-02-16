import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { SignInPage } from "@/pages/SignInPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { EmployeesPage } from "@/pages/admin/EmployeesPage";
import { EmployeeDetailPage } from "@/pages/admin/EmployeeDetailPage";
import { AttendancePage as AdminAttendancePage } from "@/pages/admin/AttendancePage";
import { LeaveManagementPage } from "@/pages/admin/LeaveManagementPage";
import { EmployeeHome } from "@/pages/employee/EmployeeHome";
import { LeaveTrackerPage } from "@/pages/employee/LeaveTrackerPage";
import { TimeTrackerPage } from "@/pages/employee/TimeTrackerPage";
import { AttendancePage as EmployeeAttendancePage } from "@/pages/employee/AttendancePage";
import { useRole } from "@/hooks/useRole";
import { useStoreUser } from "@/hooks/useStoreUser";
import { useAuth } from "@clerk/clerk-react";

function RootRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const { role, isLoading } = useRole();

  if (!isLoaded || isLoading) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/employee" replace />;
}

function UserSync() {
  useStoreUser();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <UserSync />
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="leaves" element={<LeaveManagementPage />} />
        </Route>

        <Route
          path="/employee"
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeHome />} />
          <Route path="leaves" element={<LeaveTrackerPage />} />
          <Route path="time-tracker" element={<TimeTrackerPage />} />
          <Route path="attendance" element={<EmployeeAttendancePage />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
