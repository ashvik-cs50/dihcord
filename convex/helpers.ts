import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type SessionUser = {
  _id: Id<"users">;
  username: string;
  displayName: string;
  avatarStorageId?: Id<"_storage">;
  defaultAvatarKey?: string;
  accentColor?: string;
  themeId?: string;
  customTheme?: string;
  status: Doc<"users">["status"];
  customStatus?: string;
  lastSeenAt: number;
  createdAt: number;
};

export const validateTokenRead = async (
  db: QueryCtx["db"],
  token: string,
): Promise<Doc<"users">> => {
  const session = await db
    .query("sessions")
    .withIndex("token", (q) => q.eq("token", token))
    .unique();
  if (!session) throw new Error("Not authenticated");
  if (session.expiresAt < Date.now()) throw new Error("Session expired");
  const user = await db.get(session.userId);
  if (!user) throw new Error("User no longer exists");
  return user;
};

export const validateTokenWrite = async (
  db: MutationCtx["db"],
  token: string,
): Promise<Doc<"users">> => {
  const session = await db
    .query("sessions")
    .withIndex("token", (q) => q.eq("token", token))
    .unique();
  if (!session) throw new Error("Not authenticated");
  if (session.expiresAt < Date.now()) {
    await db.delete(session._id);
    throw new Error("Session expired");
  }
  const user = await db.get(session.userId);
  if (!user) throw new Error("User no longer exists");
  return user;
};

export const publicUser = (user: Doc<"users">): SessionUser => ({
  _id: user._id,
  username: user.username,
  displayName: user.displayName,
  avatarStorageId: user.avatarStorageId,
  defaultAvatarKey: user.defaultAvatarKey,
  accentColor: user.accentColor,
  themeId: user.themeId,
  customTheme: user.customTheme,
  status: user.status,
  customStatus: user.customStatus,
  lastSeenAt: user.lastSeenAt,
  createdAt: user.createdAt,
});

export const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONTENT_PREVIEW = 120;
export const presenceWindowMs = 90_000;
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/* Locally hosted default avatars — no external links, never broken */
export const DEFAULT_AVATAR_KEYS: readonly string[] = [
  "avatars/default-01.svg",
  "avatars/default-02.svg",
  "avatars/default-03.svg",
  "avatars/default-04.svg",
  "avatars/default-05.svg",
  "avatars/default-06.svg",
  "avatars/default-07.svg",
  "avatars/default-08.svg",
  "avatars/default-09.svg",
  "avatars/default-10.svg",
  "avatars/default-11.svg",
  "avatars/default-12.svg",
];

export const randomDefaultAvatarKey = (): string => {
  return DEFAULT_AVATAR_KEYS[
    Math.floor(Math.random() * DEFAULT_AVATAR_KEYS.length)
  ];
};

export const generateToken = (length = 48): string => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const generateInviteCode = (): string => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const requireMember = async (
  db: QueryCtx["db"],
  token: string,
  serverId: Id<"servers">,
) => {
  const user = await validateTokenRead(db, token);
  const membership = await db
    .query("memberships")
    .withIndex("byServerAndUser", (q) =>
      q.eq("serverId", serverId).eq("userId", user._id),
    )
    .unique();
  if (!membership) throw new Error("You are not a member of this server");
  return { user, membership };
};

export const requireChannelAccess = async (
  db: QueryCtx["db"],
  token: string,
  channelId: Id<"channels">,
): Promise<{ user: Doc<"users">; channel: Doc<"channels"> }> => {
  const user = await validateTokenRead(db, token);
  const channel = await db.get(channelId);
  if (!channel) throw new Error("Channel not found");
  if (channel.type === "dm") {
    const member = await db
      .query("dmMembers")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("channelId"), channelId))
      .first();
    if (!member) throw new Error("You do not have access to this conversation");
  } else {
    if (!channel.serverId) throw new Error("Channel has no server");
    const serverId = channel.serverId;
    const membership = await db
      .query("memberships")
      .withIndex("byServerAndUser", (q) =>
        q.eq("serverId", serverId).eq("userId", user._id),
      )
      .unique();
    if (!membership) throw new Error("You are not a member of this server");
  }
  return { user, channel };
};

export const canModerate = (role: "owner" | "admin" | "member") =>
  role === "owner" || role === "admin";

export const tokenField = { token: v.string() };
