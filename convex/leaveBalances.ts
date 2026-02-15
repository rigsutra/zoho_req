import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentEmployee } from "./helpers";

export const getMyBalances = query({
  args: {},
  handler: async (ctx) => {
    const { employee } = await getCurrentEmployee(ctx);
    const year = new Date().getFullYear();
    const balances = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_year", (q) =>
        q.eq("employeeId", employee._id).eq("year", year)
      )
      .collect();
    const enriched = await Promise.all(
      balances.map(async (bal) => {
        const leaveType = await ctx.db.get(bal.leaveTypeId);
        const available = bal.totalAllocation + bal.carriedForward - bal.used;
        return { ...bal, leaveType, available };
      })
    );
    return enriched;
  },
});

export const getByEmployee = query({
  args: {
    employeeId: v.id("employees"),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const year = args.year ?? new Date().getFullYear();
    const balances = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employeeId_year", (q) =>
        q.eq("employeeId", args.employeeId).eq("year", year)
      )
      .collect();
    const enriched = await Promise.all(
      balances.map(async (bal) => {
        const leaveType = await ctx.db.get(bal.leaveTypeId);
        const available = bal.totalAllocation + bal.carriedForward - bal.used;
        return { ...bal, leaveType, available };
      })
    );
    return enriched;
  },
});

export const resetForNewYear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const newYear = new Date().getFullYear();
    const previousYear = newYear - 1;
    const leaveTypes = await ctx.db
      .query("leaveTypes")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const prevBalance = await ctx.db
          .query("leaveBalances")
          .withIndex("by_employeeId_leaveType_year", (q) =>
            q
              .eq("employeeId", emp._id)
              .eq("leaveTypeId", lt._id)
              .eq("year", previousYear)
          )
          .unique();

        let carriedForward = 0;
        if (lt.carryForward && prevBalance) {
          const remaining =
            prevBalance.totalAllocation +
            prevBalance.carriedForward -
            prevBalance.used;
          carriedForward = lt.maxCarryForward
            ? Math.min(remaining, lt.maxCarryForward)
            : Math.max(remaining, 0);
        }

        await ctx.db.insert("leaveBalances", {
          employeeId: emp._id,
          leaveTypeId: lt._id,
          year: newYear,
          totalAllocation: lt.defaultBalance,
          used: 0,
          carriedForward: Math.max(carriedForward, 0),
        });
      }
    }
  },
});
