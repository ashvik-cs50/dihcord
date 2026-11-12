import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { ArrowDown } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import type { Member, Message, Reaction } from "@/types";
import type { CustomEmoji } from "./content";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function MessageList({
  channelId,
  members,
  canDeleteAny,
  onReply,
  serverId,
}: {
  channelId: Id<"channels">;
  members: Member[];
  canDeleteAny: boolean;
  onReply: (message: Message) => void;
  serverId?: Id<"servers">;
}) {
  const { token } = useAuth();
  const markRead = useMutation(api.messages.markRead);

  const result = usePaginatedQuery(
    api.messages.list,
    token ? { token, channelId } : "skip",
    { initialNumItems: 40 },
  );

  const channelReactions = useQuery(
    api.reactions.listByChannel,
    token ? { token, channelId } : "skip",
  ) as { messageId: Id<"messages">; reactions: Reaction[] }[] | undefined;

  const reactionsByMessage = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const group of channelReactions ?? []) {
      map.set(group.messageId, group.reactions);
    }
    return map;
  }, [channelReactions]);

  const serverEmojis = useQuery(
    api.emojis.listServerEmojis,
    serverId && token ? { token, serverId } : "skip",
  ) as { _id: string; name: string; url: string | null; animated: boolean }[] | undefined;

  const userEmojis = useQuery(
    api.users.listUserEmojis,
    token ? { token } : "skip",
  ) as { _id: string; name: string; url: string | null; animated: boolean }[] | undefined;

  const emojiMap = useMemo<Record<string, CustomEmoji>>(() => {
    const map: Record<string, CustomEmoji> = {};
    for (const e of serverEmojis ?? []) {
      map[e.name] = { name: e.name, url: e.url ?? null, animated: !!e.animated };
    }
    for (const e of userEmojis ?? []) {
      map[e.name] = { name: e.name, url: e.url ?? null, animated: !!e.animated };
    }
    return map;
  }, [serverEmojis, userEmojis]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  const prevChannelRef = useRef(channelId);
  const lastCountRef = useRef(0);
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.userId as string, m])),
    [members],
  );

  useEffect(() => {
    if (prevChannelRef.current !== channelId) {
      prevChannelRef.current = channelId;
      lastCountRef.current = 0;
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [channelId]);

  const messages = result?.results ?? [];
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = messages.length !== lastCountRef.current;
    lastCountRef.current = messages.length;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (grew && nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
    setShowJump(!nearBottom && messages.length > 0);
  }, [messages.length, messages[messages.length - 1]?._id]);

useEffect(() => {
    if (!token) return;
    void markRead({ token, channelId }).catch(() => {});
}, [token, channelId, markRead, messages[messages.length - 1]?._id]);


  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-faint">
        Loading messages…
      </div>
    );
  }

  const ordered = [...messages].reverse();
  const canLoadMore = result.status === "CanLoadMore";

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto smooth-scroll"
        onScroll={(e) => {
          const el = e.currentTarget;
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
          setShowJump(!nearBottom);
        }}
      >
        <div className="flex justify-center pb-2 pt-4">
          {canLoadMore ? (
            <button
              onClick={() => result.loadMore(40)}
              className="rounded border border-line bg-bg-2 px-3 py-1 text-xs text-text-dim transition-colors hover:border-line-strong hover:text-text"
            >
              Load older messages
            </button>
          ) : (
            <span className="text-xs text-text-faint">
              {messages.length > 0
                ? "This is the beginning of the channel."
                : ""}
            </span>
          )}
        </div>

        {ordered.map((message, index) => {
          const prev = ordered[index - 1];
          const compact =
            !!prev &&
            prev.authorId === message.authorId &&
            !message.replyTo &&
            message.createdAt - prev.createdAt < GROUP_WINDOW_MS;
          return (
            <MessageItem
              key={message._id}
              message={message as Message}
              compact={compact}
              members={memberMap}
              reactions={reactionsByMessage.get(message._id) ?? []}
              emojis={emojiMap}
              canDelete={canDeleteAny}
              onReply={onReply}
              highlight={false}
              serverId={serverId}
            />
          );
        })}
        <div className="h-4" />
      </div>

      {showJump && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-surface-elevated px-3 py-1.5 text-xs text-text shadow-lg transition-colors hover:border-accent/50 hover:text-accent"
        >
          <ArrowDown size={13} /> Jump to present
        </button>
      )}

      <div className="pointer-events-none absolute bottom-1 left-4">
        <TypingIndicator channelId={channelId} />
      </div>
    </div>
  );
}