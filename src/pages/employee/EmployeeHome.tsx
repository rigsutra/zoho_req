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
  User,
  Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";

export function EmployeeHome() {
  const profile = useQuery(api.employees.getMyProfile);
  const todayRecord = useQuery(api.attendance.getTodayStatus);
  const todayLogs = useQuery(
    api.attendance.getLogs,
    todayRecord ? { attendanceId: todayRecord._id } : "skip"
  );
  const checkIn = useMutation(api.attendance.checkIn);
  const checkOut = useMutation(api.attendance.checkOut);
  const { getLocation, isLoading: locationLoading, error: locationError } = useGeolocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const isCheckedIn = todayRecord?.isCheckedIn ?? false;

  // Timer effect
  useEffect(() => {
    if (!isCheckedIn || !todayRecord?.lastCheckIn) return;
    
    const interval = setInterval(() => {
      const checkInTime = new Date(todayRecord.lastCheckIn!).getTime();
      const now = Date.now();
      const diff = now - checkInTime;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime({ hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isCheckedIn, todayRecord?.lastCheckIn]);

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

  const mapLocations = (todayLogs ?? []).map((log, idx) => ({
    latitude: log.location.latitude,
    longitude: log.location.longitude,
    accuracy: log.location.accuracy,
    label: `#${idx + 1}`,
    time: formatTime(log.time),
    type: log.type as "check-in" | "check-out",
  }));

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Profile Card */}
      <div className="w-80 space-y-4">
        <Card className="overflow-hidden">
          {/* Profile Header with gradient background */}
          <div className="h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 relative">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {profile ? (
                <Avatar
                  src={profile.user.imageUrl}
                  fallback={`${profile.user.firstName?.[0]}${profile.user.lastName?.[0]}`}
                  className="h-24 w-24 border-4 border-white"
                />
              ) : (
                <Skeleton className="h-24 w-24 rounded-full border-4 border-white" />
              )}
            </div>
          </div>

          <CardContent className="pt-16 pb-6 text-center space-y-4">
            {profile ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {profile.employee.employeeId} - {profile.user.firstName} {profile.user.lastName}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {profile.employee.designation}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2">
                  {isCheckedIn ? (
                    <Badge variant="success" className="px-3 py-1">In</Badge>
                  ) : (
                    <Badge variant="secondary" className="px-3 py-1">Out</Badge>
                  )}
                </div>

                {/* Timer Display */}
                <div className="text-center py-4">
                  <div className="text-3xl font-bold font-mono">
                    {String(elapsedTime.hours).padStart(2, '0')} : {String(elapsedTime.minutes).padStart(2, '0')} : {String(elapsedTime.seconds).padStart(2, '0')}
                  </div>
                  {isCheckedIn && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Time since check-in
                    </p>
                  )}
                </div>

                {/* Check-in/Check-out Button */}
                <div className="flex flex-col gap-2">
                  {!isCheckedIn ? (
                    <Button 
                      onClick={handleCheckIn} 
                      disabled={isSubmitting || locationLoading}
                      className="w-full"
                      size="lg"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Checking in..." : "Check In"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCheckOut} 
                      disabled={isSubmitting || locationLoading}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Checking out..." : "Check-out"}
                    </Button>
                  )}
                  {todayRecord && (
                    <Button variant="outline" onClick={() => setShowMap(true)} size="sm">
                      <Map className="h-3 w-3 mr-2" /> Location Log
                    </Button>
                  )}
                </div>

                {locationError && (
                  <div className="text-xs text-destructive flex items-center gap-1 justify-center">
                    <MapPin className="h-3 w-3" />
                    {locationError}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reporting To Card */}
        {profile?.manager && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Reporting To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar
                  src={profile.manager.imageUrl}
                  fallback={`${profile.manager.firstName?.[0]}${profile.manager.lastName?.[0]}`}
                  className="h-10 w-10"
                />
                <div>
                  <p className="font-medium text-sm">
                    {profile.manager.firstName} {profile.manager.lastName}
                  </p>
                  <Badge variant="success" className="text-xs mt-1">In</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="justify-start border-b w-full rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Activities
            </TabsTrigger>
            <TabsTrigger value="feeds" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Feeds
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Profile
            </TabsTrigger>
            <TabsTrigger value="approvals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Approvals
            </TabsTrigger>
            <TabsTrigger value="leave" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Leave
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Attendance
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="activities">
              <ActivitiesTab profile={profile} todayRecord={todayRecord} />
            </TabsContent>
            <TabsContent value="feeds">
              <FeedsTab />
            </TabsContent>
            <TabsContent value="profile">
              <ProfileTab profile={profile} />
            </TabsContent>
            <TabsContent value="approvals">
              <ApprovalsTab />
            </TabsContent>
            <TabsContent value="leave">
              <LeaveTab />
            </TabsContent>
            <TabsContent value="attendance">
              <AttendanceTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Map Dialog */}
      <LocationMapDialog
        open={showMap}
        onOpenChange={setShowMap}
        title="Today's Location Log"
        locations={mapLocations}
      />
    </div>
  );
}

function ActivitiesTab({ profile, todayRecord }: { profile: any; todayRecord: any }) {
  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="text-5xl">🧠</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} {profile?.user.firstName || 'there'}!
            </h2>
            <p className="text-muted-foreground">Have a productive day!</p>
          </div>
          <div className="text-6xl">☀️</div>
        </CardContent>
      </Card>

      {/* Work Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Schedule
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">General</p>
                <p className="text-sm text-muted-foreground">12:00 AM - 12:00 AM</p>
              </div>
            </div>
            
            {/* Week Timeline */}
            <div className="flex justify-between items-center pt-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + i);
                const dayNum = date.getDate();
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={day} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{day} {dayNum}</div>
                    {isToday ? (
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                        {dayNum}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border flex items-center justify-center text-sm">
                        {dayNum}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      {todayRecord && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-green-600">
                  {todayRecord.firstCheckIn ? formatTime(todayRecord.firstCheckIn) : '--:--'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">First Check-in</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-blue-600">
                  {todayRecord.lastCheckOut ? formatTime(todayRecord.lastCheckOut) : '--:--'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Last Check-out</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-purple-600">
                  {formatHours(todayRecord.totalHours)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-4">📰</div>
          <p className="text-muted-foreground">No feeds available at the moment</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab({ profile }: { profile: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow label="Full Name" value={`${profile.user.firstName} ${profile.user.lastName}`} />
              <InfoRow label="Email" value={profile.user.email} />
              <InfoRow label="Employee ID" value={profile.employee.employeeId} />
              <InfoRow label="Department" value={profile.employee.department} />
              <InfoRow label="Designation" value={profile.employee.designation} />
              <InfoRow label="Date of Joining" value={profile.employee.dateOfJoining} />
              {profile.employee.phone && <InfoRow label="Phone" value={profile.employee.phone} />}
              {profile.employee.address && <InfoRow label="Address" value={profile.employee.address} />}
              {profile.employee.emergencyContact && (
                <InfoRow label="Emergency Contact" value={profile.employee.emergencyContact} />
              )}
            </div>
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-muted-foreground">No pending approvals</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LeaveTab() {
  const leaveBalances = useQuery(api.leaveBalances.getMyBalances);
  const myRequests = useQuery(api.leaves.getMyRequests, {});
  const pendingLeaves = myRequests?.filter((r) => r.status === "pending") ?? [];

  return (
    <div className="space-y-6">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function AttendanceTab() {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  
  const records = useQuery(api.attendance.getMyHistory, { startDate: startOfMonth, endDate: endOfMonth });
  const totalHours = records?.reduce((sum, r) => sum + r.totalHours, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Days Present</div>
            <div className="text-3xl font-bold text-green-600">{records?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Hours</div>
            <div className="text-3xl font-bold text-blue-600">{formatHours(totalHours)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Average/Day</div>
            <div className="text-3xl font-bold text-purple-600">
              {records?.length ? formatHours(totalHours / records.length) : '0h'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {records === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance records this month</p>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 5).map((rec) => (
                <div key={rec._id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{rec.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {rec.firstCheckIn && formatTime(rec.firstCheckIn)} - {rec.lastCheckOut ? formatTime(rec.lastCheckOut) : 'In Progress'}
                    </p>
                  </div>
                  <div className="text-right">
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
                    <p className="text-sm font-medium mt-1">{formatHours(rec.totalHours)}</p>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
