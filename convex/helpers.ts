import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found in database");
  }
  return user;
}

export async function getCurrentEmployee(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  const employee = await ctx.db
    .query("employees")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique();
  if (!employee) {
    throw new Error("Employee record not found");
  }
  return { user, employee };
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return user;
}
