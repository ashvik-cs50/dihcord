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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { UserPanel } from "./UserPanel";
import { cn } from "@/lib/utils";
import type { Channel, ServerDetail } from "@/types";

export function ChannelSidebar({
  channels,
  server,
}: {
  channels: Channel[] | undefined;
  server: ServerDetail | undefined;
}) {
  const { unreadChannels } = useAuth();
  const { openModal, pushToast } = useUI();
  const navigate = useNavigate();
  const { channelId: activeChannelId } = useParams();

  const canModerate =
    !!server && (server.myRole === "owner" || server.myRole === "admin");

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
                        className="mb-0.5"
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
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}

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