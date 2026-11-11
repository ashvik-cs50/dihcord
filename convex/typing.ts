import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireChannelAccess, tokenField } from "./helpers";

const TYPING_TTL_MS = 6000;

export const setTyping = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await requireChannelAccess(ctx.db, args.token, args.channelId);
    const now = Date.now();
    const stale = await ctx.db
      .query("typing")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .collect();
    for (const t of stale) {
      if (t.expiresAt < now || t.userId === user.user._id) {
        await ctx.db.delete(t._id);
      }
    }
    await ctx.db.insert("typing", {
      channelId: args.channelId,
      userId: user.user._id,
      expiresAt: now + TYPING_TTL_MS,
    });
  },
});

export const listTyping = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    const now = Date.now();
    const entries = await ctx.db
      .query("typing")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .collect();
    const active = entries.filter((t) => t.expiresAt > now);
    const users = await Promise.all(
      active.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return user ? { userId: user._id, displayName: user.displayName } : null;
      }),
    );
    return users.filter(Boolean) as {
      userId: Doc<"users">["_id"];
      displayName: string;
    }[];
  },
});
