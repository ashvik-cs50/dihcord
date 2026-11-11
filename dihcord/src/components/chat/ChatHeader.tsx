import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { Hash, Search, Bell, BellOff, Volume2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { formatFullTimestamp } from "@/lib/utils";
import type { Channel, Notification } from "@/types";

export function ChatHeader({
  channel,
  isDm,
  otherUser,
  subtitle,
}: {
  channel?: Channel;
  isDm?: boolean;
  otherUser?: {
    displayName: string;
    username: string;
    status: string;
    lastSeenAt: number;
    customStatus?: string;
  } | null;
  subtitle?: string;
}) {
  const { token } = useAuth();
  const { openModal } = useUI();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(
    api.notifications.listMine,
    token ? { token } : "skip",
  ) as Notification[] | undefined;

  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const jumpToNotification = (n: Notification) => {
    setBellOpen(false);
    if (!n.channelId) return;
    if (n.serverId) {
      navigate(`/channels/${n.serverId}/${n.channelId}`);
    } else {
      navigate(`/@me/${n.channelId}`);
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
      <div className="flex min-w-0 items-center gap-2">
        {isDm ? null : channel?.type === "voice" ? (
          <Volume2 size={20} className="text-text-faint" />
        ) : (
          <Hash size={20} className="text-text-faint" />
        )}
        <span className="truncate font-semibold text-text">
          {isDm ? otherUser?.displayName ?? "Direct message" : channel?.name}
        </span>
      </div>
      <span className="hidden truncate border-l border-line pl-3 text-xs text-text-dim xl:block">
        {subtitle ?? ""}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => openModal("search", { channelId: channel?._id })}
          title="Search messages"
          className="rounded p-1.5 text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
        >
          <Search size={17} />
        </button>
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => {
              setBellOpen((v) => !v);
              if (unread > 0 && token) {
                void markAllRead({ token }).catch(() => {});
              }
            }}
            title="Notifications"
            className="relative rounded p-1.5 text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
          >
            {unread > 0 ? (
              <Bell size={17} className="text-accent animate-ping" />
            ) : (
              <BellOff size={17} />
            )}
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </button>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 z-50 mt-1 max-h-96 w-80 overflow-y-auto rounded-xl border border-line bg-surface-elevated shadow-2xl"
            >
              <div className="border-b border-line px-3 py-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
                Notifications
              </div>
              {notifications && notifications.length === 0 && (
                <p className="px-3 py-4 text-xs text-text-faint">
                  Nothing yet. Mentions and friend requests will show up here.
                </p>
              )}
              {notifications?.map((n) => (
                <motion.button
                  key={n._id}
                  whileHover={{ backgroundColor: "var(--color-bg-3)" }}
                  onClick={() => {
                    if (token) void markRead({ token, notificationId: n._id }).catch(() => {});
                    jumpToNotification(n);
                  }}
                  className="block w-full border-b border-line/60 px-3 py-2.5 text-left transition-colors hover:bg-bg-3"
                >
                  <div className="text-[13px] text-text">
                    {n.type === "mention" ? (
                      <>
                        <span className="font-semibold">
                          {n.actor?.displayName ?? "Someone"}
                        </span>{" "}
                        mentioned you in{" "}
                        <span className="text-accent">
                          {n.serverName
                            ? `#${n.channelName} · ${n.serverName}`
                            : `@${n.channelName}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">
                          {n.actor?.displayName ?? "Someone"}
                        </span>{" "}
                        sent you a friend request
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-faint">
                    {formatFullTimestamp(n.createdAt)}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}