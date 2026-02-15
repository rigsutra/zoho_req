import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, UserX } from "lucide-react";

export function EmployeesPage() {
  const employees = useQuery(api.employees.listAll);
  const allUsers = useQuery(api.users.listAll);
  const createEmployee = useMutation(api.employees.create);
  const updateEmployee = useMutation(api.employees.update);
  const removeEmployee = useMutation(api.employees.remove);
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Id<"employees"> | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({
    userId: "" as string,
    employeeId: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    phone: "",
    address: "",
  });

  const [editForm, setEditForm] = useState({
    department: "",
    designation: "",
    phone: "",
    address: "",
    status: "active" as "active" | "inactive" | "terminated",
  });

  if (employees === undefined || allUsers === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const assignedUserIds = new Set(employees.map((e) => e.userId));
  const unassignedUsers = allUsers.filter((u) => !assignedUserIds.has(u._id));

  const filteredEmployees =
    filterStatus === "all"
      ? employees
      : employees.filter((e) => e.status === filterStatus);

  const handleCreate = async () => {
    try {
      await createEmployee({
        userId: form.userId as Id<"users">,
        employeeId: form.employeeId,
        department: form.department,
        designation: form.designation,
        dateOfJoining: form.dateOfJoining,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      toast({ title: "Employee created successfully", variant: "success" });
      setIsCreateOpen(false);
      setForm({ userId: "", employeeId: "", department: "", designation: "", dateOfJoining: "", phone: "", address: "" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleEdit = (emp: (typeof employees)[0]) => {
    setEditingEmployee(emp._id);
    setEditForm({
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone ?? "",
      address: emp.address ?? "",
      status: emp.status,
    });
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;
    try {
      await updateEmployee({
        id: editingEmployee,
        department: editForm.department,
        designation: editForm.designation,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        status: editForm.status,
      });
      toast({ title: "Employee updated successfully", variant: "success" });
      setEditingEmployee(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleRemove = async (id: Id<"employees">) => {
    try {
      await removeEmployee({ id });
      toast({ title: "Employee deactivated", variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "success" as const;
      case "inactive": return "warning" as const;
      case "terminated": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label>Filter:</Label>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell className="font-mono">{emp.employeeId}</TableCell>
                  <TableCell className="font-medium">
                    {emp.user?.firstName} {emp.user?.lastName}
                  </TableCell>
                  <TableCell>{emp.user?.email}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(emp.status)}>{emp.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {emp.status === "active" && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(emp._id)}>
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User Account</Label>
              <Select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select a user...</option>
                {unassignedUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input placeholder="EMP-001" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div>
              <Label>Department</Label>
              <Input placeholder="Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <Label>Designation</Label>
              <Input placeholder="Software Engineer" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <Label>Date of Joining</Label>
              <Input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="+1234567890" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input placeholder="123 Main St" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.userId || !form.employeeId || !form.department || !form.designation || !form.dateOfJoining}>
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department</Label>
              <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" | "terminated" })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
