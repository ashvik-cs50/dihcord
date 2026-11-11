import { cn, avatarColor, initials, isOnline } from "@/lib/utils";
import type { UserStatus } from "@/types";

const SIZES: Record<string, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

export function Avatar({
  name,
  id,
  url,
  size = "md",
  status,
  lastSeenAt,
  showPresence = false,
  className,
}: {
  name: string;
  id: string;
  url?: string | null;
  size?: keyof typeof SIZES | number;
  status?: UserStatus;
  lastSeenAt?: number;
  showPresence?: boolean;
  className?: string;
}) {
  const px = typeof size === "number" ? size : SIZES[size];
  const online = status && lastSeenAt !== undefined
    ? isOnline(status, lastSeenAt)
    : status ? status !== "offline" && status !== "invisible" : true;
  return (
    <div
      className={cn("relative shrink-0 select-none", className)}
      style={{ width: px, height: px }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
          style={{
            background: avatarColor(id),
            fontSize: Math.max(9, px * 0.38),
          }}
        >
          {initials(name)}
        </div>
      )}
      {showPresence && status && (
        <span
          className={cn(
            "presence-dot absolute right-0 bottom-0",
            online ? "online" : status === "idle" ? "idle" : status === "dnd" ? "dnd" : "invisible",
          )}
        />
      )}
    </div>
  );
}