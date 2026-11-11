import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, requireMember, canModerate, tokenField } from "./helpers";

export const logModerationAction = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    action: v.string(),
    targetUserId: v.optional(v.id("users")),
    reason: v.optional(v.string()),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can log moderation actions");
    }
    const user = await validateTokenWrite(ctx.db, args.token);
    return await ctx.db.insert("moderationLogs", {
      serverId: args.serverId,
      actorId: user._id,
      targetUserId: args.targetUserId,
      action: args.action,
      reason: args.reason,
      channelId: args.channelId,
      createdAt: Date.now(),
    });
  },
});

export const listModerationLogs = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can view moderation logs");
    }
    const logs = await ctx.db
      .query("moderationLogs")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .order("desc")
      .take(100);
    return await Promise.all(
      logs.map(async (l) => {
        const actor = await ctx.db.get(l.actorId);
        const target = l.targetUserId ? await ctx.db.get(l.targetUserId) : null;
        return {
          _id: l._id,
          actor: actor ? { _id: actor._id, username: actor.username, displayName: actor.displayName } : null,
          target: target ? { _id: target._id, username: target.username, displayName: target.displayName } : null,
          action: l.action,
          reason: l.reason,
          channelId: l.channelId,
          createdAt: l.createdAt,
        };
      }),
    );
  },
});

export const blockUser = mutation({
  args: { ...tokenField, blockedId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    if (args.blockedId === user._id) throw new Error("You cannot block yourself");
    const existing = await ctx.db
      .query("blocks")
      .withIndex("byBlockerBlocked", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId),
      )
      .unique();
    if (existing) throw new Error("User already blocked");
    return await ctx.db.insert("blocks", {
      blockerId: user._id,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });
  },
});

export const unblockUser = mutation({
  args: { ...tokenField, blockedId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const block = await ctx.db
      .query("blocks")
      .withIndex("byBlockerBlocked", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId),
      )
      .unique();
    if (!block) throw new Error("User not blocked");
    await ctx.db.delete(block._id);
  },
});

export const listBlockedUsers = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("byBlocker", (q) => q.eq("blockerId", user._id))
      .collect();
    return await Promise.all(
      blocks.map(async (b) => {
        const blocked = await ctx.db.get(b.blockedId);
        return blocked ? { _id: blocked._id, username: blocked.username, displayName: blocked.displayName } : null;
      }),
    );
  },
});