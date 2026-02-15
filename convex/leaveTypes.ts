import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db
      .query("leaveTypes")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("leaveTypes").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    defaultBalance: v.number(),
    isPaid: v.boolean(),
    carryForward: v.boolean(),
    maxCarryForward: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("leaveTypes", {
      ...args,
      isActive: true,
    });
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("leaveTypes").first();
    if (existing) return;
    const defaults = [
      {
        name: "Casual Leave",
        code: "CL",
        description: "For personal/casual reasons",
        defaultBalance: 12,
        isPaid: true,
        isActive: true,
        carryForward: false,
      },
      {
        name: "Sick Leave",
        code: "SL",
        description: "For illness or medical reasons",
        defaultBalance: 12,
        isPaid: true,
        isActive: true,
        carryForward: false,
      },
      {
        name: "Earned Leave",
        code: "EL",
        description: "Earned/privilege leave",
        defaultBalance: 15,
        isPaid: true,
        isActive: true,
        carryForward: true,
        maxCarryForward: 10,
      },
      {
        name: "Loss of Pay",
        code: "LOP",
        description: "Unpaid leave",
        defaultBalance: 0,
        isPaid: false,
        isActive: true,
        carryForward: false,
      },
      {
        name: "Compensatory Off",
        code: "CO",
        description: "For extra working days",
        defaultBalance: 0,
        isPaid: true,
        isActive: true,
        carryForward: false,
      },
    ];
    for (const lt of defaults) {
      await ctx.db.insert("leaveTypes", lt);
    }
  },
});
