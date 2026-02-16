import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, getCurrentEmployee } from "./helpers";

// Admin: Create a new holiday
export const create = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    
    return await ctx.db.insert("holidays", {
      name: args.name,
      date: args.date,
      description: args.description,
      location: args.location || "", // Empty string means all locations
      isActive: true,
      createdBy: admin._id,
      createdAt: new Date().toISOString(),
    });
  },
});

// Admin: Update a holiday
export const update = mutation({
  args: {
    holidayId: v.id("holidays"),
    name: v.string(),
    date: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.holidayId, {
      name: args.name,
      date: args.date,
      description: args.description,
      location: args.location || "",
      isActive: args.isActive,
    });
  },
});

// Admin: Delete (soft delete by marking inactive) a holiday
export const remove = mutation({
  args: {
    holidayId: v.id("holidays"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.holidayId);
  },
});

// Admin: Get all holidays
export const listAll = query({
  args: {
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const holidays = await ctx.db.query("holidays").collect();
    
    // Filter by location if specified
    if (args.location) {
      return holidays.filter(
        h => h.location === "" || h.location === args.location
      );
    }
    
    return holidays;
  },
});

// Employee: Get upcoming holidays (based on employee's location/department)
export const getUpcoming = query({
  args: {
    fromDate: v.optional(v.string()), // Defaults to today
    limit: v.optional(v.number()), // Limit number of results
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const fromDate = args.fromDate || new Date().toISOString().split("T")[0]!;
    
    // Get employee's location (department can be used as location)
    const employeeLocation = employee.department;
    
    // Get holidays that apply to this employee's location or all locations
    const allHolidays = await ctx.db
      .query("holidays")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    
    const applicableHolidays = allHolidays
      .filter(h => 
        (h.location === "" || h.location === employeeLocation) &&
        h.date >= fromDate
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return args.limit ? applicableHolidays.slice(0, args.limit) : applicableHolidays;
  },
});

// Employee: Get all holidays for the year
export const getForYear = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const { employee } = await getCurrentEmployee(ctx);
    const employeeLocation = employee.department;
    
    const startDate = `${args.year}-01-01`;
    const endDate = `${args.year}-12-31`;
    
    const allHolidays = await ctx.db
      .query("holidays")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    
    return allHolidays
      .filter(h => 
        (h.location === "" || h.location === employeeLocation) &&
        h.date >= startDate &&
        h.date <= endDate
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get all unique locations from employees (for admin to filter)
export const getLocations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const employees = await ctx.db.query("employees").collect();
    const locations = new Set(employees.map(e => e.department));
    
    return Array.from(locations).sort();
  },
});
