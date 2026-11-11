import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, tokenField } from "./helpers";
import type { Id } from "./_generated/dataModel";

export const getProfileCustomization = query({
  args: { ...tokenField, userId: v.id("users") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const custom = await ctx.db
      .query("profileCustomizations")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .unique();
    if (!custom) return null;
    const bannerUrl = custom.bannerStorageId
      ? await ctx.storage.getUrl(custom.bannerStorageId)
      : null;
    return {
      bannerUrl,
      accentColor: custom.accentColor,
      theme: custom.theme,
      aboutMe: custom.aboutMe,
      pronouns: custom.pronouns,
      updatedAt: custom.updatedAt,
    };
  },
});

export const updateProfileCustomization = mutation({
  args: {
    ...tokenField,
    bannerStorageId: v.optional(v.id("_storage")),
    accentColor: v.optional(v.string()),
    theme: v.optional(v.string()),
    aboutMe: v.optional(v.string()),
    pronouns: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);

    const existing = await ctx.db
      .query("profileCustomizations")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bannerStorageId: args.bannerStorageId ?? existing.bannerStorageId,
        accentColor: args.accentColor ?? existing.accentColor,
        theme: args.theme ?? existing.theme,
        aboutMe: args.aboutMe !== undefined ? args.aboutMe : existing.aboutMe,
        pronouns: args.pronouns !== undefined ? args.pronouns : existing.pronouns,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("profileCustomizations", {
        userId: user._id,
        bannerStorageId: args.bannerStorageId,
        accentColor: args.accentColor,
        theme: args.theme,
        aboutMe: args.aboutMe,
        pronouns: args.pronouns,
        updatedAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

export const generateBannerUploadUrl = mutation({
  args: tokenField,
  handler: async (ctx, args) => {
    await validateTokenWrite(ctx.db, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});