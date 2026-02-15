import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar role="admin" />
      <div className="ml-64">
        <Header title="Admin Panel" />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
