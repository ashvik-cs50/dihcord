import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateTokenWrite, validateTokenRead, requireChannelAccess, tokenField } from "./helpers";
import type { Id } from "./_generated/dataModel";

export const scheduleMessage = mutation({
  args: {
    ...tokenField,
    channelId: v.id("channels"),
    content: v.string(),
    scheduledFor: v.number(),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          name: v.string(),
          mimeType: v.string(),
          size: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    if (args.scheduledFor <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }
    if (args.content.length > 2000) {
      throw new Error("Message cannot exceed 2000 characters");
    }
    return await ctx.db.insert("scheduledMessages", {
      channelId: args.channelId,
      authorId: user._id,
      content: args.content.trim(),
      attachments: args.attachments ?? [],
      scheduledFor: args.scheduledFor,
      sent: false,
      createdAt: Date.now(),
    });
  },
});

export const listScheduledMessages = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const messages = await ctx.db
      .query("scheduledMessages")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("sent"), false))
      .collect();
    return messages
      .filter((m) => m.authorId === args.token && true)
      .map((m) => ({
        _id: m._id,
        content: m.content,
        scheduledFor: m.scheduledFor,
        attachments: m.attachments,
        createdAt: m.createdAt,
      }));
  },
});

export const cancelScheduledMessage = mutation({
  args: { ...tokenField, scheduledMessageId: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const msg = await ctx.db.get(args.scheduledMessageId);
    if (!msg) throw new Error("Scheduled message not found");
    if (msg.authorId !== user._id) throw new Error("Not your scheduled message");
    await ctx.db.delete(args.scheduledMessageId);
  },
});

export const markScheduledSent = internalMutation({
  args: { id: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { sent: true });
  },
});

export const dueScheduledMessages = internalQuery({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("scheduledMessages").collect();
    return all.filter((m) => !m.sent && m.scheduledFor <= args.before);
  },
});