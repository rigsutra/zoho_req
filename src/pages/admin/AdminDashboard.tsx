import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/date-utils";

export function AdminDashboard() {
  const employees = useQuery(api.employees.listAll);
  const pendingLeaves = useQuery(api.leaves.getPending);
  const todayStr = new Date().toISOString().split("T")[0]!;
  const todayAttendance = useQuery(api.attendance.getAllByDate, { date: todayStr });

  const isLoading = employees === undefined || pendingLeaves === undefined || todayAttendance === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter((e) => e.status === "active");
  const presentToday = todayAttendance.length;
  const currentlyWorking = todayAttendance.filter((a) => a.isCheckedIn).length;

  const stats = [
    { label: "Total Employees", value: activeEmployees.length, icon: Users, color: "text-blue-600" },
    { label: "Present Today", value: presentToday, icon: Clock, color: "text-green-600" },
    { label: "Currently In", value: currentlyWorking, icon: CalendarDays, color: "text-orange-600" },
    { label: "Pending Leaves", value: pendingLeaves.length, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div key={leave._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {leave.user?.firstName} {leave.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {leave.leaveType?.name} &middot; {leave.startDate} to {leave.endDate} ({leave.numberOfDays} days)
                    </p>
                  </div>
                  <span className="text-sm text-yellow-600 font-medium">Pending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <p className="text-muted-foreground">No check-ins recorded today.</p>
          ) : (
            <div className="space-y-2">
              {todayAttendance.map((record) => (
                <div key={record._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {record.user?.firstName} {record.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      In: {formatTime(record.firstCheckIn)}
                      {record.lastCheckOut && ` | Out: ${formatTime(record.lastCheckOut)}`}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${record.isCheckedIn ? "text-green-600" : "text-blue-600"}`}>
                    {record.isCheckedIn ? "Working..." : `${record.totalHours.toFixed(1)}h`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
