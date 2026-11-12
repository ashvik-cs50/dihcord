import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { validateTokenWrite, validateTokenRead, tokenField } from "./helpers";

const pairKeyFor = (a: Id<"users">, b: Id<"users">) =>
  a < b ? `${a}|${b}` : `${b}|${a}`;

export const open = mutation({
  args: { ...tokenField, userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    if (user._id === args.userId) throw new Error("You cannot DM yourself");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    const key = pairKeyFor(user._id, args.userId);
    const existing = await ctx.db
      .query("channels")
      .withIndex("pairKey", (q) => q.eq("pairKey", key))
      .unique();
    if (existing) return existing._id;

    const channelId = await ctx.db.insert("channels", {
      name: `dm-${key.slice(0, 8)}`,
      type: "dm",
      pairKey: key,
      createdAt: Date.now(),
    });
    await ctx.db.insert("dmMembers", { channelId, userId: user._id });
    await ctx.db.insert("dmMembers", { channelId, userId: args.userId });
    return channelId;
  },
});

export const getParticipants = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const members = await ctx.db
      .query("dmMembers")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .collect();
    return Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          membershipId: m._id,
          userId: user._id,
          role: "member" as const,
          joinedAt: user.createdAt,
          username: user.username,
          displayName: user.displayName,
          avatarStorageId: user.avatarStorageId,
          avatarUrl: user.avatarStorageId
            ? await ctx.storage.getUrl(user.avatarStorageId)
            : null,
          accentColor: user.accentColor,
          status: user.status,
          customStatus: user.customStatus,
          lastSeenAt: user.lastSeenAt,
        };
      }),
    );
  },
});

export const listMine = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const hidden = await ctx.db
      .query("hiddenChats")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const hiddenChannelIds = new Set(hidden.map((h) => h.channelId));
    const myMemberships = await ctx.db
      .query("dmMembers")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      myMemberships
        .filter((m) => !hiddenChannelIds.has(m.channelId))
        .map(async (m) => {
        const channel = await ctx.db.get(m.channelId);
        if (!channel) return null;
        const members = await ctx.db
          .query("dmMembers")
          .withIndex("byChannel", (q) => q.eq("channelId", m.channelId))
          .collect();
        const other = members.find((x) => x.userId !== user._id);
        const otherUser = other ? await ctx.db.get(other.userId) : null;
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("byChannelCreated", (q) => q.eq("channelId", m.channelId))
          .order("desc")
          .first();
        const readState = await ctx.db
          .query("readStates")
          .withIndex("byUserChannel", (q) =>
            q.eq("userId", user._id).eq("channelId", m.channelId),
          )
          .unique();
        return {
          channelId: channel._id,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                username: otherUser.username,
                displayName: otherUser.displayName,
                avatarStorageId: otherUser.avatarStorageId,
                accentColor: otherUser.accentColor,
                status: otherUser.status,
                lastSeenAt: otherUser.lastSeenAt,
                avatarUrl: otherUser.avatarStorageId
                  ? await ctx.storage.getUrl(otherUser.avatarStorageId)
                  : null,
              }
            : null,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                authorId: lastMessage.authorId,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unread: readState?.unread ?? 0,
        };
      }),
    );
  },
});

export const listHiddenChats = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const hidden = await ctx.db
      .query("hiddenChats")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    if (hidden.length === 0) return [];
    const hiddenChannelIds = new Set(hidden.map((h) => h.channelId));
    const myMemberships = await ctx.db
      .query("dmMembers")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      myMemberships
        .filter((m) => hiddenChannelIds.has(m.channelId))
        .map(async (m) => {
          const channel = await ctx.db.get(m.channelId);
          if (!channel) return null;
          const members = await ctx.db
            .query("dmMembers")
            .withIndex("byChannel", (q) => q.eq("channelId", m.channelId))
            .collect();
          const other = members.find((x) => x.userId !== user._id);
          const otherUser = other ? await ctx.db.get(other.userId) : null;
          const lastMessage = await ctx.db
            .query("messages")
            .withIndex("byChannelCreated", (q) => q.eq("channelId", m.channelId))
            .order("desc")
            .first();
          const readState = await ctx.db
            .query("readStates")
            .withIndex("byUserChannel", (q) =>
              q.eq("userId", user._id).eq("channelId", m.channelId),
            )
            .unique();
          return {
            channelId: channel._id,
            otherUser: otherUser
              ? {
                  _id: otherUser._id,
                  username: otherUser.username,
                  displayName: otherUser.displayName,
                  avatarStorageId: otherUser.avatarStorageId,
                  defaultAvatarKey: otherUser.defaultAvatarKey,
                  accentColor: otherUser.accentColor,
                  status: otherUser.status,
                  lastSeenAt: otherUser.lastSeenAt,
                  avatarUrl: otherUser.avatarStorageId
                    ? await ctx.storage.getUrl(otherUser.avatarStorageId)
                    : null,
                }
              : null,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  authorId: lastMessage.authorId,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            unread: readState?.unread ?? 0,
            hidden: true,
          };
        }),
    );
  },
});

export const deleteDm = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await validateTokenWrite(ctx.db, args.token);
    const { channel } = await requireChannelAccess(ctx.db, args.token, args.channelId);
    if (channel.type !== "dm") throw new Error("Not a direct message");
    const hidden = await ctx.db
      .query("hiddenChats")
      .filter((q) => q.eq(q.field("channelId"), args.channelId))
      .collect();
    for (const h of hidden) await ctx.db.delete(h._id);
    await cleanupChannel(ctx.db, args.channelId);
    await ctx.db.delete(args.channelId);
  },
});

export const toggleHiddenChat = mutation({
  args: { ...tokenField, channelId: v.id("channels"), hidden: v.boolean() },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    if (args.hidden) {
      const existing = await ctx.db
        .query("hiddenChats")
        .withIndex("byUserAndChannel", (q) =>
          q.eq("userId", user._id).eq("channelId", args.channelId),
        )
        .unique();
      if (existing) return existing._id;
      return await ctx.db.insert("hiddenChats", {
        userId: user._id,
        channelId: args.channelId,
        hiddenAt: Date.now(),
      });
    }
    const existing = await ctx.db
      .query("hiddenChats")
      .withIndex("byUserAndChannel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
