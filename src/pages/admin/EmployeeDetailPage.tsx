import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employee = useQuery(api.employees.getById, id ? { employeeId: id as Id<"employees"> } : "skip");
  const leaveBalances = useQuery(
    api.leaveBalances.getByEmployee,
    id ? { employeeId: id as Id<"employees"> } : "skip"
  );

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  const attendance = useQuery(
    api.attendance.getByEmployee,
    id ? { employeeId: id as Id<"employees">, startDate: monthStart, endDate: monthEnd } : "skip"
  );

  if (employee === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-muted-foreground">Employee not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/employees">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {employee.user?.firstName} {employee.user?.lastName}
        </h1>
        <Badge variant={employee.status === "active" ? "success" : "destructive"}>
          {employee.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Employee ID" value={employee.employeeId} />
            <InfoRow label="Email" value={employee.user?.email ?? ""} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Designation" value={employee.designation} />
            <InfoRow label="Date of Joining" value={employee.dateOfJoining} />
            <InfoRow label="Phone" value={employee.phone ?? "N/A"} />
            <InfoRow label="Address" value={employee.address ?? "N/A"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leave Balances</CardTitle></CardHeader>
          <CardContent>
            {leaveBalances === undefined ? (
              <Skeleton className="h-32 w-full" />
            ) : leaveBalances.length === 0 ? (
              <p className="text-muted-foreground">No leave balances configured.</p>
            ) : (
              <div className="space-y-3">
                {leaveBalances.map((bal) => (
                  <div key={bal._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{bal.leaveType?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Used: {bal.used} / {bal.totalAllocation + bal.carriedForward}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{bal.available}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>This Month's Attendance</CardTitle></CardHeader>
        <CardContent>
          {attendance === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : attendance.length === 0 ? (
            <p className="text-muted-foreground">No attendance records this month.</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((rec) => (
                <div key={rec._id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{rec.date}</span>
                  <div className="text-sm text-muted-foreground">
                    {new Date(rec.checkInTime).toLocaleTimeString()}
                    {rec.checkOutTime ? ` - ${new Date(rec.checkOutTime).toLocaleTimeString()}` : " (still working)"}
                  </div>
                  <Badge variant={rec.status === "present" ? "success" : "warning"}>
                    {rec.status} {rec.totalHours ? `(${rec.totalHours.toFixed(1)}h)` : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
