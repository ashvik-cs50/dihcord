import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { validateTokenWrite, validateTokenRead, tokenField } from "./helpers";

type FriendUser = {
  friendshipId: Id<"friendships">;
  _id: Id<"users">;
  username: string;
  displayName: string;
  avatarStorageId?: Id<"_storage">;
  accentColor?: string;
  status: Doc<"users">["status"];
  customStatus?: string;
  lastSeenAt: number;
  avatarUrl: string | null;
};

export const list = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const outgoing = await ctx.db
      .query("friendships")
      .withIndex("bySender", (q) => q.eq("senderId", user._id))
      .collect();
    const incoming = await ctx.db
      .query("friendships")
      .withIndex("byReceiver", (q) => q.eq("receiverId", user._id))
      .collect();

    const friends: FriendUser[] = [];
    for (const f of [...outgoing, ...incoming]) {
      if (f.status !== "accepted") continue;
      const otherId = f.senderId === user._id ? f.receiverId : f.senderId;
      const other = await ctx.db.get(otherId);
      if (!other) continue;
      friends.push({
        friendshipId: f._id,
        _id: other._id,
        username: other.username,
        displayName: other.displayName,
        avatarStorageId: other.avatarStorageId,
        accentColor: other.accentColor,
        status: other.status,
        customStatus: other.customStatus,
        lastSeenAt: other.lastSeenAt,
        avatarUrl: other.avatarStorageId
          ? await ctx.storage.getUrl(other.avatarStorageId)
          : null,
      });
    }

    const incomingRequests: FriendUser[] = [];
    for (const f of incoming) {
      if (f.status !== "pending") continue;
      const other = await ctx.db.get(f.senderId);
      if (!other) continue;
      incomingRequests.push({
        friendshipId: f._id,
        _id: other._id,
        username: other.username,
        displayName: other.displayName,
        avatarStorageId: other.avatarStorageId,
        accentColor: other.accentColor,
        status: other.status,
        customStatus: other.customStatus,
        lastSeenAt: other.lastSeenAt,
        avatarUrl: other.avatarStorageId
          ? await ctx.storage.getUrl(other.avatarStorageId)
          : null,
      });
    }

    const outgoingRequests: FriendUser[] = [];
    for (const f of outgoing) {
      if (f.status !== "pending") continue;
      const other = await ctx.db.get(f.receiverId);
      if (!other) continue;
      outgoingRequests.push({
        friendshipId: f._id,
        _id: other._id,
        username: other.username,
        displayName: other.displayName,
        avatarStorageId: other.avatarStorageId,
        accentColor: other.accentColor,
        status: other.status,
        customStatus: other.customStatus,
        lastSeenAt: other.lastSeenAt,
        avatarUrl: other.avatarStorageId
          ? await ctx.storage.getUrl(other.avatarStorageId)
          : null,
      });
    }

    return { friends, incomingRequests, outgoingRequests };
  },
});

export const sendRequest = mutation({
  args: { ...tokenField, username: v.string() },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const username = args.username.trim().toLowerCase();
    const target = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", username))
      .unique();
    if (!target) throw new Error("No user with that username exists");
    if (target._id === user._id) throw new Error("You cannot add yourself");

    const existing = await ctx.db
      .query("friendships")
      .withIndex("bySenderAndReceiver", (q) =>
        q.eq("senderId", user._id).eq("receiverId", target._id),
      )
      .unique();
    const reverse = await ctx.db
      .query("friendships")
      .withIndex("bySenderAndReceiver", (q) =>
        q.eq("senderId", target._id).eq("receiverId", user._id),
      )
      .unique();

    if (existing && existing.status === "accepted") {
      throw new Error("You are already friends");
    }
    if (existing && existing.status === "pending") {
      throw new Error("Friend request already sent");
    }
    if (reverse && reverse.status === "pending") {
      await ctx.db.patch(reverse._id, { status: "accepted" });
      return { accepted: true };
    }
    if (reverse && reverse.status === "accepted") {
      throw new Error("You are already friends");
    }
    await ctx.db.insert("friendships", {
      senderId: user._id,
      receiverId: target._id,
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: target._id,
      type: "friendRequest",
      actorId: user._id,
      read: false,
      createdAt: Date.now(),
    });
    return { accepted: false };
  },
});

export const accept = mutation({
  args: { ...tokenField, friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friend request not found");
    if (friendship.receiverId !== user._id) {
      throw new Error("You can only accept requests sent to you");
    }
    await ctx.db.patch(args.friendshipId, { status: "accepted" });
  },
});

export const decline = mutation({
  args: { ...tokenField, friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friend request not found");
    if (friendship.receiverId !== user._id) {
      throw new Error("You can only decline requests sent to you");
    }
    await ctx.db.delete(args.friendshipId);
  },
});

export const remove = mutation({
  args: { ...tokenField, friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await validateTokenWrite(ctx.db, args.token);
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friendship not found");
    if (friendship.senderId !== user._id && friendship.receiverId !== user._id) {
      throw new Error("You are not part of this friendship");
    }
    await ctx.db.delete(args.friendshipId);
  },
});
