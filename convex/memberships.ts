import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireMember, validateTokenRead, canModerate, tokenField } from "./helpers";

export const listMembers = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireMember(ctx.db, args.token, args.serverId);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byServer", (q) => q.eq("serverId", args.serverId))
      .collect();
    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          membershipId: m._id,
          userId: user._id,
          role: m.role,
          nickname: m.nickname,
          joinedAt: m.joinedAt,
          username: user.username,
          displayName: user.displayName,
          avatarStorageId: user.avatarStorageId,
          avatarUrl: user.avatarStorageId
            ? await ctx.storage.getUrl(user.avatarStorageId)
            : null,
          accentColor: user.accentColor,
          status: user.status,
          customStatus: user.customStatus,
          lastSeenAt: user.lastSeenAt,
        };
      }),
    );
  },
});

export const myServers = query({
  args: tokenField,
  handler: async (ctx, args) => {
    const user = await validateTokenRead(ctx.db, args.token);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", user._id))
      .collect();
    return Promise.all(
      memberships.map(async (m) => {
        const server = await ctx.db.get(m.serverId);
        return server ? { membershipId: m._id, role: m.role, server } : null;
      }),
    );
  },
});

export const canModerateServer = query({
  args: { ...tokenField, serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const { membership } = await requireMember(ctx.db, args.token, args.serverId);
    return canModerate(membership.role);
  },
});
