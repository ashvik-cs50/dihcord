import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { validateTokenWrite, validateTokenRead, tokenField } from "./helpers";

export const toggle = mutation({
  args: {
    ...tokenField,
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    const channel = await ctx.db.get(message.channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.type === "dm") {
      const member = await ctx.db
        .query("dmMembers")
        .withIndex("byUser", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("channelId"), message.channelId))
        .first();
      if (!member) throw new Error("You do not have access to this conversation");
    } else if (channel.serverId) {
      const serverId = channel.serverId;
      const membership = await ctx.db
        .query("memberships")
        .withIndex("byServerAndUser", (q) =>
          q.eq("serverId", serverId).eq("userId", user._id),
        )
        .unique();
      if (!membership) throw new Error("You are not a member of this server");
    }
    if (args.emoji.length > 12) throw new Error("Invalid emoji");

    const existing = await ctx.db
      .query("reactions")
      .withIndex("byMessageUserEmoji", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("userId", user._id)
          .eq("emoji", args.emoji),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    }
    await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: user._id,
      emoji: args.emoji,
    });
    return { added: true };
  },
});

export const listByChannel = query({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const messages = await ctx.db
      .query("messages")
      .withIndex("byChannelCreated", (q) => q.eq("channelId", args.channelId))
      .take(200);
    const byMessage = new Map<Id<"messages">, ReactionSummary[]>();
    for (const message of messages) {
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("byMessage", (q) => q.eq("messageId", message._id))
        .collect();
      if (reactions.length > 0) byMessage.set(message._id, reactions);
    }
    return [...byMessage.entries()].map(([messageId, reactions]) => ({
      messageId,
      reactions,
    }));
  },
});

export type ReactionSummary = {
  _id: Id<"reactions">;
  messageId: Id<"messages">;
  userId: Id<"users">;
  emoji: string;
};

export type ReactionDoc = Doc<"reactions">;
