import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Check, X } from "lucide-react";

export function LeaveManagementPage() {
  const pendingLeaves = useQuery(api.leaves.getPending);
  const allLeaves = useQuery(api.leaves.getAllRequests, {});
  const approveLeave = useMutation(api.leaves.approve);
  const rejectLeave = useMutation(api.leaves.reject);
  const { toast } = useToast();

  const [reviewingId, setReviewingId] = useState<Id<"leaveRequests"> | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  const handleReview = async () => {
    if (!reviewingId) return;
    try {
      if (reviewAction === "approve") {
        await approveLeave({ leaveRequestId: reviewingId, notes: reviewNotes || undefined });
        toast({ title: "Leave approved", variant: "success" });
      } else {
        await rejectLeave({ leaveRequestId: reviewingId, notes: reviewNotes || undefined });
        toast({ title: "Leave rejected" });
      }
      setReviewingId(null);
      setReviewNotes("");
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave Management</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingLeaves?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
            <CardContent>
              {pendingLeaves === undefined ? (
                <Skeleton className="h-48 w-full" />
              ) : pendingLeaves.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending requests.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLeaves.map((leave) => (
                      <TableRow key={leave._id}>
                        <TableCell className="font-medium">
                          {leave.user?.firstName} {leave.user?.lastName}
                        </TableCell>
                        <TableCell>{leave.leaveType?.name}</TableCell>
                        <TableCell>{leave.startDate}</TableCell>
                        <TableCell>{leave.endDate}</TableCell>
                        <TableCell>{leave.numberOfDays}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(leave.appliedOn).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => { setReviewingId(leave._id); setReviewAction("approve"); }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => { setReviewingId(leave._id); setReviewAction("reject"); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader><CardTitle>All Leave Requests</CardTitle></CardHeader>
            <CardContent>
              {allLeaves === undefined ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLeaves.map((leave) => (
                      <TableRow key={leave._id}>
                        <TableCell className="font-medium">
                          {leave.user?.firstName} {leave.user?.lastName}
                        </TableCell>
                        <TableCell>{leave.leaveType?.name}</TableCell>
                        <TableCell>{leave.startDate}</TableCell>
                        <TableCell>{leave.endDate}</TableCell>
                        <TableCell>{leave.numberOfDays}</TableCell>
                        <TableCell>{statusBadge(leave.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(leave.appliedOn).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!reviewingId} onOpenChange={() => setReviewingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "approve"
                ? "This will deduct the leave from the employee's balance."
                : "The leave request will be rejected. The employee will be notified."}
            </p>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add a note..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingId(null)}>Cancel</Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleReview}
            >
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
