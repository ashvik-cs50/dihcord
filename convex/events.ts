import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, requireMember, canModerate, tokenField } from "./helpers";
import type { Id } from "./_generated/dataModel";

export const createServerEvent = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    name: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can create server events");
    }
    if (args.name.length < 2 || args.name.length > 100) {
      throw new Error("Event name must be 2-100 characters");
    }
    if (args.startsAt <= Date.now()) {
      throw new Error("Event must start in the future");
    }
    return await ctx.db.insert("serverEvents", {
      serverId: args.serverId,
      creatorId: user._id,
      name: args.name.trim(),
      description: args.description?.trim(),
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      location: args.location?.trim(),
      createdAt: Date.now(),
    });
  },
});

export const listServerEvents = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireMember(ctx.db, args.token, args.serverId);
    const events = await ctx.db
      .query("serverEvents")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .order("asc")
      .take(50);
    return events.map((e) => ({
      _id: e._id,
      name: e.name,
      description: e.description,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      location: e.location,
      createdAt: e.createdAt,
    }));
  },
});