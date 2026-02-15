import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentEmployee } from "./helpers";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const employees = await ctx.db.query("employees").collect();
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const user = await ctx.db.get(emp.userId);
        return { ...emp, user };
      })
    );
    return enriched;
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("terminated")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const user = await ctx.db.get(emp.userId);
        return { ...emp, user };
      })
    );
    return enriched;
  },
});

export const getById = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");
    const user = await ctx.db.get(employee.userId);
    return { ...employee, user };
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    employeeId: v.string(),
    department: v.string(),
    designation: v.string(),
    dateOfJoining: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newEmpId = await ctx.db.insert("employees", {
      ...args,
      status: "active",
    });
    const currentYear = new Date().getFullYear();
    const leaveTypes = await ctx.db
      .query("leaveTypes")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    for (const lt of leaveTypes) {
      await ctx.db.insert("leaveBalances", {
        employeeId: newEmpId,
        leaveTypeId: lt._id,
        year: currentYear,
        totalAllocation: lt.defaultBalance,
        used: 0,
        carriedForward: 0,
      });
    }
    return newEmpId;
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("terminated")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: "terminated" });
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const { user, employee } = await getCurrentEmployee(ctx);
    let manager = null;
    if (employee.managerId) {
      const mgrEmployee = await ctx.db.get(employee.managerId);
      if (mgrEmployee) {
        manager = await ctx.db.get(mgrEmployee.userId);
      }
    }
    return { user, employee, manager };
  },
});

export const getTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    const { employee } = await getCurrentEmployee(ctx);
    const teammates = await ctx.db
      .query("employees")
      .withIndex("by_department", (q) =>
        q.eq("department", employee.department)
      )
      .collect();
    const enriched = await Promise.all(
      teammates
        .filter((t) => t._id !== employee._id && t.status === "active")
        .map(async (t) => {
          const user = await ctx.db.get(t.userId);
          return { ...t, user };
        })
    );
    return enriched;
  },
});

export const getAllDepartments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const employees = await ctx.db.query("employees").collect();
    const departments = [...new Set(employees.map((e) => e.department))];
    return departments;
  },
});
