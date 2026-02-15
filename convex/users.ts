import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./helpers";

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      ...args,
      role: "employee",
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await getCurrentUser(ctx);
    } catch {
      return null;
    }
  },
});

export const getMeWithEmployee = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      const employee = await ctx.db
        .query("employees")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      return { user, employee };
    } catch {
      return null;
    }
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    if (admin.role !== "admin") throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getCurrentUser(ctx);
    if (admin.role !== "admin") throw new Error("Unauthorized");
    return await ctx.db.query("users").collect();
  },
});
