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
import { getTodayISO } from "@/lib/date-utils";

export function AttendancePage() {
  const [date, setDate] = useState(getTodayISO());
  const records = useQuery(api.attendance.getAllByDate, { date });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance Records</h1>

      <div className="flex items-center gap-4">
        <Label>Date:</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Attendance for {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No attendance records for this date.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location (In)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec._id}>
                    <TableCell className="font-medium">
                      {rec.user?.firstName} {rec.user?.lastName}
                    </TableCell>
                    <TableCell>{new Date(rec.checkInTime).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      {rec.checkOutTime
                        ? new Date(rec.checkOutTime).toLocaleTimeString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {rec.totalHours ? `${rec.totalHours.toFixed(1)}h` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rec.status === "present" ? "success" : rec.status === "half-day" ? "warning" : "destructive"}>
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {rec.checkInLocation.latitude.toFixed(4)}, {rec.checkInLocation.longitude.toFixed(4)}
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
