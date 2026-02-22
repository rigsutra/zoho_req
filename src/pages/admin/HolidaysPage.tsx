import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";

export function HolidaysPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");

  const holidays = useQuery(api.holidays.listAll, {
    location: locationFilter || undefined,
  });
  const locations = useQuery(api.holidays.getLocations);
  const removeHoliday = useMutation(api.holidays.remove);
  const { toast } = useToast();

  const handleDelete = async (id: Id<"holidays">) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      await removeHoliday({ holidayId: id });
      toast({ title: "Holiday deleted successfully", variant: "success" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Holidays</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Holiday
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holidays</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Filter by location:</Label>
              <Select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-48"
              >
                <option value="">All Locations</option>
                {locations?.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {holidays === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : holidays.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No holidays found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <TableRow key={holiday._id}>
                      <TableCell className="font-medium">
                        {holiday.name}
                      </TableCell>
                      <TableCell>
                        {new Date(holiday.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(holiday.date).toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </TableCell>
                      <TableCell>
                        {holiday.location ? (
                          <Badge variant="outline">{holiday.location}</Badge>
                        ) : (
                          <Badge variant="secondary">All Locations</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {holiday.description || "—"}
                      </TableCell>
                      <TableCell>
                        {holiday.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingHoliday(holiday)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(holiday._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <HolidayFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        locations={locations || []}
      />

      {editingHoliday && (
        <HolidayFormDialog
          open={!!editingHoliday}
          onOpenChange={(open) => !open && setEditingHoliday(null)}
          holiday={editingHoliday}
          locations={locations || []}
        />
      )}
    </div>
  );
}

function HolidayFormDialog({
  open,
  onOpenChange,
  holiday,
  locations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: any;
  locations: string[];
}) {
  const createHoliday = useMutation(api.holidays.create);
  const updateHoliday = useMutation(api.holidays.update);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: holiday?.name || "",
    date: holiday?.date || "",
    description: holiday?.description || "",
    location: holiday?.location || "",
    isActive: holiday?.isActive ?? true,
  });

  const handleSubmit = async () => {
    try {
      if (holiday) {
        await updateHoliday({
          holidayId: holiday._id,
          name: form.name,
          date: form.date,
          description: form.description,
          location: form.location,
          isActive: form.isActive,
        });
        toast({ title: "Holiday updated successfully", variant: "success" });
      } else {
        await createHoliday({
          name: form.name,
          date: form.date,
          description: form.description,
          location: form.location,
        });
        toast({ title: "Holiday created successfully", variant: "success" });
      }
      onOpenChange(false);
      setForm({
        name: "",
        date: "",
        description: "",
        location: "",
        isActive: true,
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {holiday ? "Edit Holiday" : "Add New Holiday"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Holiday Name</Label>
            <Input
              placeholder="e.g., Independence Day"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <Label>Location (Department)</Label>
            <Select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to apply to all locations
            </p>
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Additional details about this holiday..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {holiday && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.date}>
            {holiday ? "Update" : "Create"} Holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
