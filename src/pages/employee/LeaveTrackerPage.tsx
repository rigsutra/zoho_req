import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { calculateBusinessDays } from "@/lib/date-utils";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { 
  Plus, 
  X as XIcon, 
  Calendar as CalendarIcon, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Palmtree,
  HeartPulse,
  List,
  Grid,
} from "lucide-react";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS },
});

const leaveColors: Record<string, string> = {
  CL: "#38bdf8",
  SL: "#f472b6",
  EL: "#34d399",
  LOP: "#6b7280",
  CO: "#fb923c",
};

const leaveIcons: Record<string, any> = {
  CL: Clock,
  SL: HeartPulse,
  EL: Palmtree,
};

export function LeaveTrackerPage() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: `${new Date().getFullYear()}-01-01`,
    to: `${new Date().getFullYear()}-12-31`,
  });

  const myRequests = useQuery(api.leaves.getMyRequests, {});
  const balances = useQuery(api.leaveBalances.getMyBalances);
  
  // Calculate stats for the year
  const yearStats = useMemo(() => {
    if (!myRequests) return { booked: 0, absent: 0 };
    
    const currentYear = new Date().getFullYear();
    const yearRequests = myRequests.filter(r => 
      r.startDate.startsWith(currentYear.toString()) && 
      (r.status === "approved" || r.status === "pending")
    );
    
    const booked = yearRequests.reduce((sum, r) => sum + r.numberOfDays, 0);
    const absent = myRequests.filter(r => 
      r.startDate.startsWith(currentYear.toString()) && 
      r.status === "approved"
    ).reduce((sum, r) => sum + r.numberOfDays, 0);
    
    return { booked, absent };
  }, [myRequests]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-data" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-12">
            <TabsTrigger value="my-data" className="px-6">My Data</TabsTrigger>
            <TabsTrigger value="team" className="px-6">Team</TabsTrigger>
            <TabsTrigger value="holidays" className="px-6">Holidays</TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsApplyOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        </div>

        <TabsContent value="my-data">
          <MyDataSection yearStats={yearStats} dateRange={dateRange} setDateRange={setDateRange} balances={balances} />
        </TabsContent>
        
        <TabsContent value="team">
          <TeamSection />
        </TabsContent>
        
        <TabsContent value="holidays">
          <HolidaysSection />
        </TabsContent>
      </Tabs>

      <ApplyLeaveDialog open={isApplyOpen} onOpenChange={setIsApplyOpen} />
    </div>
  );
}

function MyDataSection({ yearStats, dateRange, setDateRange, balances }: any) {
  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0">
        <TabsTrigger 
          value="summary" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Leave Summary
        </TabsTrigger>
        <TabsTrigger 
          value="balance" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Leave Balance
        </TabsTrigger>
        <TabsTrigger 
          value="requests" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Leave Requests
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="summary">
          <LeaveSummaryTab yearStats={yearStats} dateRange={dateRange} setDateRange={setDateRange} balances={balances} />
        </TabsContent>
        <TabsContent value="balance">
          <LeaveBalanceTab balances={balances} />
        </TabsContent>
        <TabsContent value="requests">
          <LeaveRequestsTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function LeaveSummaryTab({ yearStats, dateRange, setDateRange, balances }: any) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span>Leave booked this year: <strong>{yearStats.booked}</strong></span>
          <span className="text-muted-foreground">|</span>
          <span>Absent: <strong>{yearStats.absent}</strong></span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {dateRange.from} - {dateRange.to}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="flex border rounded-md ml-4">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {balances === undefined ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {balances.map((bal: any) => {
            const IconComponent = leaveIcons[bal.leaveType?.code] || CalendarIcon;
            const iconColor = leaveColors[bal.leaveType?.code] || "#6366f1";
            
            return (
              <Card key={bal._id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{bal.leaveType?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <div 
                      className="h-16 w-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${iconColor}15` }}
                    >
                      <IconComponent className="h-8 w-8" style={{ color: iconColor }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available</span>
                      <span className="text-2xl font-bold" style={{ color: iconColor }}>
                        {bal.available}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Booked</span>
                      <span className="font-medium">{bal.used} <CalendarIcon className="h-3 w-3 inline ml-1" /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upcoming Leaves & Holidays */}
      <UpcomingSection />
    </div>
  );
}

function UpcomingSection() {
  const holidays = useQuery(api.holidays.getUpcoming, { limit: 10 });
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Upcoming Leaves & Holidays</CardTitle>
          <ChevronRight 
            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {holidays === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : holidays.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No upcoming holidays</p>
          ) : (
            <div className="space-y-3">
              {holidays.map((holiday: any) => (
                <div key={holiday._id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🗓️</div>
                    <span className="font-medium">{holiday.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(holiday.date).toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      weekday: 'long'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function LeaveBalanceTab({ balances }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Leave Balances ({new Date().getFullYear()})</CardTitle></CardHeader>
      <CardContent>
        {balances === undefined ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((bal: any) => (
              <div key={bal._id} className="rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">{bal.leaveType?.name}</span>
                  <Badge variant="outline">{bal.leaveType?.code}</Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{bal.available}</div>
                <p className="text-sm text-muted-foreground mb-3">Available days</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Allocated</span><span>{bal.totalAllocation}</span>
                  </div>
                  {bal.carriedForward > 0 && (
                    <div className="flex justify-between">
                      <span>Carried Forward</span><span>{bal.carriedForward}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Used</span><span>{bal.used}</span>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((bal.used / Math.max(bal.totalAllocation + bal.carriedForward, 1)) * 100, 100)}%`,
                      backgroundColor: leaveColors[bal.leaveType?.code ?? ""] ?? "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveRequestsTab() {
  const myRequests = useQuery(api.leaves.getMyRequests, {});
  const cancelLeave = useMutation(api.leaves.cancel);
  const { toast } = useToast();

  const handleCancel = async (id: Id<"leaveRequests">) => {
    try {
      await cancelLeave({ leaveRequestId: id });
      toast({ title: "Leave request cancelled", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="warning">Pending</Badge>;
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "cancelled": return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>My Leave Requests</CardTitle></CardHeader>
      <CardContent>
        {myRequests === undefined ? (
          <Skeleton className="h-48 w-full" />
        ) : myRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No leave requests yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRequests.map((req) => (
                <TableRow key={req._id}>
                  <TableCell>{req.leaveType?.name}</TableCell>
                  <TableCell>{req.startDate}</TableCell>
                  <TableCell>{req.endDate}</TableCell>
                  <TableCell>{req.numberOfDays}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell>{statusBadge(req.status)}</TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(req._id)}
                      >
                        <XIcon className="h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TeamSection() {
  const teamOnLeave = useQuery(api.leaves.getTeamOnLeaveThisWeek);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");

  const rangeStart = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");

  const calendarLeaves = useQuery(api.leaves.getApprovedForCalendar, {
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  const events = useMemo(() => {
    if (!calendarLeaves) return [];
    return calendarLeaves.map((leave: any) => ({
      title: `${leave.user?.firstName} ${leave.user?.lastName} - ${leave.leaveType?.name}`,
      start: new Date(leave.startDate + "T00:00:00"),
      end: new Date(leave.endDate + "T23:59:59"),
      allDay: true,
      resource: { leaveTypeCode: leave.leaveType?.code },
    }));
  }, [calendarLeaves]);

  const eventStyleGetter = (event: (typeof events)[0]) => ({
    style: {
      backgroundColor: leaveColors[event.resource.leaveTypeCode ?? ""] ?? "#6366f1",
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "0",
      fontSize: "12px",
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Team Members On Leave This Week</CardTitle></CardHeader>
        <CardContent>
          {teamOnLeave === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : teamOnLeave.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team members are on leave this week.
            </p>
          ) : (
            <div className="space-y-3">
              {teamOnLeave.map((leave: any) => (
                <div key={leave._id} className="flex items-center gap-4 rounded-lg border p-4">
                  <Avatar
                    src={leave.user?.imageUrl}
                    fallback={`${leave.user?.firstName?.[0]}${leave.user?.lastName?.[0]}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{leave.user?.firstName} {leave.user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.leaveType?.name} &middot; {leave.startDate} to {leave.endDate}
                    </p>
                  </div>
                  <Badge>{leave.numberOfDays}d</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Team Leave Calendar</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              view={view}
              onNavigate={setCurrentDate}
              onView={setView}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "agenda"]}
            />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(leaveColors).map(([code, color]) => (
              <div key={code} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                {code}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HolidaysSection() {
  const holidays = useQuery(api.holidays.getForYear, { year: new Date().getFullYear() });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holidays {new Date().getFullYear()}</CardTitle>
      </CardHeader>
      <CardContent>
        {holidays === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : holidays.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No holidays scheduled for this year</p>
        ) : (
          <div className="space-y-3">
            {holidays.map((holiday: any) => (
              <div key={holiday._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                    {new Date(holiday.date).toLocaleDateString('en-US', { day: '2-digit' })}
                  </div>
                  <div>
                    <p className="font-semibold">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(holiday.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                </div>
                {holiday.location && (
                  <Badge variant="outline">{holiday.location}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function BalanceTab() {
  const balances = useQuery(api.leaveBalances.getMyBalances);

  return (
    <Card>
      <CardHeader><CardTitle>Leave Balances ({new Date().getFullYear()})</CardTitle></CardHeader>
      <CardContent>
        {balances === undefined ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((bal) => (
              <div key={bal._id} className="rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">{bal.leaveType?.name}</span>
                  <Badge variant="outline">{bal.leaveType?.code}</Badge>
                </div>
                <div className="text-3xl font-bold mb-1">{bal.available}</div>
                <p className="text-sm text-muted-foreground mb-3">Available days</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Allocated</span><span>{bal.totalAllocation}</span>
                  </div>
                  {bal.carriedForward > 0 && (
                    <div className="flex justify-between">
                      <span>Carried Forward</span><span>{bal.carriedForward}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Used</span><span>{bal.used}</span>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((bal.used / Math.max(bal.totalAllocation + bal.carriedForward, 1)) * 100, 100)}%`,
                      backgroundColor: leaveColors[bal.leaveType?.code ?? ""] ?? "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamLeaveTab() {
  const teamOnLeave = useQuery(api.leaves.getTeamOnLeaveThisWeek);

  return (
    <Card>
      <CardHeader><CardTitle>Team Members On Leave This Week</CardTitle></CardHeader>
      <CardContent>
        {teamOnLeave === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : teamOnLeave.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No team members are on leave this week.
          </p>
        ) : (
          <div className="space-y-3">
            {teamOnLeave.map((leave) => (
              <div key={leave._id} className="flex items-center gap-4 rounded-lg border p-4">
                <Avatar
                  src={leave.user?.imageUrl}
                  fallback={`${leave.user?.firstName?.[0]}${leave.user?.lastName?.[0]}`}
                />
                <div className="flex-1">
                  <p className="font-medium">{leave.user?.firstName} {leave.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {leave.leaveType?.name} &middot; {leave.startDate} to {leave.endDate}
                  </p>
                </div>
                <Badge>{leave.numberOfDays}d</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");

  const rangeStart = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd");

  const calendarLeaves = useQuery(api.leaves.getApprovedForCalendar, {
    startDate: rangeStart,
    endDate: rangeEnd,
  });

  const events = useMemo(() => {
    if (!calendarLeaves) return [];
    return calendarLeaves.map((leave) => ({
      title: `${leave.user?.firstName} ${leave.user?.lastName} - ${leave.leaveType?.name}`,
      start: new Date(leave.startDate + "T00:00:00"),
      end: new Date(leave.endDate + "T23:59:59"),
      allDay: true,
      resource: { leaveTypeCode: leave.leaveType?.code },
    }));
  }, [calendarLeaves]);

  const eventStyleGetter = (event: (typeof events)[0]) => ({
    style: {
      backgroundColor: leaveColors[event.resource.leaveTypeCode ?? ""] ?? "#6366f1",
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "0",
      fontSize: "12px",
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Leave Calendar</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={view}
            onNavigate={setCurrentDate}
            onView={setView}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "agenda"]}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(leaveColors).map(([code, color]) => (
            <div key={code} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
              {code}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplyLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const leaveTypes = useQuery(api.leaveTypes.listActive);
  const balances = useQuery(api.leaveBalances.getMyBalances);
  const applyLeave = useMutation(api.leaves.apply);
  const { toast } = useToast();

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const numberOfDays = form.startDate && form.endDate && form.startDate <= form.endDate
    ? calculateBusinessDays(form.startDate, form.endDate)
    : 0;

  const selectedBalance = balances?.find((b) => b.leaveTypeId === form.leaveTypeId);

  const handleSubmit = async () => {
    try {
      await applyLeave({
        leaveTypeId: form.leaveTypeId as Id<"leaveTypes">,
        startDate: form.startDate,
        endDate: form.endDate,
        numberOfDays,
        reason: form.reason,
      });
      toast({ title: "Leave application submitted!", variant: "success" });
      onOpenChange(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Leave Type</Label>
            <Select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
            >
              <option value="">Select leave type...</option>
              {leaveTypes?.map((lt) => (
                <option key={lt._id} value={lt._id}>{lt.name} ({lt.code})</option>
              ))}
            </Select>
            {selectedBalance && (
              <p className="text-sm text-muted-foreground mt-1">
                Available: {selectedBalance.available} days
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          {numberOfDays > 0 && (
            <p className="text-sm font-medium">
              Duration: {numberOfDays} business day{numberOfDays > 1 ? "s" : ""}
            </p>
          )}
          <div>
            <Label>Reason</Label>
            <Textarea
              placeholder="Please provide a reason for your leave..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason || numberOfDays === 0}
          >
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
