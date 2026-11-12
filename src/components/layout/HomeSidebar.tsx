import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  Users,
  Search as SearchIcon,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Avatar } from "@/components/ui/Avatar";
import { UserPanel } from "@/components/layout/UserPanel";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { cn, formatMessageTime, isOnline } from "@/lib/utils";
import type { DmSummary } from "@/types";

export function HomeSidebar() {
  const { token, unreadChannels } = useAuth();
  const { openModal, pushToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const { channelId: activeChannelId } = useParams();

  const dms = useQuery(
    api.dms.listMine,
    token ? { token } : "skip",
  ) as DmSummary[] | undefined;

  const hiddenDms = useQuery(
    api.dms.listHiddenChats,
    token ? { token } : "skip",
  ) as (DmSummary & { hidden: boolean })[] | undefined;

  const hideChat = useMutation(api.dms.toggleHiddenChat);
  const deleteDm = useMutation(api.dms.deleteDm);

  const sorted = [...(dms ?? [])].sort(
    (a, b) =>
      (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
  );

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    channelId: string;
    hidden: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = sorted.filter((dm) => !dm.hidden);
  const hidden = (hiddenDms ?? []).filter(Boolean);

  const toggleHide = (channelId: string, currentlyHidden: boolean) => {
    setMenu(null);
    void hideChat({
      token: token!,
      channelId: channelId as Id<"channels">,
      hidden: !currentlyHidden,
    }).then(() => {
      pushToast(currentlyHidden ? "Chat unhidden" : "Chat hidden", "success");
    }).catch((err: Error) => pushToast(err.message, "error"));
  };

  const handleDelete = async (channelId: string) => {
    setMenu(null);
    if (
      !window.confirm(
        "Delete this conversation? This removes the chat and its messages for you.",
      )
    )
      return;
    setDeleting(channelId);
    try {
      await deleteDm({ token: token!, channelId: channelId as Id<"channels"> });
      pushToast("Conversation deleted", "success");
      if (activeChannelId === channelId) navigate("/@me");
    } catch (err: Error) {
      pushToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const menuItems = (channelId: string, hidden: boolean) => [
    {
      label: hidden ? "Unhide chat" : "Hide chat",
      icon: hidden ? <Eye size={14} /> : <EyeOff size={14} />,
      onClick: () => toggleHide(channelId, hidden),
    },
    {
      label: "Delete conversation",
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => handleDelete(channelId),
    },
  ];

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
          {visible.map((dm) => {
            const other = dm.otherUser;
            const active = activeChannelId === dm.channelId;
            const unread = dm.unread;
            const deletingNow = deleting === dm.channelId;
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, channelId: dm.channelId, hidden: false });
                  }}
                  ref={menuRef}
                  onClick={() => {
                    setMenu(null);
                    if (other) navigate(`/@me/${dm.channelId}`);
                  }}
                  className={cn(
                    "relative flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
                    active ? "bg-bg-3" : unread > 0 ? "text-text font-medium hover:bg-bg-2" : "text-text-dim hover:bg-bg-2 hover:text-text",
                  )}
                >
                  {other ? (
                    <Avatar
                      name={other.displayName}
                      id={other._id}
                      url={other.avatarUrl}
                      avatarKey={other.defaultAvatarKey}
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
                  <MoreHorizontal size={16} className="shrink-0 opacity-0 group-hover:opacity-100 text-text-faint hover:text-text" />
                </motion.button>
                {menu && menu.channelId === dm.channelId && (
                  <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menuItems(dm.channelId, false)}
                    onClose={() => setMenu(null)}
                  />
                )}
                {deletingNow && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center rounded bg-black/40 backdrop-blur"
                  >
                    <span className="text-xs text-text">Deleting…</span>
                  </motion.div>
                )}
              </motion.li>
            );
          })}
          {visible.length === 0 && (
            <li className="px-2 py-2 text-xs text-text-faint">
              No conversations yet. Add a friend and send a message.
            </li>
          )}
        </AnimatePresence>

        {hidden.length > 0 && (
          <div className="mt-3">
            <motion.button
              whileHover={{ backgroundColor: "var(--color-bg-2)" }}
              onClick={() => setMenu(null)}
              className="mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold tracking-wide text-text-faint uppercase transition-colors hover:text-text"
            >
              <Eye size={12} className="shrink-0" />
              Hidden chats ({hidden.length})
            </motion.button>
            <div className="overflow-hidden transition-all duration-200">
              <AnimatePresence>
                {hidden.map((dm) => {
                  const other = dm.otherUser;
                  const deletingNow = deleting === dm.channelId;
                  return (
                    <motion.li
                      key={dm.channelId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="mb-1"
                    >
                      <motion.button
                        whileHover={{ backgroundColor: "var(--color-bg-2)" }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMenu({ x: e.clientX, y: e.clientY, channelId: dm.channelId, hidden: true });
                        }}
                        ref={menuRef}
                        onClick={() => {
                          setMenu(null);
                          if (other) navigate(`/@me/${dm.channelId}`);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-text-dim bg-bg-2/50 hover:bg-bg-3 hover:text-text transition-colors"
                      >
                        {other ? (
                          <Avatar
                            name={other.displayName}
                            id={other._id}
                            url={other.avatarUrl}
                            avatarKey={other.defaultAvatarKey}
                            size={30}
                            status={other.status}
                            lastSeenAt={other.lastSeenAt}
                            showPresence
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-bg-3" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sm text-text-dim">
                              {other?.displayName ?? "Unknown"}
                            </span>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-text-faint" />
                          </div>
                          {dm.lastMessage && (
                            <div className="truncate text-[11px] text-text-faint">
                              {dm.lastMessage.content || "(attachment)"}
                            </div>
                          )}
                        </div>
                        <Eye size={14} className="shrink-0 opacity-50 text-accent" />
                      </motion.button>
                      {menu && menu.channelId === dm.channelId && (
                        <ContextMenu
                          x={menu.x}
                          y={menu.y}
                          items={menuItems(dm.channelId, true)}
                          onClose={() => setMenu(null)}
                        />
                      )}
                      {deletingNow && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center rounded bg-black/40 backdrop-blur"
                        >
                          <span className="text-xs text-text">Deleting…</span>
                        </motion.div>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <UserPanel />
    </aside>
  );
}
