import { useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Search as SearchIcon, Hash } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Modal } from "@/components/ui/Modal";
import { formatMessageTime } from "@/lib/utils";
import type { Message } from "@/types";

export function SearchModal({
  currentServerId,
  currentChannelId,
}: {
  currentServerId?: string;
  currentChannelId?: string;
}) {
  const { token } = useAuth();
  const { modal, modalPayload, closeModal } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"server" | "channel">("server");

  const open = modal === "search";

  const channelId =
    scope === "channel" && (modalPayload.channelId ?? currentChannelId)
      ? (modalPayload.channelId ?? currentChannelId)!
      : undefined;

  const serverChannels = useQuery(
    api.channels.listByServer,
    open && token && currentServerId
      ? { token, serverId: currentServerId as never }
      : "skip",
  );

  const myDms = useQuery(
    api.dms.listMine,
    open && token ? { token } : "skip",
  );

  const nameMap = new Map<string, string>();
  for (const c of serverChannels ?? []) {
    nameMap.set(c._id, `#${c.name}`);
  }
  for (const dm of myDms ?? []) {
    if (!dm) continue;
    nameMap.set(
      dm.channelId,
      dm.otherUser ? `@${dm.otherUser.displayName}` : "Direct message",
    );
  }

  const results = useQuery(
    api.messages.search,
    open && token && query.trim().length >= 2
      ? {
          token,
          query: query.trim(),
          channelId: channelId ? (channelId as never) : undefined,
          serverId:
            scope === "server" && currentServerId
              ? (currentServerId as never)
              : undefined,
        }
      : "skip",
  ) as Message[] | undefined;

  const go = (message: Message) => {
    closeModal();
    if (message.serverId) {
      navigate(`/channels/${message.serverId}/${message.channelId}`);
    } else {
      navigate(`/@me/${message.channelId}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Search messages"
      subtitle="Full-text search across your channels."
      width={560}
    >
      <div className="relative">
        <SearchIcon
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-text-faint"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type at least 2 characters…"
          className="w-full rounded-md border border-line-strong bg-bg-deep py-2.5 pr-3 pl-9 text-sm text-text placeholder:text-text-faint focus:border-accent/70 focus:outline-none"
        />
      </div>

      {currentServerId && (
        <div className="mt-3 flex gap-2 text-xs">
          {(["server", "channel"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              disabled={s === "channel" && !currentChannelId && !modalPayload.channelId}
              className={
                "rounded border px-2.5 py-1 capitalize transition-colors disabled:opacity-40 " +
                (scope === s
                  ? "border-accent/60 bg-accent-dim text-accent"
                  : "border-line bg-bg-2 text-text-dim hover:border-line-strong")
              }
            >
              This {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
        {query.trim().length < 2 && (
          <p className="py-4 text-center text-xs text-text-faint">
            Type at least 2 characters to search.
          </p>
        )}
        {query.trim().length >= 2 && results === undefined && (
          <p className="py-4 text-center text-xs text-text-faint">Searching…</p>
        )}
        {results && results.length === 0 && (
          <p className="py-4 text-center text-xs text-text-faint">
            No messages found.
          </p>
        )}
        {results?.map((m) => (
          <button
            key={m._id}
            onClick={() => go(m)}
            className="block w-full rounded-md border border-line bg-bg-2 px-3 py-2 text-left transition-colors hover:border-line-strong"
          >
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <Hash size={11} />
              {nameMap.get(m.channelId) ?? "Channel"} ·{" "}
              {formatMessageTime(m.createdAt)}
            </div>
            <div className="mt-0.5 line-clamp-2 text-sm text-text">
              {m.content}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
