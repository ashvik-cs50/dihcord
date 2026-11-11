/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as dms from "../dms.js";
import type * as emojis from "../emojis.js";
import type * as events from "../events.js";
import type * as friendships from "../friendships.js";
import type * as helpers from "../helpers.js";
import type * as memberships from "../memberships.js";
import type * as messages from "../messages.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as polls from "../polls.js";
import type * as premium from "../premium.js";
import type * as reactions from "../reactions.js";
import type * as scheduled from "../scheduled.js";
import type * as servers from "../servers.js";
import type * as stickers from "../stickers.js";
import type * as threads from "../threads.js";
import type * as typing from "../typing.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  channels: typeof channels;
  dms: typeof dms;
  emojis: typeof emojis;
  events: typeof events;
  friendships: typeof friendships;
  helpers: typeof helpers;
  memberships: typeof memberships;
  messages: typeof messages;
  moderation: typeof moderation;
  notifications: typeof notifications;
  polls: typeof polls;
  premium: typeof premium;
  reactions: typeof reactions;
  scheduled: typeof scheduled;
  servers: typeof servers;
  stickers: typeof stickers;
  threads: typeof threads;
  typing: typeof typing;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
