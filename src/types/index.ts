import type { Id } from "@convex/_generated/dataModel";

export type UserStatus = "online" | "idle" | "dnd" | "invisible" | "offline";

export type Me = {
  _id: Id<"users">;
  username: string;
  displayName: string;
  avatarStorageId?: Id<"_storage">;
  defaultAvatarKey?: string;
  accentColor?: string;
  themeId?: string;
  customTheme?: string;
  status: UserStatus;
  customStatus?: string;
  lastSeenAt: number;
  createdAt: number;
  avatarUrl: string | null;
};

export type ServerSummary = {
  _id: Id<"servers">;
  name: string;
  iconEmoji?: string;
  iconStorageId?: Id<"_storage">;
  ownerId: Id<"users">;
  role: "owner" | "admin" | "member";
};

export type ServerDetail = {
  _id: Id<"servers">;
  name: string;
  description?: string;
  iconEmoji?: string;
  iconStorageId?: Id<"_storage">;
  isPublic: boolean;
  inviteCode: string;
  ownerId: Id<"users">;
  createdAt: number;
  myRole: "owner" | "admin" | "member";
};

export type ExploreServer = {
  _id: Id<"servers">;
  name: string;
  description?: string;
  iconEmoji?: string;
  iconStorageId?: Id<"_storage">;
  memberCount: number;
  inviteCode: string;
};

export type Channel = {
  _id: Id<"channels">;
  serverId?: Id<"servers">;
  name: string;
  type: "text" | "voice" | "dm";
  category?: string;
  createdAt: number;
};

export type Attachment = {
  storageId: Id<"_storage">;
  name: string;
  mimeType: string;
  size: number;
  url: string | null;
};

export type ReplyRef = {
  messageId: Id<"messages">;
  authorId: Id<"users">;
  authorName: string;
  contentPreview: string;
};

export type Message = {
  _id: Id<"messages">;
  _creationTime: number;
  channelId: Id<"channels">;
  serverId?: Id<"servers">;
  authorId: Id<"users">;
  content: string;
  attachments: Attachment[];
  replyTo?: ReplyRef;
  createdAt: number;
  editedAt?: number;
};

export type Member = {
  membershipId: Id<"memberships">;
  userId: Id<"users">;
  role: "owner" | "admin" | "member";
  nickname?: string;
  joinedAt: number;
  username: string;
  displayName: string;
  avatarStorageId?: Id<"_storage">;
  defaultAvatarKey?: string;
  avatarUrl: string | null;
  accentColor?: string;
  themeId?: string;
  customTheme?: string;
  status: UserStatus;
  customStatus?: string;
  lastSeenAt: number;
};

export type FriendUser = {
  friendshipId: Id<"friendships">;
  _id: Id<"users">;
  username: string;
  displayName: string;
  avatarStorageId?: Id<"_storage">;
  defaultAvatarKey?: string;
  accentColor?: string;
  themeId?: string;
  customTheme?: string;
  status: UserStatus;
  customStatus?: string;
  lastSeenAt: number;
  avatarUrl: string | null;
};

export type DmSummary = {
  channelId: Id<"channels">;
  otherUser: {
    _id: Id<"users">;
    username: string;
    displayName: string;
    avatarStorageId?: Id<"_storage">;
    defaultAvatarKey?: string;
    accentColor?: string;
    themeId?: string;
    customTheme?: string;
    status: UserStatus;
    lastSeenAt: number;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    content: string;
    authorId: Id<"users">;
    createdAt: number;
  } | null;
  unread: number;
};

export type Reaction = {
  _id: Id<"reactions">;
  messageId: Id<"messages">;
  userId: Id<"users">;
  emoji: string;
};

export type Notification = {
  _id: Id<"notifications">;
  type: "mention" | "friendRequest";
  actor: {
    _id: Id<"users">;
    username: string;
    displayName: string;
    avatarStorageId?: Id<"_storage">;
    defaultAvatarKey?: string;
    accentColor?: string;
    avatarUrl: string | null;
  } | null;
  serverId?: Id<"servers">;
  channelId?: Id<"channels">;
  messageId?: Id<"messages">;
  serverName?: string;
  channelName?: string;
  read: boolean;
  createdAt: number;
};

export type Profile = Me;
