import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireMember, canModerate, validateTokenWrite, validateTokenRead, tokenField } from "./helpers";
import type { Id } from "./_generated/dataModel";

const MAX_STICKER_SIZE = 512 * 1024;

export const listStickers = query({
  args: { ...tokenField, serverId: v.optional(v.id("servers")) },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    if (args.serverId) {
      await requireMember(ctx.db, args.token, args.serverId);
    }
    const stickers = await ctx.db
      .query("stickers")
      .filter((q) =>
        args.serverId
          ? q.eq(q.field("serverId"), args.serverId)
          : q.or(q.eq(q.field("serverId"), null), q.isNull(q.field("serverId")))
      )
      .collect();
    return await Promise.all(
      stickers.map(async (s) => ({
        _id: s._id,
        name: s.name,
        url: await ctx.storage.getUrl(s.imageStorageId),
        serverId: s.serverId,
        tags: s.tags,
        creatorId: s.creatorId,
        createdAt: s.createdAt,
      })),
    );
  },
});

export const uploadSticker = mutation({
  args: {
    ...tokenField,
    serverId: v.optional(v.id("servers")),
    name: v.string(),
    imageStorageId: v.id("_storage"),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    if (args.serverId) {
      const { membership } = await requireMember(ctx.db, args.token, args.serverId);
      if (!canModerate(membership.role)) {
        throw new Error("Only owners and admins can manage stickers");
      }
    }
    const name = args.name.trim();
    if (name.length < 2 || name.length > 32) {
      throw new Error("Sticker name must be 2-32 characters");
    }
    const metadata = await ctx.db.system.get(args.imageStorageId);
    if (!metadata || metadata.contentType?.split("/")[0] !== "image") {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Sticker must be an image");
    }
    if (metadata.sizeBytes && metadata.sizeBytes > MAX_STICKER_SIZE) {
      await ctx.storage.delete(args.imageStorageId);
      throw new Error("Sticker must be under 512 KB");
    }
    return await ctx.db.insert("stickers", {
      serverId: args.serverId ?? null,
      name,
      imageStorageId: args.imageStorageId,
      creatorId: user._id,
      tags: args.tags ?? [],
      createdAt: Date.now(),
    });
  },
});

export const deleteSticker = mutation({
  args: { ...tokenField, stickerId: v.id("stickers") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const sticker = await ctx.db.get(args.stickerId);
    if (!sticker) throw new Error("Sticker not found");
    if (sticker.creatorId !== user._id) {
      if (sticker.serverId) {
        const { membership } = await requireMember(ctx.db, args.token, sticker.serverId);
        if (!canModerate(membership.role)) {
          throw new Error("You can only delete stickers you created");
        }
      } else {
        throw new Error("You can only delete stickers you created");
      }
    }
    await ctx.storage.delete(sticker.imageStorageId);
    await ctx.db.delete(args.stickerId);
  },
});

export const generateStickerUploadUrl = mutation({
  args: { ...tokenField, serverId: v.optional(v.id("servers")) },
  handler: async (ctx, args) => {
    if (args.serverId) {
      const { membership } = await requireMember(ctx.db, args.token, args.serverId);
      if (!canModerate(membership.role)) {
        throw new Error("Only owners and admins can upload stickers");
      }
    }
    return await ctx.storage.generateUploadUrl();
  },
});