import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMember, canModerate, validateTokenWrite, tokenField } from "./helpers";

const MAX_EMOJI_SIZE = 256 * 1024;

export const listServerEmojis = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireMember(ctx.db, args.token, args.serverId);
    const emojis = await ctx.db
      .query("serverEmojis")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    return await Promise.all(
      emojis.map(async (e) => ({
        _id: e._id,
        name: e.name,
        url: await ctx.storage.getUrl(e.imageStorageId),
        creatorId: e.creatorId,
        animated: e.animated,
        createdAt: e.createdAt,
      })),
    );
  },
});

export const uploadEmoji = mutation({
  args: {
    ...tokenField,
    serverId: v.id("servers"),
    name: v.string(),
    imageStorageId: v.id("_storage"),
    animated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can manage emojis");
    }
    const name = args.name.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,32}$/.test(name)) {
      throw new Error("Emoji name must be 2-32 chars: lowercase, numbers, underscores");
    }
    const existing = await ctx.db
      .query("serverEmojis")
      .withIndex("byServerAndName", (q) => q.eq("serverId", args.serverId).eq("name", name))
      .unique();
    if (existing) throw new Error("An emoji with that name already exists");
    const metadata = await ctx.db.system.get(args.imageStorageId);
    if (!metadata || metadata.contentType?.split("/")[0] !== "image") {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Emoji must be an image");
    }
    if (metadata.sizeBytes && metadata.sizeBytes > MAX_EMOJI_SIZE) {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Emoji must be under 256 KB");
    }
    const animated =
      !!args.animated || /gif/.test(metadata.contentType ?? "");
    return await ctx.db.insert("serverEmojis", {
      serverId: args.serverId,
      name,
      imageStorageId: args.imageStorageId,
      creatorId: user._id,
      animated,
      createdAt: Date.now(),
    });
  },
});

export const deleteEmoji = mutation({
  args: { ...tokenField, serverId: v.id("servers"), emojiId: v.id("serverEmojis") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can delete emojis");
    }
    const emoji = await ctx.db.get(args.emojiId);
    if (!emoji || emoji.serverId !== args.serverId) throw new Error("Emoji not found");
    if (emoji.creatorId !== user._id && membership.role !== "owner") {
      throw new Error("You can only delete emojis you created unless you are the owner");
    }
    await ctx.storage.delete(emoji.imageStorageId);
    await ctx.db.delete(args.emojiId);
  },
});

export const generateEmojiUploadUrl = mutation({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    if (!canModerate(membership.role)) {
      throw new Error("Only owners and admins can upload emojis");
    }
    return await ctx.storage.generateUploadUrl();
  },
});