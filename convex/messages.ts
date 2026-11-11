import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  validateTokenWrite,
  validateTokenRead,
  requireChannelAccess,
  MAX_MESSAGE_LENGTH,
  tokenField,
} from "./helpers";

export const list = query({
  args: {
    ...tokenField,
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    const page = await ctx.db
      .query("messages")
      .withIndex("byChannelCreated", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);
    const mapped = await Promise.all(
      page.page.map(async (message) => ({
        ...message,
        attachments: await Promise.all(
          message.attachments.map(async (a) => ({
            ...a,
            url: await ctx.storage.getUrl(a.storageId),
          })),
        ),
      })),
    );
    return { ...page, page: mapped };
  },
});

export const send = mutation({
  args: {
    ...tokenField,
    channelId: v.id("channels"),
    content: v.string(),
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
    replyTo: v.optional(
      v.object({
        messageId: v.id("messages"),
        authorId: v.id("users"),
        authorName: v.string(),
        contentPreview: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const { channel } = await requireChannelAccess(ctx.db, args.token, args.channelId);
    const content = args.content.trim();
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }
    if (!content && (!args.attachments || args.attachments.length === 0)) {
      throw new Error("Message cannot be empty");
    }
    if (args.attachments && args.attachments.length > 5) {
      throw new Error("A message can have at most 5 attachments");
    }
    const attachments = (args.attachments ?? []).map((a) => ({
      ...a,
      name: a.name.slice(0, 120),
    }));

    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      serverId: channel.serverId ?? undefined,
      authorId: user._id,
      content,
      attachments,
      replyTo: args.replyTo,
      createdAt: Date.now(),
    });

    // Unread fan-out to other participants.
    let participantIds: Id<"users">[] = [];
    if (channel.type === "dm") {
      const dmMembers = await ctx.db
        .query("dmMembers")
        .withIndex("byChannel", (q) => q.eq("channelId", args.channelId))
        .collect();
      participantIds = dmMembers.map((m) => m.userId);
    } else if (channel.serverId) {
      const serverId = channel.serverId;
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("byServer", (q) => q.eq("serverId", serverId))
        .collect();
      participantIds = memberships.map((m) => m.userId);
    }
    for (const participantId of participantIds) {
      if (participantId === user._id) continue;
      await ctx.runMutation(internal.messages.incrementUnread, {
        userId: participantId,
        channelId: args.channelId,
      });
    }

    // Mention notifications: @username matches against participants.
    if (content.length > 1) {
      const mentioned = new Set<string>();
      const regex = /@([a-z0-9_]{3,24})/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        mentioned.add(match[1]);
      }
      if (mentioned.size > 0) {
        for (const participantId of participantIds) {
          if (participantId === user._id) continue;
          const participant = await ctx.db.get(participantId);
          if (!participant || !mentioned.has(participant.username)) continue;
          await ctx.db.insert("notifications", {
            userId: participantId,
            type: "mention",
            actorId: user._id,
            serverId: channel.serverId ?? undefined,
            channelId: args.channelId,
            messageId,
            serverName: channel.serverId
              ? (await ctx.db.get(channel.serverId))?.name
              : undefined,
            channelName: channel.name,
            read: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return messageId;
  },
});

export const incrementUnread = internalMutation({
  args: { userId: v.id("users"), channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("readStates")
      .withIndex("byUserChannel", (q) =>
        q.eq("userId", args.userId).eq("channelId", args.channelId),
      )
      .unique();
    if (state) {
      if (state.unread < 99) {
        await ctx.db.patch(state._id, { unread: state.unread + 1 });
      }
    } else {
      await ctx.db.insert("readStates", {
        userId: args.userId,
        channelId: args.channelId,
        lastReadAt: 0,
        unread: 1,
      });
    }
  },
});

export const edit = mutation({
  args: { ...tokenField, messageId: v.id("messages"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.authorId !== user._id) {
      throw new Error("You can only edit your own messages");
    }
    const content = args.content.trim();
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }
    if (!content && message.attachments.length === 0) {
      throw new Error("Message cannot be empty");
    }
    await ctx.db.patch(args.messageId, {
      content,
      editedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { ...tokenField, messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    let allowed = message.authorId === user._id;
    if (!allowed) {
      const channel = await ctx.db.get(message.channelId);
      if (channel?.serverId) {
        const serverId = channel.serverId;
        const membership = await ctx.db
          .query("memberships")
          .withIndex("byServerAndUser", (q) =>
            q.eq("serverId", serverId).eq("userId", user._id),
          )
          .unique();
        allowed = membership?.role === "owner" || membership?.role === "admin";
      }
    }
    if (!allowed) throw new Error("You cannot delete this message");
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("byMessage", (q) => q.eq("messageId", args.messageId))
      .collect();
    for (const r of reactions) await ctx.db.delete(r._id);
    await ctx.db.delete(args.messageId);
  },
});

export const generateUploadUrl = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await requireChannelAccess(ctx.db, args.token, args.channelId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const search = query({
  args: {
    ...tokenField,
    query: v.string(),
    channelId: v.optional(v.id("channels")),
    serverId: v.optional(v.id("servers")),
  },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const q = args.query.trim();
    if (q.length < 2) return [];
    let searchBuilder = ctx.db
      .query("messages")
      .withSearchIndex("search", (s) => {
        let fb = s.search("content", q);
        if (args.channelId) fb = fb.eq("channelId", args.channelId);
        if (args.serverId) fb = fb.eq("serverId", args.serverId);
        return fb;
      });
    const results = await searchBuilder.take(30);
    // Filter results to channels the user can access.
    const accessible = await Promise.all(
      results.map(async (message) => {
        try {
          await requireChannelAccess(ctx.db, args.token, message.channelId);
          return {
            ...message,
            attachments: await Promise.all(
              message.attachments.map(async (a) => ({
                ...a,
                url: await ctx.storage.getUrl(a.storageId),
              })),
            ),
          };
        } catch {
          return null;
        }
      }),
    );
    return accessible.filter(Boolean).slice(0, 25);
  },
});

export const markRead = mutation({
  args: { ...tokenField, channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const state = await ctx.db
      .query("readStates")
      .withIndex("byUserChannel", (q) =>
        q.eq("userId", user._id).eq("channelId", args.channelId),
      )
      .unique();
    if (!state) {
      await ctx.db.insert("readStates", {
        userId: user._id,
        channelId: args.channelId,
        lastReadAt: Date.now(),
        unread: 0,
      });
    } else if (state.unread !== 0) {
      await ctx.db.patch(state._id, { lastReadAt: Date.now(), unread: 0 });
    }
  },
});

export const getMessage = query({
  args: { ...tokenField, messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await validateTokenRead(ctx.db, args.token);
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    try {
      await requireChannelAccess(ctx.db, args.token, message.channelId);
    } catch {
      return null;
    }
    return message;
  },
});

export type MessageDoc = Doc<"messages">;
