import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("employee")),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  employees: defineTable({
    userId: v.id("users"),
    employeeId: v.string(),
    department: v.string(),
    designation: v.string(),
    dateOfJoining: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("terminated")
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_department", ["department"])
    .index("by_managerId", ["managerId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_status", ["status"]),

  attendance: defineTable({
    employeeId: v.id("employees"),
    date: v.string(),
    checkInTime: v.string(),
    checkOutTime: v.optional(v.string()),
    checkInLocation: v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.number(),
    }),
    checkOutLocation: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        accuracy: v.number(),
      })
    ),
    totalHours: v.optional(v.number()),
    status: v.union(
      v.literal("present"),
      v.literal("half-day"),
      v.literal("absent")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_date", ["date"])
    .index("by_employeeId_date", ["employeeId", "date"]),

  leaveTypes: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    defaultBalance: v.number(),
    isPaid: v.boolean(),
    isActive: v.boolean(),
    carryForward: v.boolean(),
    maxCarryForward: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  leaveBalances: defineTable({
    employeeId: v.id("employees"),
    leaveTypeId: v.id("leaveTypes"),
    year: v.number(),
    totalAllocation: v.number(),
    used: v.number(),
    carriedForward: v.number(),
  })
    .index("by_employeeId_year", ["employeeId", "year"])
    .index("by_employeeId_leaveType_year", [
      "employeeId",
      "leaveTypeId",
      "year",
    ]),

  leaveRequests: defineTable({
    employeeId: v.id("employees"),
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.string(),
    endDate: v.string(),
    numberOfDays: v.number(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    appliedOn: v.string(),
    reviewedBy: v.optional(v.id("users")),
    reviewedOn: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_employeeId_status", ["employeeId", "status"])
    .index("by_startDate", ["startDate"]),
});
