import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  validateTokenRead,
  validateTokenWrite,
  publicUser,
  tokenField,
} from "./helpers";

export const getSessionUser = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : null;
    return { ...publicUser(user), avatarUrl };
  },
});

export const logout = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const heartbeat = mutation({
  args: { ...tokenField, status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const patch: { lastSeenAt: number; status?: Doc<"users">["status"] } = {
      lastSeenAt: Date.now(),
    };
    if (
      args.status &&
      ["online", "idle", "dnd", "invisible"].includes(args.status)
    ) {
      patch.status = args.status as Doc<"users">["status"];
    }
    await ctx.db.patch(user._id, patch);
  },
});

export const updateProfile = mutation({
  args: {
    ...tokenField,
    displayName: v.optional(v.string()),
    customStatus: v.optional(v.string()),
    accentColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const patch: Record<string, string | undefined> = {};
    if (args.displayName !== undefined) {
      const displayName = args.displayName.trim();
      if (displayName.length < 1 || displayName.length > 32) {
        throw new Error("Display name must be 1-32 characters");
      }
      patch.displayName = displayName;
    }
    if (args.customStatus !== undefined) {
      patch.customStatus = args.customStatus.slice(0, 80) || undefined;
    }
    if (args.accentColor !== undefined) {
      patch.accentColor = args.accentColor;
    }
    await ctx.db.patch(user._id, patch);
  },
});

export const generateAvatarUploadUrl = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    await validateTokenWrite(ctx.db, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setAvatar = mutation({
  args: { ...tokenField, storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata || metadata.contentType?.split("/")[0] !== "image") {
      await ctx.storage.delete(args.storageId);
      throw new Error("Avatar must be an image");
    }
    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }
    await ctx.db.patch(user._id, { avatarStorageId: args.storageId });
  },
});

export const getProfile = query({
  args: { ...tokenField, userId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await validateTokenRead(ctx.db, args.token);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    let friendship: "self" | "none" | "incoming" | "outgoing" | "friends" = "none";
    if (user._id === me._id) {
      friendship = "self";
    } else {
      const outgoing = await ctx.db
        .query("friendships")
        .withIndex("bySenderAndReceiver", (q) =>
          q.eq("senderId", me._id).eq("receiverId", user._id),
        )
        .unique();
      const incoming = await ctx.db
        .query("friendships")
        .withIndex("bySenderAndReceiver", (q) =>
          q.eq("senderId", user._id).eq("receiverId", me._id),
        )
        .unique();
      const active = [outgoing, incoming].find((f) => f?.status === "accepted");
      if (active) friendship = "friends";
      else if (outgoing?.status === "pending") friendship = "outgoing";
      else if (incoming?.status === "pending") friendship = "incoming";
    }

    return {
      ...publicUser(user),
      avatarUrl: await getAvatarUrl(ctx, user),
      friendship,
    };
  },
});

export const clearAvatar = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
      await ctx.db.patch(user._id, { avatarStorageId: undefined });
    }
  },
});

export const getAvatarUrl = async (
  ctx: { storage: { getUrl: (id: any) => Promise<string | null> } },
  user: Doc<"users">,
): Promise<string | null> => {
  if (!user.avatarStorageId) return null;
  return await ctx.storage.getUrl(user.avatarStorageId);
};

export const search = query({
  args: { ...tokenField, query: v.string() },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const q = args.query.trim().toLowerCase();
    if (q.length < 1) return [];
    const all = await ctx.db.query("users").collect();
    return Promise.all(
      all
        .filter(
          (u) => u.username.includes(q) || u.displayName.toLowerCase().includes(q),
        )
        .slice(0, 20)
        .map(async (u) => ({
          ...publicUser(u),
          avatarUrl: await getAvatarUrl(ctx, u),
        })),
    );
  },
});

export const getByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const getAuthByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .unique();
    if (!user) return null;
    const credential = await ctx.db
      .query("credentials")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!credential) return null;
    return { _id: user._id, passwordHash: credential.passwordHash };
  },
});

export const createUserWithSession = internalMutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    passwordHash: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      username: args.username,
      displayName: args.displayName,
      status: "online",
      lastSeenAt: Date.now(),
      createdAt: Date.now(),
    });
    await ctx.db.insert("credentials", {
      userId,
      passwordHash: args.passwordHash,
    });
    await ctx.db.insert("sessions", {
      token: args.token,
      userId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    return userId;
  },
});

export const createSession = internalMutation({
  args: { userId: v.id("users"), token: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      token: args.token,
      userId: args.userId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});
