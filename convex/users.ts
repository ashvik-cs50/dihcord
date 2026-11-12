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
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
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
    defaultAvatarKey: v.optional(v.string()),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      username: args.username,
      displayName: args.displayName,
      defaultAvatarKey: args.defaultAvatarKey ?? undefined,
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

const MAX_PERSONAL_EMOJI_SIZE = 256 * 1024;

export const listUserEmojis = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const emojis = await ctx.db
      .query("userEmojis")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return await Promise.all(
      emojis.map(async (e) => ({
        _id: e._id,
        name: e.name,
        url: await ctx.storage.getUrl(e.imageStorageId),
        animated: e.animated,
        createdAt: e.createdAt,
      })),
    );
  },
});

export const uploadUserEmoji = mutation({
  args: {
    ...tokenField,
    name: v.string(),
    imageStorageId: v.id("_storage"),
    animated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const name = args.name.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,32}$/.test(name)) {
      throw new Error("Emoji name must be 2-32 chars: lowercase, numbers, underscores");
    }
    const existing = await ctx.db
      .query("userEmojis")
      .withIndex("byUserAndName", (q) =>
        q.eq("userId", user._id).eq("name", name),
      )
      .unique();
    if (existing) throw new Error("An emoji with that name already exists");
    const metadata = await ctx.db.system.get(args.imageStorageId);
    if (!metadata || metadata.contentType?.split("/")[0] !== "image") {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Emoji must be an image");
    }
    if (metadata.sizeBytes && metadata.sizeBytes > MAX_PERSONAL_EMOJI_SIZE) {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Emoji must be under 256 KB");
    }
    const animated = !!args.animated || /gif/i.test(metadata.contentType ?? "");
    return await ctx.db.insert("userEmojis", {
      userId: user._id,
      name,
      imageStorageId: args.imageStorageId,
      animated,
      createdAt: Date.now(),
    });
  },
});

export const deleteUserEmoji = mutation({
  args: { ...tokenField, emojiId: v.id("userEmojis") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const emoji = await ctx.db.get(args.emojiId);
    if (!emoji || emoji.userId !== user._id) throw new Error("Emoji not found");
    await ctx.storage.delete(emoji.imageStorageId);
    await ctx.db.delete(args.emojiId);
  },
});

export const generateUserEmojiUploadUrl = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    await validateTokenWrite(ctx.db, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const hideChat = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
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
  },
});

export const unhideChat = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const existing = await ctx.db
      .query("hiddenChats")
      .withIndex("byUserAndChannel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
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
    return hidden.map((h) => h.channelId);
  },
});

export const listUserThemes = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const themes = await ctx.db
      .query("userThemes")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return themes.map((t) => ({
      _id: t._id,
      name: t.name,
      colors: JSON.parse(t.colors),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },
});

export const saveUserTheme = mutation({
  args: {
    ...tokenField,
    name: v.string(),
    colors: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    JSON.parse(args.colors); // validate
    const existing = await ctx.db
      .query("userThemes")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    const match = existing.find((t) => t.name === args.name);
    if (match) {
      await ctx.db.patch(match._id, {
        colors: args.colors,
        updatedAt: now,
      });
      return match._id;
    }
    return await ctx.db.insert("userThemes", {
      userId: user._id,
      name: args.name,
      colors: args.colors,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteUserTheme = mutation({
  args: { ...tokenField, themeId: v.id("userThemes") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const theme = await ctx.db.get(args.themeId);
    if (!theme || theme.userId !== user._id) throw new Error("Theme not found");
    await ctx.db.delete(args.themeId);
  },
});

export const setUserTheme = mutation({
  args: {
    ...tokenField,
    themeId: v.optional(v.string()),
    customTheme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const patch: Record<string, string | undefined> = {};
    if (args.themeId !== undefined) patch.themeId = args.themeId;
    if (args.customTheme !== undefined) patch.customTheme = args.customTheme;
    await ctx.db.patch(user._id, patch);
  },
});
