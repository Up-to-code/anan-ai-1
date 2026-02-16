import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
export const convex = new ConvexReactClient(convexUrl);

export { api } from "../../convex/_generated/api";
