import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationMapDialog } from "@/components/shared/LocationMap";
import { formatTime, formatHours, getTodayISO } from "@/lib/date-utils";
import { Map } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function AttendancePage() {
  const [date, setDate] = useState(getTodayISO());
  const records = useQuery(api.attendance.getAllByDate, { date });
  const [mapAttendanceId, setMapAttendanceId] = useState<Id<"attendance"> | null>(null);
  const [mapTitle, setMapTitle] = useState("");

  const logs = useQuery(
    api.attendance.getLogsByAttendanceId,
    mapAttendanceId ? { attendanceId: mapAttendanceId } : "skip"
  );

  const uniqueEmployees = new Set(records?.map((r) => r.employeeId) ?? []);
  const totalHours = records?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;
  const checkedIn = records?.filter((r) => r.isCheckedIn).length ?? 0;

  const mapLocations = (logs ?? []).map((log, idx) => ({
    latitude: log.location.latitude,
    longitude: log.location.longitude,
    accuracy: log.location.accuracy,
    label: `#${idx + 1}`,
    time: formatTime(log.time),
    type: log.type as "check-in" | "check-out",
  }));

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

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Employees Present</div>
            <div className="text-2xl font-bold">{uniqueEmployees.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Currently In</div>
            <div className="text-2xl font-bold text-green-600">{checkedIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Checked Out</div>
            <div className="text-2xl font-bold text-blue-600">{uniqueEmployees.size - checkedIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Hours</div>
            <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
          </CardContent>
        </Card>
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
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location Log</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec._id}>
                    <TableCell className="font-medium">
                      {rec.user?.firstName} {rec.user?.lastName}
                    </TableCell>
                    <TableCell>{formatTime(rec.firstCheckIn)}</TableCell>
                    <TableCell>
                      {rec.lastCheckOut ? formatTime(rec.lastCheckOut) : "—"}
                    </TableCell>
                    <TableCell>{formatHours(rec.totalHours)}</TableCell>
                    <TableCell>
                      <Badge variant={rec.isCheckedIn ? "success" : rec.status === "present" ? "success" : rec.status === "half-day" ? "warning" : "destructive"}>
                        {rec.isCheckedIn ? "Working" : rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMapAttendanceId(rec._id);
                          setMapTitle(`Location Log — ${rec.user?.firstName ?? ""} ${rec.user?.lastName ?? ""} (${date})`);
                        }}
                      >
                        <Map className="h-4 w-4" /> View Map
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LocationMapDialog
        open={!!mapAttendanceId}
        onOpenChange={() => setMapAttendanceId(null)}
        title={mapTitle}
        locations={mapLocations}
      />
    </div>
  );
}
