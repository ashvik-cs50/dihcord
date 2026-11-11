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
    const myMemberships = await ctx.db
      .query("dmMembers")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      myMemberships.map(async (m) => {
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
