import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateTokenWrite, validateTokenRead, requireChannelAccess, tokenField } from "./helpers";
import type { Id } from "./_generated/dataModel";

export const createPoll = mutation({
  args: {
    ...tokenField,
    channelId: v.id("channels"),
    question: v.string(),
    options: v.array(v.object({ text: v.string() })),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    if (args.question.length < 1 || args.question.length > 256) {
      throw new Error("Poll question must be 1-256 characters");
    }
    if (args.options.length < 2 || args.options.length > 10) {
      throw new Error("Polls need 2-10 options");
    }
    for (const opt of args.options) {
      if (opt.text.length < 1 || opt.text.length > 100) {
        throw new Error("Poll options must be 1-100 characters");
      }
    }
    const message = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: user._id,
      content: `Poll: ${args.question}`,
      attachments: [],
      createdAt: Date.now(),
    });
    await ctx.db.insert("polls", {
      messageId: message._id,
      authorId: user._id,
      channelId: args.channelId,
      question: args.question.trim(),
      options: args.options.map((o) => ({ text: o.text.trim(), voterIds: [] })),
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
    return message._id;
  },
});

export const votePoll = mutation({
  args: { ...tokenField, pollId: v.id("polls"), optionIndex: v.number() },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    await requireChannelAccess(ctx.db, args.token, poll.channelId);
    if (args.optionIndex < 0 || args.optionIndex >= poll.options.length) {
      throw new Error("Invalid option index");
    }
    const options = [...poll.options];
    for (const opt of options) {
      opt.voterIds = opt.voterIds.filter((id) => id !== user._id);
    }
    options[args.optionIndex].voterIds.push(user._id);
    await ctx.db.patch(args.pollId, { options });
  },
});

export const listPolls = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const polls = await ctx.db
      .query("polls")
      .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
      .collect();
    return polls.map((p) => ({
      _id: p._id,
      question: p.question,
      options: p.options.map((o, i) => ({
        index: i,
        text: o.text,
        votes: o.voterIds.length,
        votedByMe: o.voterIds.includes(user._id),
      })),
      expiresAt: p.expiresAt,
      createdAt: p.createdAt,
    }));
  },
});