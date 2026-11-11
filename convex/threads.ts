import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, requireChannelAccess, tokenField } from "./helpers";

export const createThread = mutation({
  args: {
    ...tokenField,
    parentMessageId: v.id("messages"),
    channelId: v.id("channels"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    const parent = await ctx.db.get(args.parentMessageId);
    if (!parent || parent.channelId !== args.channelId) {
      throw new Error("Parent message not found in this channel");
    }
    return await ctx.db.insert("threads", {
      parentMessageId: args.parentMessageId,
      channelId: args.channelId,
      authorId: user._id,
      name: args.name?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const listThreads = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const threads = await ctx.db
      .query("threads")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(50);
    return await Promise.all(
      threads.map(async (t) => {
        const parent = await ctx.db.get(t.parentMessageId);
        return {
          _id: t._id,
          name: t.name,
          parentMessageId: t.parentMessageId,
          authorId: t.authorId,
          createdAt: t.createdAt,
          parentPreview: parent ? parent.content.slice(0, 80) : "",
        };
      }),
    );
  },
});

export const getThread = query({
  args: { ...tokenField, threadId: v.id("threads") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return null;
    await requireChannelAccess(ctx.db, args.token, thread.channelId);
    return {
      _id: thread._id,
      name: thread.name,
      parentMessageId: thread.parentMessageId,
      channelId: thread.channelId,
      authorId: thread.authorId,
      createdAt: thread.createdAt,
    };
  },
});