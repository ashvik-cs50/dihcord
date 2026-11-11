import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;

export const convexClient = new ConvexReactClient(CONVEX_URL);

export { api };
