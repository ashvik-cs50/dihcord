import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  validateTokenWrite,
  validateTokenRead,
  requireMember,
  generateInviteCode,
  canModerate,
  tokenField,
} from "./helpers";

export const create = mutation({
  args: {
    ...tokenField,
    name: v.string(),
    description: v.optional(v.string()),
    iconEmoji: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 60) {
      throw new Error("Server name must be 2-60 characters");
    }
    const serverId = await ctx.db.insert("servers", {
      name,
      description: args.description?.trim().slice(0, 200) || undefined,
      iconEmoji: args.iconEmoji || undefined,
      ownerId: user._id,
      isPublic: args.isPublic,
      inviteCode: generateInviteCode(),
      createdAt: Date.now(),
    });
    await ctx.db.insert("memberships", {
      userId: user._id,
      serverId,
      role: "owner",
      joinedAt: Date.now(),
    });
    await ctx.db.insert("channels", {
      serverId,
      name: "general",
      type: "text",
      category: "TEXT CHANNELS",
      position: 0,
      createdAt: Date.now(),
    });
    await ctx.db.insert("channels", {
      serverId,
      name: "off-topic",
      type: "text",
      category: "TEXT CHANNELS",
      position: 1,
      createdAt: Date.now(),
    });
    await ctx.db.insert("channels", {
      serverId,
      name: "General",
      type: "voice",
      category: "VOICE CHANNELS",
      position: 0,
      createdAt: Date.now(),
    });
    return serverId;
  },
});

export const listMine = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const servers = await Promise.all(
      memberships.map(async (m) => {
        const server = await ctx.db.get(m.serverId);
        if (!server) return null;
        return {
          _id: server._id,
          name: server.name,
          iconEmoji: server.iconEmoji,
          iconStorageId: server.iconStorageId,
          ownerId: server.ownerId,
          role: m.role,
        };
      }),
    );
    return servers.filter(Boolean);
  },
});

export const get = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    const server = await ctx.db.get(args.serverId);
    if (!server) return null;
    return {
      _id: server._id,
      name: server.name,
      description: server.description,
      iconEmoji: server.iconEmoji,
      iconStorageId: server.iconStorageId,
      isPublic: server.isPublic,
      inviteCode: server.inviteCode,
      ownerId: server.ownerId,
      createdAt: server.createdAt,
      myRole: membership.role,
    };
  },
});

export const explore = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const publicServers = await ctx.db
      .query("servers")
      .withIndex("isPublic", (q) => q.eq("isPublic", true))
      .take(30);
    const myMemberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const myServerIds = new Set(myMemberships.map((m) => m.serverId));
    return Promise.all(
      publicServers
        .filter((s) => !myServerIds.has(s._id))
        .slice(0, 20)
        .map(async (s) => {
          const members = await ctx.db
            .query("memberships")
            .withIndex("byServer", (q) => q.eq("serverId", s._id))
            .collect();
          return {
            _id: s._id,
            name: s.name,
            description: s.description,
            iconEmoji: s.iconEmoji,
            iconStorageId: s.iconStorageId,
            memberCount: members.length,
            inviteCode: s.inviteCode,
          };
        }),
    );
  },
});

export const joinByInvite = mutation({
  args: { ...tokenField, code: v.string() },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const server = await ctx.db
      .query("servers")
      .withIndex("inviteCode", (q) => q.eq("inviteCode", args.code.trim()))
      .unique();
    if (!server) throw new Error("Invalid invite code");
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byServerAndUser", (q) =>
        q.eq("serverId", server._id).eq("userId", user._id),
      )
      .unique();
    if (existing) return server._id;
    await ctx.db.insert("memberships", {
      userId: user._id,
      serverId: server._id,
      role: "member",
      joinedAt: Date.now(),
    });
    return server._id;
  },
});

export const update = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    iconEmoji: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can edit the server");
    }
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length < 2 || name.length > 60) {
        throw new Error("Server name must be 2-60 characters");
      }
      patch.name = name;
    }
    if (args.description !== undefined) {
      patch.description = args.description.trim().slice(0, 200) || undefined;
    }
    if (args.iconEmoji !== undefined) patch.iconEmoji = args.iconEmoji || undefined;
    if (args.isPublic !== undefined) patch.isPublic = args.isPublic;
    await ctx.db.patch(args.serverId, patch);
  },
});

export const remove = mutation({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const server = await ctx.db.get(args.serverId);
    if (!server) throw new Error("Server not found");
    if (server.ownerId !== user._id) {
      throw new Error("Only the server owner can delete the server");
    }
    const channels = await ctx.db
      .query("channels")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    for (const channel of channels) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("byChannelCreated", (q) => q.eq("channelId", channel._id))
        .collect();
      for (const message of messages) {
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("byMessage", (q) => q.eq("messageId", message._id))
          .collect();
        for (const r of reactions) await ctx.db.delete(r._id);
        await ctx.db.delete(message._id);
      }
      const readStates = await ctx.db
        .query("readStates")
        .withIndex("byUser", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("channelId"), channel._id))
        .collect();
      for (const rs of readStates) await ctx.db.delete(rs._id);
      await ctx.db.delete(channel._id);
    }
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    for (const m of memberships) await ctx.db.delete(m._id);
    await ctx.db.delete(args.serverId);
  },
});

export const leave = mutation({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (membership.role === "owner") {
      throw new Error("Owners must delete the server to leave it");
    }
    await ctx.db.delete(membership._id);
  },
});

export const setRole = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (membership.role !== "owner") {
      throw new Error("Only the owner can change roles");
    }
    const target = await ctx.db
      .query("memberships")
      .withIndex("byServerAndUser", (q) =>
        q.eq("serverId", args.serverId).eq("userId", args.userId),
      )
      .unique();
    if (!target) throw new Error("That user is not a member");
    if (target.role === "owner") throw new Error("Cannot change the owner's role");
    await ctx.db.patch(target._id, { role: args.role });
  },
});

export const kick = mutation({
  args: { ...tokenField, serverId: v.id("servers"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can kick members");
    }
    if (args.userId === membership.userId) {
      throw new Error("Use leave to remove yourself");
    }
    const target = await ctx.db
      .query("memberships")
      .withIndex("byServerAndUser", (q) =>
        q.eq("serverId", args.serverId).eq("userId", args.userId),
      )
      .unique();
    if (!target) throw new Error("That user is not a member");
    if (target.role === "owner") throw new Error("Cannot kick the owner");
    await ctx.db.delete(target._id);
  },
});

export const regenerateInvite = mutation({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can regenerate the invite");
    }
    const code = generateInviteCode();
    await ctx.db.patch(args.serverId, { inviteCode: code });
    return code;
  },
});

export const getIconUrl = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireMember(ctx.db, args.token, args.serverId);
    const server = await ctx.db.get(args.serverId);
    if (!server?.iconStorageId) return null;
    return await ctx.storage.getUrl(server.iconStorageId);
  },
});
