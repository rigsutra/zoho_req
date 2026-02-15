import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, formatHours } from "@/lib/date-utils";

export function AttendancePage() {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const records = useQuery(api.attendance.getMyHistory, { startDate, endDate });

  const totalHours = records?.reduce((sum, r) => sum + (r.totalHours ?? 0), 0) ?? 0;
  const presentDays = records?.filter((r) => r.status === "present").length ?? 0;
  const halfDays = records?.filter((r) => r.status === "half-day").length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Attendance</h1>

      <div className="flex items-center gap-4">
        <div>
          <Label>From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-48" />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-48" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Days</div>
            <div className="text-2xl font-bold">{records?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Present</div>
            <div className="text-2xl font-bold text-green-600">{presentDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Half Days</div>
            <div className="text-2xl font-bold text-yellow-600">{halfDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Hours</div>
            <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
        <CardContent>
          {records === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found for this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec._id}>
                    <TableCell className="font-medium">{rec.date}</TableCell>
                    <TableCell>
                      {new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </TableCell>
                    <TableCell>{formatTime(rec.checkInTime)}</TableCell>
                    <TableCell>
                      {rec.checkOutTime ? formatTime(rec.checkOutTime) : "—"}
                    </TableCell>
                    <TableCell>
                      {rec.totalHours ? formatHours(rec.totalHours) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rec.status === "present"
                            ? "success"
                            : rec.status === "half-day"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {rec.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
