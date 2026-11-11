import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, tokenField } from "./helpers";

export const listMine = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return Promise.all(
      notifications.map(async (n) => {
        const actor = await ctx.db.get(n.actorId);
        return {
          _id: n._id,
          type: n.type,
          actor: actor
            ? {
                _id: actor._id,
                username: actor.username,
                displayName: actor.displayName,
                avatarStorageId: actor.avatarStorageId,
                accentColor: actor.accentColor,
                avatarUrl: actor.avatarStorageId
                  ? await ctx.storage.getUrl(actor.avatarStorageId)
                  : null,
              }
            : null,
          serverId: n.serverId,
          channelId: n.channelId,
          messageId: n.messageId,
          serverName: n.serverName,
          channelName: n.channelName,
          read: n.read,
          createdAt: n.createdAt,
        };
      }),
    );
  },
});

export const unreadCount = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("byUserRead", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();
    return unread.length;
  },
});

export const unreadChannelCounts = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const states = await ctx.db
      .query("readStates")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const counts: Record<string, number> = {};
    for (const state of states) {
      if (state.unread > 0) counts[state.channelId] = state.unread;
    }
    return counts;
  },
});

export const markRead = mutation({
  args: { ...tokenField, notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }
    if (!notification.read) {
      await ctx.db.patch(args.notificationId, { read: true });
    }
  },
});

export const markAllRead = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("byUserRead", (q) =>
        q.eq("userId", user._id).eq("read", false),
      )
      .collect();
    for (const n of unread) await ctx.db.patch(n._id, { read: true });
  },
});
