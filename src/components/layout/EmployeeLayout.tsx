import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar role="employee" />
      <div className="ml-64">
        <Header title="People of Podtech" />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
