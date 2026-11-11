import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Id } from "@convex/_generated/dataModel";

export function TypingIndicator({ channelId }: { channelId: Id<"channels"> }) {
  const { token } = useAuth();
  const [, tick] = useState(0);

  const typers = useQuery(
    api.typing.listTyping,
    token ? { token, channelId } : "skip",
  ) as { userId: string; displayName: string }[] | undefined;

  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 1500);
    return () => clearInterval(interval);
  }, []);

  if (!typers || typers.length === 0) return null;
  const names = typers.map((t) => t.displayName);
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names.length} people are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-1.5 pb-0.5 text-[11px] text-text-dim"
    >
      <span className="flex gap-0.5">
        <Dot delay="0ms" />
        <Dot delay="160ms" />
        <Dot delay="320ms" />
      </span>
      {label}
    </motion.div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <motion.span
      animate={{
        scale: [1, 1.3, 1],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: parseFloat(delay) / 1000 },
      }}
      className="inline-block h-1 w-1 rounded-full bg-accent"
    />
  );
}