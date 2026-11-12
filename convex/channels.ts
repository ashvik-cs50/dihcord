import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireMember, canModerate, requireChannelAccess, tokenField } from "./helpers";

const normalizeName = (name: string, type: "text" | "voice") => {
  let n = name.trim();
  if (type === "text") {
    n = n.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  }
  return n;
};

export const listByServer = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { user } = await requireMember(ctx.db, args.token, args.serverId);
    const hidden = await ctx.db
      .query("hiddenChats")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const hiddenChannelIds = new Set(hidden.map((h) => h.channelId));
    const channels = await ctx.db
      .query("channels")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    return channels
      .filter((c) => !hiddenChannelIds.has(c._id))
      .sort(
      (a, b) =>
        (a.category ?? "").localeCompare(b.category ?? "") ||
        (a.position ?? 0) - (b.position ?? 0) ||
        a.name.localeCompare(b.name),
    );
  },
});

export const getChannel = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const { channel } = await requireChannelAccess(ctx.db, args.token, args.channelId);
    return {
      _id: channel._id,
      serverId: channel.serverId,
      name: channel.name,
      type: channel.type,
      category: channel.category,
      createdAt: channel.createdAt,
    };
  },
});

export const create = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can create channels");
    }
    const name = normalizeName(args.name, args.type);
    if (name.length < 1 || name.length > 32) {
      throw new Error("Channel name must be 1-32 characters");
    }
    const existing = await ctx.db
      .query("channels")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .filter((q) =>
        q.and(q.eq(q.field("name"), name), q.eq(q.field("type"), args.type)),
      )
      .first();
    if (existing) throw new Error("A channel with that name already exists");

    const siblings = await ctx.db
      .query("channels")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
    const position =
      siblings.reduce((max, c) => Math.max(max, c.position ?? 0), -1) + 1;
    return await ctx.db.insert("channels", {
      serverId: args.serverId,
      name,
      type: args.type,
      category: args.category || undefined,
      position,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    ...tokenField,
    channelId: v.id("channels"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel || !channel.serverId) throw new Error("Channel not found");
    const { membership } = await requireMember(ctx.db, args.token, channel.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can edit channels");
    }
    const patch: { name?: string; category?: string } = {};
    if (args.name !== undefined) {
      const name = normalizeName(args.name, channel.type === "text" ? "text" : "voice");
      if (name.length < 1 || name.length > 32) {
        throw new Error("Channel name must be 1-32 characters");
      }
      patch.name = name;
    }
    if (args.category !== undefined) {
      patch.category = args.category.trim().toUpperCase().slice(0, 32) || undefined;
    }
    await ctx.db.patch(args.channelId, patch);
  },
});

export const remove = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel || !channel.serverId) throw new Error("Channel not found");
    const { membership } = await requireMember(ctx.db, args.token, channel.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can delete channels");
    }
    await cleanupChannel(ctx.db, args.channelId);
    await ctx.db.delete(args.channelId);
  },
});

export const listHiddenServerChannels = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { user } = await requireMember(ctx.db, args.token, args.serverId);
    const hidden = await ctx.db
      .query("hiddenChats")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const hiddenChannelIds = new Set(hidden.map((h) => h.channelId));
    const channels = await ctx.db
      .query("channels")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    return channels
      .filter((c) => hiddenChannelIds.has(c._id))
      .map((c) => ({ _id: c._id, name: c.name, type: c.type }));
  },
});

export const cleanupChannel = async (db: MutationCtx["db"], channelId: Id<"channels">) => {
  const messages = await db
    .query("messages")
    .withIndex("byChannelCreated", (q) => q.eq("channelId", channelId))
    .collect();
  for (const message of messages) {
    const reactions = await db
      .query("reactions")
      .withIndex("byMessage", (q) => q.eq("messageId", message._id))
      .collect();
    for (const r of reactions) await db.delete(r._id);
    await db.delete(message._id);
  }
  const typing = await db
    .query("typing")
    .withIndex("byChannel", (q) => q.eq("channelId", channelId))
    .collect();
  for (const t of typing) await db.delete(t._id);
  const dmMembers = await db
    .query("dmMembers")
    .withIndex("byChannel", (q) => q.eq("channelId", channelId))
    .collect();
  for (const m of dmMembers) await db.delete(m._id);
  const readStates = await db
    .query("readStates")
    .filter((q) => q.eq(q.field("channelId"), channelId))
    .collect();
  for (const rs of readStates) await db.delete(rs._id);
  const hidden = await db
    .query("hiddenChats")
    .filter((q) => q.eq(q.field("channelId"), channelId))
    .collect();
  for (const h of hidden) await db.delete(h._id);
};
