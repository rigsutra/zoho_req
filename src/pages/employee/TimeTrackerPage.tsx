import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, formatHours } from "@/lib/date-utils";
import { Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export function TimeTrackerPage() {
  const todayRecord = useQuery(api.attendance.getTodayStatus);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  const weekHistory = useQuery(api.attendance.getMyHistory, {
    startDate: weekStart.toISOString().split("T")[0]!,
    endDate: weekEnd.toISOString().split("T")[0]!,
  });

  const monthHistory = useQuery(api.attendance.getMyHistory, {
    startDate: monthStart,
    endDate: monthEnd,
  });

  const weeklyTotal = weekHistory?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;
  const monthlyTotal = monthHistory?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;
  const daysWorked = monthHistory?.filter((r) => r.totalHours > 0).length ?? 0;
  const avgHours = daysWorked > 0 ? monthlyTotal / daysWorked : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Time Tracker</h1>

      {/* Today's status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayRecord === undefined ? (
            <Skeleton className="h-20 w-full" />
          ) : !todayRecord ? (
            <p className="text-muted-foreground">No check-in recorded today.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">First In</p>
                <p className="text-lg font-semibold">{formatTime(todayRecord.firstCheckIn)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Out</p>
                <p className="text-lg font-semibold">
                  {todayRecord.lastCheckOut ? formatTime(todayRecord.lastCheckOut) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hours</p>
                <p className="text-lg font-semibold">
                  {todayRecord.isCheckedIn
                    ? <LiveTimer baseHours={todayRecord.totalHours} checkInTime={todayRecord.lastCheckIn} />
                    : formatHours(todayRecord.totalHours)}
                </p>
              </div>
              <Badge variant={todayRecord.status === "present" ? "success" : todayRecord.status === "half-day" ? "warning" : "secondary"}>
                {todayRecord.isCheckedIn ? "Working" : todayRecord.status}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatHours(weeklyTotal)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {weekHistory?.filter((r) => r.totalHours > 0).length ?? 0} days worked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatHours(monthlyTotal)}</div>
            <p className="text-sm text-muted-foreground mt-1">{daysWorked} days worked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatHours(avgHours)}</div>
            <p className="text-sm text-muted-foreground mt-1">per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly breakdown */}
      <Card>
        <CardHeader><CardTitle>This Week's Breakdown</CardTitle></CardHeader>
        <CardContent>
          {weekHistory === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : weekHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No records this week.</p>
          ) : (
            <div className="space-y-3">
              {weekHistory.map((rec) => (
                <div key={rec._id} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium">
                    {new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-primary transition-all"
                        style={{ width: `${Math.min(rec.totalHours / 10 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm font-medium">
                    {rec.totalHours > 0 ? formatHours(rec.totalHours) : "—"}
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

function LiveTimer({ baseHours, checkInTime }: { baseHours: number; checkInTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const checkIn = new Date(checkInTime).getTime();
    const update = () => setElapsed((Date.now() - checkIn) / (1000 * 60 * 60));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [checkInTime]);

  return <span className="text-primary">{formatHours(baseHours + elapsed)}</span>;
}
