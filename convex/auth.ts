"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  USERNAME_REGEX,
  generateToken,
  SESSION_DURATION_MS,
} from "./helpers";

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string): boolean => {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
};

export const signup = action({
  args: {
    username: v.string(),
    displayName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ token: string; userId: Id<"users"> }> => {
    const username = args.username.trim().toLowerCase();
    const displayName = args.displayName.trim();
    if (!USERNAME_REGEX.test(username)) {
      throw new Error(
        "Username must be 3-24 characters: lowercase letters, numbers, underscores",
      );
    }
    if (displayName.length < 1 || displayName.length > 32) {
      throw new Error("Display name must be 1-32 characters");
    }
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const existing = await ctx.runQuery(internal.users.getByUsername, {
      username,
    });
    if (existing) throw new Error("That username is already taken");

    const token = generateToken();
    const userId = await ctx.runMutation(internal.users.createUserWithSession, {
      username,
      displayName,
      passwordHash: hashPassword(args.password),
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return { token, userId };
  },
});

export const login = action({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ token: string; userId: Id<"users"> }> => {
    const username = args.username.trim().toLowerCase();
    const auth = await ctx.runQuery(internal.users.getAuthByUsername, {
      username,
    });
    if (!auth) throw new Error("Invalid username or password");
    if (!verifyPassword(args.password, auth.passwordHash)) {
      throw new Error("Invalid username or password");
    }
    const token = generateToken();
    await ctx.runMutation(internal.users.createSession, {
      userId: auth._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return { token, userId: auth._id };
  },
});
