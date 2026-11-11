import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    displayName: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    accentColor: v.optional(v.string()),
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("dnd"),
      v.literal("invisible"),
      v.literal("offline"),
    ),
    customStatus: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number(),
  })
    .index("username", ["username"])
    .index("status", ["status"]),

  credentials: defineTable({
    userId: v.id("users"),
    passwordHash: v.string(),
  }).index("userId", ["userId"]),

  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"]),

  servers: defineTable({
    name: v.string(),
    iconEmoji: v.optional(v.string()),
    iconStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    isPublic: v.boolean(),
    inviteCode: v.string(),
    createdAt: v.number(),
  })
    .index("inviteCode", ["inviteCode"])
    .index("isPublic", ["isPublic"]),

  memberships: defineTable({
    userId: v.id("users"),
    serverId: v.id("servers"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),
    nickname: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index("byUser", ["userId"])
    .index("byServer", ["serverId"])
    .index("byServerAndUser", ["serverId", "userId"]),

  channels: defineTable({
    serverId: v.optional(v.id("servers")),
    name: v.string(),
    type: v.union(v.literal("text"), v.literal("voice"), v.literal("dm")),
    category: v.optional(v.string()),
    position: v.optional(v.number()),
    pairKey: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byServer", ["serverId"])
    .index("pairKey", ["pairKey"]),

  dmMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
  })
    .index("byUser", ["userId"])
    .index("byChannel", ["channelId"]),

  messages: defineTable({
    channelId: v.id("channels"),
    serverId: v.optional(v.id("servers")),
    authorId: v.id("users"),
    content: v.string(),
    attachments: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        mimeType: v.string(),
        size: v.number(),
      }),
    ),
    replyTo: v.optional(
      v.object({
        messageId: v.id("messages"),
        authorId: v.id("users"),
        authorName: v.string(),
        contentPreview: v.string(),
      }),
    ),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("byChannelCreated", ["channelId"])
    .index("byAuthor", ["authorId"])
    .searchIndex("search", {
      searchField: "content",
      filterFields: ["serverId", "channelId"],
    }),

  friendships: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked"),
    ),
    createdAt: v.number(),
  })
    .index("bySenderAndReceiver", ["senderId", "receiverId"])
    .index("byReceiver", ["receiverId"])
    .index("bySender", ["senderId"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("byMessage", ["messageId"])
    .index("byMessageUserEmoji", ["messageId", "userId", "emoji"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("mention"), v.literal("friendRequest")),
    actorId: v.id("users"),
    serverId: v.optional(v.id("servers")),
    channelId: v.optional(v.id("channels")),
    messageId: v.optional(v.id("messages")),
    serverName: v.optional(v.string()),
    channelName: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("byUser", ["userId"])
    .index("byUserRead", ["userId", "read"]),

  typing: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("byChannel", ["channelId"]),

  readStates: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    lastReadAt: v.number(),
    unread: v.number(),
  })
    .index("byUser", ["userId"])
    .index("byUserChannel", ["userId", "channelId"]),

  /* Custom server emojis (free for all) */
  serverEmojis: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    imageStorageId: v.id("_storage"),
    creatorId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byServer", ["serverId"])
    .index("byServerAndName", ["serverId", "name"]),

  /* Custom stickers (free for all) */
  stickers: defineTable({
    serverId: v.optional(v.id("servers")),
    name: v.string(),
    imageStorageId: v.id("_storage"),
    creatorId: v.id("users"),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("byServer", ["serverId"])
    .index("byCreator", ["creatorId"]),

  /* Profile customization (free for all) */
  profileCustomizations: defineTable({
    userId: v.id("users"),
    bannerStorageId: v.optional(v.id("_storage")),
    accentColor: v.optional(v.string()),
    theme: v.optional(v.string()),
    aboutMe: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("byUser", ["userId"]),

  /* Scheduled messages (free for all) */
  scheduledMessages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
    attachments: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        mimeType: v.string(),
        size: v.number(),
      }),
    ),
    scheduledFor: v.number(),
    sent: v.boolean(),
    createdAt: v.number(),
  })
    .index("byChannel", ["channelId"])
    .index("byScheduledFor", ["scheduledFor"]),

  /* Polls (free for all) */
  polls: defineTable({
    messageId: v.id("messages"),
    authorId: v.id("users"),
    channelId: v.id("channels"),
    question: v.string(),
    options: v.array(
      v.object({
        text: v.string(),
        voterIds: v.array(v.id("users")),
      }),
    ),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("byMessage", ["messageId"])
    .index("byChannel", ["channelId"]),

  /* Threads (free for all) */
  threads: defineTable({
    parentMessageId: v.id("messages"),
    channelId: v.id("channels"),
    authorId: v.id("users"),
    name: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byParent", ["parentMessageId"])
    .index("byChannel", ["channelId"]),

  /* Moderation: moderation logs */
  moderationLogs: defineTable({
    serverId: v.id("servers"),
    actorId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    action: v.string(),
    reason: v.optional(v.string()),
    channelId: v.optional(v.id("channels")),
    createdAt: v.number(),
  })
    .index("byServer", ["serverId"])
    .index("byActor", ["actorId"]),

  /* Privacy: blocked users */
  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("byBlocker", ["blockerId"])
    .index("byBlocked", ["blockedId"])
    .index("byBlockerBlocked", ["blockerId", "blockedId"]),

  /* Social: server events */
  serverEvents: defineTable({
    serverId: v.id("servers"),
    creatorId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    location: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byServer", ["serverId"]),
});
