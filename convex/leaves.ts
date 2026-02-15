import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentUser, getCurrentEmployee } from "./helpers";

export const apply = mutation({
  args: {
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.string(),
    endDate: v.string(),
    numberOfDays: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);

    const year = new Date(args.startDate).getFullYear();
    const balance = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_leaveType_year", (q) =>
        q
          .eq("employeeId", employee._id)
          .eq("leaveTypeId", args.leaveTypeId)
          .eq("year", year)
      )
      .unique();

    if (balance) {
      const available = balance.totalAllocation + balance.carriedForward - balance.used;
      const leaveType = await ctx.db.get(args.leaveTypeId);
      if (leaveType && leaveType.code !== "LOP" && args.numberOfDays > available) {
        throw new Error(
          `Insufficient leave balance. Available: ${available}, Requested: ${args.numberOfDays}`
        );
      }
    }

    const existingLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employeeId_status", (q) =>
        q.eq("employeeId", employee._id).eq("status", "pending")
      )
      .collect();
    const approvedLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employeeId_status", (q) =>
        q.eq("employeeId", employee._id).eq("status", "approved")
      )
      .collect();
    const allActive = [...existingLeaves, ...approvedLeaves];

    for (const leave of allActive) {
      if (args.startDate <= leave.endDate && args.endDate >= leave.startDate) {
        throw new Error("Overlapping leave request exists");
      }
    }

    return await ctx.db.insert("leaveRequests", {
      employeeId: employee._id,
      leaveTypeId: args.leaveTypeId,
      startDate: args.startDate,
      endDate: args.endDate,
      numberOfDays: args.numberOfDays,
      reason: args.reason,
      status: "pending",
      appliedOn: new Date().toISOString(),
    });
  },
});

export const cancel = mutation({
  args: { leaveRequestId: v.id("leaveRequests") },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const request = await ctx.db.get(args.leaveRequestId);
    if (!request) throw new Error("Leave request not found");
    if (request.employeeId !== employee._id) throw new Error("Unauthorized");
    if (request.status !== "pending")
      throw new Error("Can only cancel pending requests");

    await ctx.db.patch(args.leaveRequestId, { status: "cancelled" });
  },
});

export const getMyRequests = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const requests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employee._id))
      .order("desc")
      .collect();
    const year = args.year ?? new Date().getFullYear();
    const filtered = requests.filter((r) =>
      r.startDate.startsWith(String(year))
    );
    const enriched = await Promise.all(
      filtered.map(async (r) => {
        const leaveType = await ctx.db.get(r.leaveTypeId);
        return { ...r, leaveType };
      })
    );
    return enriched;
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const requests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const emp = await ctx.db.get(r.employeeId);
        const user = emp ? await ctx.db.get(emp.userId) : null;
        const leaveType = await ctx.db.get(r.leaveTypeId);
        return { ...r, employee: emp, user, leaveType };
      })
    );
    return enriched;
  },
});

export const getAllRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let requests;
    if (
      args.status &&
      ["pending", "approved", "rejected", "cancelled"].includes(args.status)
    ) {
      requests = await ctx.db
        .query("leaveRequests")
        .withIndex("by_status", (q) =>
          q.eq(
            "status",
            args.status as "pending" | "approved" | "rejected" | "cancelled"
          )
        )
        .collect();
    } else {
      requests = await ctx.db.query("leaveRequests").collect();
    }
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const emp = await ctx.db.get(r.employeeId);
        const user = emp ? await ctx.db.get(emp.userId) : null;
        const leaveType = await ctx.db.get(r.leaveTypeId);
        return { ...r, employee: emp, user, leaveType };
      })
    );
    return enriched;
  },
});

export const approve = mutation({
  args: {
    leaveRequestId: v.id("leaveRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(args.leaveRequestId);
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending")
      throw new Error("Only pending requests can be approved");

    const year = new Date(request.startDate).getFullYear();
    const balance = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_leaveType_year", (q) =>
        q
          .eq("employeeId", request.employeeId)
          .eq("leaveTypeId", request.leaveTypeId)
          .eq("year", year)
      )
      .unique();

    if (balance) {
      await ctx.db.patch(balance._id, {
        used: balance.used + request.numberOfDays,
      });
    }

    await ctx.db.patch(args.leaveRequestId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedOn: new Date().toISOString(),
      reviewNotes: args.notes,
    });
  },
});

export const reject = mutation({
  args: {
    leaveRequestId: v.id("leaveRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(args.leaveRequestId);
    if (!request) throw new Error("Leave request not found");
    if (request.status !== "pending")
      throw new Error("Only pending requests can be rejected");

    await ctx.db.patch(args.leaveRequestId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedOn: new Date().toISOString(),
      reviewNotes: args.notes,
    });
  },
});

export const getApprovedForCalendar = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const requests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const filtered = requests.filter(
      (r) => r.endDate >= args.startDate && r.startDate <= args.endDate
    );

    const enriched = await Promise.all(
      filtered.map(async (r) => {
        const emp = await ctx.db.get(r.employeeId);
        const user = emp ? await ctx.db.get(emp.userId) : null;
        const leaveType = await ctx.db.get(r.leaveTypeId);
        return { ...r, employee: emp, user, leaveType };
      })
    );
    return enriched;
  },
});

export const getTeamOnLeaveThisWeek = query({
  args: {},
  handler: async (ctx) => {
    const { employee } = await getCurrentEmployee(ctx);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = monday.toISOString().split("T")[0]!;
    const weekEnd = sunday.toISOString().split("T")[0]!;

    const approved = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const thisWeek = approved.filter(
      (r) => r.endDate >= weekStart && r.startDate <= weekEnd
    );

    const enriched = [];
    for (const r of thisWeek) {
      const emp = await ctx.db.get(r.employeeId);
      if (
        emp &&
        emp.department === employee.department &&
        emp._id !== employee._id
      ) {
        const user = await ctx.db.get(emp.userId);
        const leaveType = await ctx.db.get(r.leaveTypeId);
        enriched.push({ ...r, employee: emp, user, leaveType });
      }
    }
    return enriched;
  },
});
