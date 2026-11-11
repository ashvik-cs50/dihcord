import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router";
import { Users, Search as SearchIcon } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Avatar } from "@/components/ui/Avatar";
import { UserPanel } from "@/components/layout/UserPanel";
import { cn, formatMessageTime, isOnline } from "@/lib/utils";
import type { DmSummary } from "@/types";

export function HomeSidebar() {
  const { token, unreadChannels } = useAuth();
  const { openModal } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const { channelId: activeChannelId } = useParams();

  const dms = useQuery(
    api.dms.listMine,
    token ? { token } : "skip",
  ) as DmSummary[] | undefined;

  const sorted = [...(dms ?? [])].sort(
    (a, b) =>
      (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
  );

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-bg-1">
      <header className="flex h-12 shrink-0 items-center gap-2 px-3">
        <button
          onClick={() => openModal("search")}
          className="flex w-full items-center gap-2 rounded border border-line bg-bg-deep px-2 py-1.5 text-xs text-text-faint transition-colors hover:border-line-strong"
        >
          <SearchIcon size={13} />
          Search (Ctrl+K)
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <motion.button
          whileHover={{ backgroundColor: "var(--color-bg-2)" }}
          onClick={() => navigate("/@me")}
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
            location.pathname === "/@me"
              ? "bg-bg-3 text-text"
              : "text-text-dim hover:bg-bg-2 hover:text-text",
          )}
        >
          <Users size={16} />
          Friends
        </motion.button>

        <h3 className="px-2 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
          Direct messages
        </h3>
        <AnimatePresence>
          {sorted.map((dm) => {
            const other = dm.otherUser;
            const active = activeChannelId === dm.channelId;
            const unread = dm.unread;
            return (
              <motion.li
                key={dm.channelId}
                whileHover={{ backgroundColor: "var(--color-bg-2)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/@me/${dm.channelId}`)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
                    active
                      ? "bg-bg-3"
                      : unread > 0
                        ? "text-text font-medium hover:bg-bg-2"
                        : "text-text-dim hover:bg-bg-2 hover:text-text",
                  )}
                >
                  {other ? (
                    <Avatar
                      name={other.displayName}
                      id={other._id}
                      url={other.avatarUrl}
                      size={32}
                      status={other.status}
                      lastSeenAt={other.lastSeenAt}
                      showPresence
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-bg-3" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm">
                        {other?.displayName ?? "Unknown"}
                      </span>
                      {other && isOnline(other.status, other.lastSeenAt) && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                    {dm.lastMessage && !active && (
                      <div className="truncate text-[11px] text-text-faint">
                        {dm.lastMessage.content || "(attachment)"} ·{" "}
                        {formatMessageTime(dm.lastMessage.createdAt)}
                      </div>
                    )}
                  </div>
                  {(unreadChannels?.[dm.channelId] ?? dm.unread) > 0 && (
                    <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {Math.min(99, unread)}
                    </span>
                  )}
                </motion.button>
              </motion.li>
            );
          })}
          {sorted.length === 0 && (
            <li className="px-2 py-2 text-xs text-text-faint">
              No conversations yet. Add a friend and send a message.
            </li>
          )}
        </AnimatePresence>
      </div>
      <UserPanel />
    </aside>
  );
}