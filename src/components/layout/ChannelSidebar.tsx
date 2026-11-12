import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import {
  Hash,
  Volume2,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  Mic,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { UserPanel } from "./UserPanel";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { cn } from "@/lib/utils";
import type { Channel, ServerDetail } from "@/types";

export function ChannelSidebar({
  channels,
  server,
}: {
  channels: Channel[] | undefined;
  server: ServerDetail | undefined;
}) {
  const { token, unreadChannels } = useAuth();
  const { openModal, pushToast } = useUI();
  const navigate = useNavigate();
  const { channelId: activeChannelId } = useParams();

  const canModerate =
    !!server && (server.myRole === "owner" || server.myRole === "admin");

  const hiddenChannels = useQuery(
    api.channels.listHiddenServerChannels,
    token && server?._id ? { token, serverId: server._id } : "skip",
  ) as { _id: string; name: string; type: string }[] | undefined;

  const toggleHiddenChat = useMutation(api.dms.toggleHiddenChat);
  const deleteChannel = useMutation(api.channels.remove);

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    channelId: string;
    hidden: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const toggleHideChannel = (channelId: string, currentlyHidden: boolean) => {
    setMenu(null);
    void toggleHiddenChat({
      token: token!,
      channelId: channelId as Id<"channels">,
      hidden: !currentlyHidden,
    })
      .then(() => pushToast(currentlyHidden ? "Channel unhidden" : "Channel hidden", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const handleDeleteChannel = async (channelId: string) => {
    setMenu(null);
    if (!canModerate || !server) return;
    if (
      !window.confirm(
        `Delete this channel? This removes the channel and all its messages.`,
      )
    )
      return;
    setDeleting(channelId);
    try {
      await deleteChannel({ token: token!, channelId: channelId as Id<"channels"> });
      pushToast("Channel deleted", "success");
      if (activeChannelId === channelId && server._id) {
        navigate(`/channels/${server._id}`);
      }
    } catch (err: Error) {
      pushToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const channelMenuItems = (channelId: string) => {
    const items: ContextMenuItem[] = [
      {
        label: "Hide channel",
        icon: <EyeOff size={14} />,
        onClick: () => toggleHideChannel(channelId, false),
      },
    ];
    if (canModerate) {
      items.push({
        label: "Edit channel",
        icon: <Settings size={14} />,
        onClick: () => {
          setMenu(null);
          const ch = channels?.find((c) => c._id === channelId);
          if (ch) {
            openModal("editChannel", {
              channelId: ch._id,
              channelName: ch.name,
            });
          }
        },
      });
      items.push({
        label: "Delete channel",
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDeleteChannel(channelId),
      });
    } else {
      items.push({
        label: "Invite people",
        icon: <Settings size={14} />,
        onClick: () => {
          setMenu(null);
          openModal("invite", {
            serverId: server?._id,
            serverName: server?.name,
          });
        },
      });
    }
    return items;
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("dihcord:collapsed") ?? "{}");
    } catch {
      return {};
    }
  });

  const toggleCategory = (category: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [category]: !prev[category] };
      localStorage.setItem("dihcord:collapsed", JSON.stringify(next));
      return next;
    });
  };

  const grouped = new Map<string, Channel[]>();
  for (const channel of channels ?? []) {
    const key = channel.category ?? "UNCATEGORIZED";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(channel);
  }

  const hiddenRows = (hiddenChannels ?? []).map((ch) => (
    <HiddenChannelRow
      key={ch._id}
      ch={ch}
      active={activeChannelId === ch._id}
      deletingNow={deleting === ch._id}
      menu={menu}
      setMenu={setMenu}
                  toggleHideChannel={toggleHideChannel}
                  handleDeleteChannel={handleDeleteChannel}
                  canModerate={canModerate}
                  server={server}
                />
  ));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-bg-1">
      <header
        className="flex h-12 shrink-0 cursor-pointer items-center justify-between px-4 transition-colors hover:bg-bg-3"
        onClick={() =>
          canModerate
            ? openModal("serverSettings", { serverId: server?._id })
            : openModal("invite", {
                serverId: server?._id,
                serverName: server?.name,
              })
        }
      >
        <span className="truncate text-[15px] font-semibold text-text">
          {server?.name ?? ""}
        </span>
        {canModerate ? (
          <Settings size={16} className="shrink-0 text-text-faint" />
        ) : (
          <Users size={16} className="shrink-0 text-text-faint" />
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {Array.from(grouped.entries()).map(([category, list]) => (
          <div key={category} className="mb-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => toggleCategory(category)}
              className="group flex w-full items-center gap-0.5 rounded px-1.5 py-1 text-[11px] font-semibold tracking-wide text-text-faint uppercase transition-colors hover:text-text"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: collapsed[category] ? -90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="shrink-0"
              >
                {collapsed[category] ? (
                  <ChevronRight size={11} />
                ) : (
                  <ChevronDown size={11} />
                )}
              </motion.div>
              <span className="truncate">{category}</span>
              {canModerate && (
                <span
                  className="ml-auto rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("createChannel", {
                      serverId: server?._id,
                      category,
                      channelType:
                        list[0]?.type === "voice" ? "voice" : "text",
                    });
                  }}
                >
                  <Plus size={14} />
                </span>
              )}
            </motion.button>
            <AnimatePresence mode="wait">
              {!collapsed[category] && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="mt-0.5 overflow-hidden"
                >
                  {list.map((channel) => {
                    const unread = unreadChannels?.[channel._id] ?? 0;
                    const active = activeChannelId === channel._id;
                    const isVoice = channel.type === "voice";
                    return (
                      <motion.li
                        key={channel._id}
                        whileHover={{ backgroundColor: "var(--color-bg-2)" }}
                        className="mb-0.5 relative"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMenu({
                            x: e.clientX,
                            y: e.clientY,
                            channelId: channel._id,
                            hidden: false,
                          });
                        }}
                      >
                        <div
                          className={cn(
                            "group relative flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm transition-colors",
                            active
                              ? "bg-bg-3 text-text"
                              : unread > 0
                                ? "font-medium text-text hover:bg-bg-2"
                                : "text-text-dim hover:bg-bg-2 hover:text-text",
                          )}
                        >
                          <button
                            onClick={() => {
                              if (isVoice) {
                                pushToast(
                                  "Voice chat requires LiveKit credentials.",
                                  "info",
                                );
                              } else {
                                navigate(
                                  `/channels/${channel.serverId}/${channel._id}`,
                                );
                              }
                            }}
                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                          >
                            {isVoice ? (
                              <Volume2
                                size={16}
                                className="shrink-0 text-text-faint"
                              />
                            ) : (
                              <Hash size={16} className="shrink-0 text-text-faint" />
                            )}
                            <span className="truncate">{channel.name}</span>
                          </button>
                          {unread > 0 && !active && (
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="ml-auto flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
                            >
                              {Math.min(99, unread)}
                            </motion.div>
                          )}
                          {canModerate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal("editChannel", {
                                  channelId: channel._id,
                                  channelName: channel.name,
                                });
                              }}
                              title="Edit channel"
                              className="ml-auto hidden shrink-0 rounded p-0.5 text-text-faint transition-colors group-hover:block"
                            >
                              <Settings size={14} />
                            </button>
                          )}
                          <MoreHorizontal
                            size={16}
                            className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 text-text-faint hover:text-text"
                          />
                        </div>
                        {menu && menu.channelId === channel._id && (
                          <ContextMenu
                            x={menu.x}
                            y={menu.y}
                            items={channelMenuItems(channel._id)}
                            onClose={() => setMenu(null)}
                          />
                        )}
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}

        {hiddenChannels && hiddenChannels.length > 0 && (
          <div className="mb-2">
            <motion.button
              whileHover={{ backgroundColor: "var(--color-bg-2)" }}
              onClick={() => setMenu(null)}
              className="mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold tracking-wide text-text-faint uppercase transition-colors hover:text-text"
            >
              <Eye size={12} className="shrink-0" />
              Hidden channels ({hiddenChannels.length})
            </motion.button>
            <AnimatePresence>{hiddenRows}</AnimatePresence>
              {deleting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded bg-black/40 backdrop-blur"
                >
                  <span className="text-xs text-text">Deleting…</span>
                </motion.div>
              )}
            </div>
        )}

        {canModerate && channels && channels.length === 0 && (
          <p className="px-2 py-4 text-xs text-text-faint">
            No channels yet. Click the + next to a category to create one.
          </p>
        )}
      </div>

      <UserPanel />
    </aside>
  );
}

function HiddenChannelRow({
  ch,
  active,
  deletingNow,
  menu,
  setMenu,
  toggleHideChannel,
  handleDeleteChannel,
  canModerate,
  server,
}: {
  ch: { _id: string; name: string; type: string };
  active: boolean;
  deletingNow: boolean;
  menu: { x: number; y: number; channelId: string; hidden: boolean } | null;
  setMenu: (v: { x: number; y: number; channelId: string; hidden: boolean } | null) => void;
  toggleHideChannel: (channelId: string, currentlyHidden: boolean) => void;
  handleDeleteChannel: (channelId: string) => Promise<void>;
  canModerate: boolean;
  server: { _id: string } | undefined;
}) {
  const navigate = useNavigate();

  const items: ContextMenuItem[] = [
    {
      label: "Unhide channel",
      icon: <Eye size={14} />,
      onClick: () => toggleHideChannel(ch._id, true),
    },
  ];
  if (canModerate) {
    items.push({
      label: "Delete channel",
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => handleDeleteChannel(ch._id),
    });
  }

  return (
    <motion.li
      key={ch._id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="mb-1 relative"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, channelId: ch._id, hidden: true });
      }}
    >
      <motion.button
        whileHover={{ backgroundColor: "var(--color-bg-2)" }}
        onClick={() => {
          setMenu(null);
          toggleHideChannel(ch._id, true);
          if (active && server?._id) navigate(`/channels/${server._id}`);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
          active ? "bg-bg-3 text-text" : "text-text-dim bg-bg-2/50 hover:bg-bg-3 hover:text-text",
        )}
      >
        <Hash size={15} className="shrink-0 text-text-faint" />
        <span className="truncate text-text-dim">{ch.name}</span>
        <Eye size={14} className="shrink-0 opacity-50 text-accent" />
      </motion.button>
      {menu && menu.channelId === ch._id && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={items}
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
}

export function VoiceJoinStub({ channelName }: { channelName: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Mic size={28} className="text-text-faint" />
      <p className="text-sm font-medium text-text">{channelName}</p>
      <p className="text-xs text-text-dim">
        Voice, video and screen sharing require LiveKit credentials.
      </p>
    </div>
  );
}