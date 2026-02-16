import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentEmployee } from "./helpers";

// Check in — creates or updates the single daily attendance record,
// and always inserts a location log entry.
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
    const timeISO = now.toISOString();

    // Find existing daily record
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId_date", (q) =>
        q.eq("employeeId", employee._id).eq("date", today)
      )
      .unique();

    if (existing?.isCheckedIn) {
      throw new Error(
        "You are already checked in. Please check out before checking in again."
      );
    }

    let attendanceId;
    if (existing) {
      // Update existing daily record
      await ctx.db.patch(existing._id, {
        lastCheckIn: timeISO,
        isCheckedIn: true,
      });
      attendanceId = existing._id;
    } else {
      // Create new daily record
      attendanceId = await ctx.db.insert("attendance", {
        employeeId: employee._id,
        date: today,
        firstCheckIn: timeISO,
        lastCheckIn: timeISO,
        totalHours: 0,
        status: "present",
        isCheckedIn: true,
      });
    }

    // Insert location log
    await ctx.db.insert("attendanceLogs", {
      attendanceId,
      employeeId: employee._id,
      type: "check-in",
      time: timeISO,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
        accuracy: args.accuracy,
      },
    });
  },
});

// Check out — updates the daily record with hours and inserts a location log.
export const checkOut = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const today = new Date().toISOString().split("T")[0]!;
    const now = new Date();
    const timeISO = now.toISOString();

    const record = await ctx.db
      .query("attendance")
      .withIndex("by_employeeId_date", (q) =>
        q.eq("employeeId", employee._id).eq("date", today)
      )
      .unique();

    if (!record || !record.isCheckedIn) {
      throw new Error("You are not checked in.");
    }

    // Calculate hours for this session (lastCheckIn → now)
    const sessionHours =
      (now.getTime() - new Date(record.lastCheckIn).getTime()) /
      (1000 * 60 * 60);
    const newTotal =
      Math.round((record.totalHours + sessionHours) * 100) / 100;
    const status = newTotal < 4 ? "half-day" : "present";

    await ctx.db.patch(record._id, {
      lastCheckOut: timeISO,
      totalHours: newTotal,
      status,
      isCheckedIn: false,
    });

    // Insert location log
    await ctx.db.insert("attendanceLogs", {
      attendanceId: record._id,
      employeeId: employee._id,
      type: "check-out",
      time: timeISO,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
        accuracy: args.accuracy,
      },
    });
  },
});

// Returns today's single attendance record (or null).
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

// Returns all location logs for a given attendance record.
export const getLogs = query({
  args: { attendanceId: v.id("attendance") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceLogs")
      .withIndex("by_attendanceId", (q) =>
        q.eq("attendanceId", args.attendanceId)
      )
      .collect();
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

// Admin: get logs for any attendance record.
export const getLogsByAttendanceId = query({
  args: { attendanceId: v.id("attendance") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("attendanceLogs")
      .withIndex("by_attendanceId", (q) =>
        q.eq("attendanceId", args.attendanceId)
      )
      .collect();
  },
});
