import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LocationMapDialog } from "@/components/shared/LocationMap";
import { formatTime, formatHours } from "@/lib/date-utils";
import {
  MapPin,
  LogIn,
  LogOut,
  Clock,
  Calendar,
  Users,
  Building2,
  Map,
} from "lucide-react";
import { useState } from "react";

export function EmployeeHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Home</h1>
      <Tabs defaultValue="myspace">
        <TabsList>
          <TabsTrigger value="myspace">My Space</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>
        <TabsContent value="myspace"><MySpaceTab /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
        <TabsContent value="organization"><OrganizationTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function MySpaceTab() {
  const todayRecord = useQuery(api.attendance.getTodayStatus);
  const todayLogs = useQuery(
    api.attendance.getLogs,
    todayRecord ? { attendanceId: todayRecord._id } : "skip"
  );
  const leaveBalances = useQuery(api.leaveBalances.getMyBalances);
  const myRequests = useQuery(api.leaves.getMyRequests, {});
  const checkIn = useMutation(api.attendance.checkIn);
  const checkOut = useMutation(api.attendance.checkOut);
  const { getLocation, isLoading: locationLoading, error: locationError } = useGeolocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isCheckedIn = todayRecord?.isCheckedIn ?? false;

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      const loc = await getLocation();
      await checkIn({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy });
      toast({ title: "Checked in successfully!", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Check-in failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    try {
      const loc = await getLocation();
      await checkOut({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy });
      toast({ title: "Checked out successfully!", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Check-out failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build map locations from logs
  const mapLocations = (todayLogs ?? []).map((log, idx) => ({
    latitude: log.location.latitude,
    longitude: log.location.longitude,
    accuracy: log.location.accuracy,
    label: `#${idx + 1}`,
    time: formatTime(log.time),
    type: log.type as "check-in" | "check-out",
  }));

  const pendingLeaves = myRequests?.filter((r) => r.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Attendance
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayRecord === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-4">
              {/* Current status */}
              <div className="flex items-center gap-4">
                {!todayRecord ? (
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <span className="text-muted-foreground">Not checked in yet</span>
                  </div>
                ) : isCheckedIn ? (
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-700 font-medium">
                      Working since {formatTime(todayRecord.lastCheckIn)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-blue-700 font-medium">
                      Checked out &middot; {formatHours(todayRecord.totalHours)} today
                    </span>
                  </div>
                )}
              </div>

              {/* Today's summary */}
              {todayRecord && (
                <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">First In</p>
                    <p className="text-sm font-semibold">{formatTime(todayRecord.firstCheckIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Out</p>
                    <p className="text-sm font-semibold">
                      {todayRecord.lastCheckOut ? formatTime(todayRecord.lastCheckOut) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                    <p className="text-sm font-semibold">{formatHours(todayRecord.totalHours)}</p>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <MapPin className="h-4 w-4" />
                  {locationError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {!isCheckedIn && (
                  <Button onClick={handleCheckIn} disabled={isSubmitting || locationLoading}>
                    <LogIn className="h-4 w-4" />
                    {isSubmitting ? "Getting location..." : todayRecord ? "Check In Again" : "Check In"}
                  </Button>
                )}
                {isCheckedIn && (
                  <Button onClick={handleCheckOut} disabled={isSubmitting || locationLoading} variant="outline">
                    <LogOut className="h-4 w-4" />
                    {isSubmitting ? "Getting location..." : "Check Out"}
                  </Button>
                )}
                {todayRecord && (
                  <Button variant="outline" onClick={() => setShowMap(true)}>
                    <Map className="h-4 w-4" /> View Map
                  </Button>
                )}
              </div>

              {/* Location log list */}
              {todayLogs && todayLogs.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Location Log</p>
                  {todayLogs.map((log, idx) => (
                    <div key={log._id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-medium">{formatTime(log.time)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.type === "check-in" ? "success" : "secondary"}>
                          {log.type === "check-in" ? "Check In" : "Check Out"}
                        </Badge>
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map dialog */}
      <LocationMapDialog
        open={showMap}
        onOpenChange={setShowMap}
        title="Today's Location Log"
        locations={mapLocations}
      />

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Leave Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveBalances === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leaveBalances.map((bal) => (
                <div key={bal._id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{bal.leaveType?.name}</span>
                    <Badge variant="outline">{bal.leaveType?.code}</Badge>
                  </div>
                  <div className="text-2xl font-bold">{bal.available}</div>
                  <p className="text-xs text-muted-foreground">
                    Used {bal.used} of {bal.totalAllocation + bal.carriedForward}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min((bal.used / Math.max(bal.totalAllocation + bal.carriedForward, 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Leave Requests */}
      {pendingLeaves.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingLeaves.map((req) => (
                <div key={req._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium">{req.leaveType?.name}</span>
                    <p className="text-sm text-muted-foreground">
                      {req.startDate} to {req.endDate} ({req.numberOfDays} days)
                    </p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamTab() {
  const teamMembers = useQuery(api.employees.getTeamMembers);
  const teamOnLeave = useQuery(api.leaves.getTeamOnLeaveThisWeek);

  return (
    <div className="space-y-6">
      {/* Team on leave this week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Team On Leave This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamOnLeave === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : teamOnLeave.length === 0 ? (
            <p className="text-muted-foreground">No team members on leave this week.</p>
          ) : (
            <div className="space-y-2">
              {teamOnLeave.map((leave) => (
                <div key={leave._id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar
                    src={leave.user?.imageUrl}
                    fallback={`${leave.user?.firstName?.[0]}${leave.user?.lastName?.[0]}`}
                    className="h-8 w-8"
                  />
                  <div>
                    <p className="font-medium">{leave.user?.firstName} {leave.user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.leaveType?.name}: {leave.startDate} - {leave.endDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No other team members found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teamMembers.map((member) => (
                <div key={member._id} className="flex items-center gap-3 rounded-lg border p-4">
                  <Avatar
                    src={member.user?.imageUrl}
                    fallback={`${member.user?.firstName?.[0]}${member.user?.lastName?.[0]}`}
                  />
                  <div>
                    <p className="font-medium">{member.user?.firstName} {member.user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{member.designation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationTab() {
  const profile = useQuery(api.employees.getMyProfile);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-3">
              <InfoRow label="Name" value={`${profile.user.firstName} ${profile.user.lastName}`} />
              <InfoRow label="Email" value={profile.user.email} />
              <InfoRow label="Employee ID" value={profile.employee.employeeId} />
              <InfoRow label="Department" value={profile.employee.department} />
              <InfoRow label="Designation" value={profile.employee.designation} />
              <InfoRow label="Date of Joining" value={profile.employee.dateOfJoining} />
              {profile.manager && (
                <InfoRow label="Manager" value={`${profile.manager.firstName} ${profile.manager.lastName}`} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
