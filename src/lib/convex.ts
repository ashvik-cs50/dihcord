import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

export const convexClient =
  CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

export { api };

export function isConvexConfigured(): boolean {
  return !!CONVEX_URL;
}