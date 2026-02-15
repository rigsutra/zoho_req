import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentEmployee } from "./helpers";

export const checkIn = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const now = new Date();
    const today = now.toISOString().split("T")[0]!;

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId_date", (q) =>
        q.eq("employeeId", employee._id).eq("date", today)
      )
      .unique();

    if (existing) {
      throw new Error("Already checked in today");
    }

    return await ctx.db.insert("attendance", {
      employeeId: employee._id,
      date: today,
      checkInTime: now.toISOString(),
      checkInLocation: {
        latitude: args.latitude,
        longitude: args.longitude,
        accuracy: args.accuracy,
      },
      status: "present",
    });
  },
});

export const checkOut = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const today = new Date().toISOString().split("T")[0]!;

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId_date", (q) =>
        q.eq("employeeId", employee._id).eq("date", today)
      )
      .unique();

    if (!record) throw new Error("No check-in found for today");
    if (record.checkOutTime) throw new Error("Already checked out today");

    const checkOutTime = new Date();
    const checkInTime = new Date(record.checkInTime);
    const totalHours =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    const status = totalHours < 4 ? "half-day" : "present";

    await ctx.db.patch(record._id, {
      checkOutTime: checkOutTime.toISOString(),
      checkOutLocation: {
        latitude: args.latitude,
        longitude: args.longitude,
        accuracy: args.accuracy,
      },
      totalHours: Math.round(totalHours * 100) / 100,
      status,
    });
  },
});

export const getTodayStatus = query({
  args: {},
  handler: async (ctx) => {
    const { employee } = await getCurrentEmployee(ctx);
    const today = new Date().toISOString().split("T")[0]!;
    return await ctx.db
      .query("attendance")
      .withIndex("by_employeeId_date", (q) =>
        q.eq("employeeId", employee._id).eq("date", today)
      )
      .unique();
  },
});

export const getMyHistory = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", employee._id))
      .collect();
    return records.filter(
      (r) => r.date >= args.startDate && r.date <= args.endDate
    );
  },
});

export const getAllByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    const enriched = await Promise.all(
      records.map(async (rec) => {
        const emp = await ctx.db.get(rec.employeeId);
        const user = emp ? await ctx.db.get(emp.userId) : null;
        return { ...rec, employee: emp, user };
      })
    );
    return enriched;
  },
});

export const getByEmployee = query({
  args: {
    employeeId: v.id("employees"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    return records.filter(
      (r) => r.date >= args.startDate && r.date <= args.endDate
    );
  },
});
