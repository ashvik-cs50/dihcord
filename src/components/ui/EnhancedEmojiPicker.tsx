import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Image as ImageIcon,
  Star,
  Smile as SmileIcon,
  Zap,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

type CustomEmojiItem = {
  _id: string;
  name: string;
  url: string | null;
  animated: boolean;
};

type PickerEmoji =
  | string
  | { type: "custom"; id: string; url: string; name: string; animated: boolean };

type TabId = "standard" | "custom" | "stickers" | "personal" | "animated";

const TABS: { id: TabId; label: string; icon: React.ReactNode; needsServer?: boolean }[] = [
  { id: "standard", label: "Emoji", icon: <SmileIcon size={13} /> },
  {
    id: "custom",
    label: "Server emoji",
    icon: <Star size={13} />,
    needsServer: true,
  },
  { id: "personal", label: "My emoji", icon: <UserIcon size={13} /> },
  { id: "animated", label: "Animated", icon: <Zap size={13} /> },
  { id: "stickers", label: "Stickers", icon: <ImageIcon size={13} /> },
];

export function EnhancedEmojiPicker({
  onPick,
  onClose,
  serverId,
  align = "left",
}: {
  onPick: (emoji: PickerEmoji) => void;
  onClose: () => void;
  serverId?: Id<"servers">;
  align?: "left" | "right";
}) {
  const { token } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<
    "standard" | "custom" | "stickers" | "personal" | "animated"
  >("standard");

  const serverEmojis = useQuery(
    api.emojis.listServerEmojis,
    serverId && token ? { token, serverId } : "skip",
  ) as CustomEmojiItem[] | undefined;

  const personalEmojis = useQuery(
    api.users.listUserEmojis,
    token ? { token } : "skip",
  ) as CustomEmojiItem[] | undefined;

  const allCustom = useMemo(
    () => [...(serverEmojis ?? []), ...(personalEmojis ?? [])],
    [serverEmojis, personalEmojis],
  );

  const animatedEmojis = useMemo(
    () => allCustom.filter((e) => e.animated),
    [allCustom],
  );

  const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
    {
      name: "Frequently Used",
      emojis: ["👍", "❤️", "😂", "🎉", "🔥", "👀", "😮", "🤔", "🚀", "✅"],
    },
    {
      name: "Smileys",
      emojis: [
        "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
        "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
        "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      ],
    },
    {
      name: "Gestures",
      emojis: [
        "👋", "🤚", "✋", "🖖", "👌", "🤌", "✌️", "🤞", "🤟", "🤘",
        "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊",
        "🤛", "🤜", "👏", "🙌", "👐", "🤝", "🙏", "💅", "🦾",
      ],
    },
    {
      name: "Objects",
      emojis: [
        "🔥", "⭐", "✨", "⚡", "❄️", "💧", "🔔", "📅", "📌", "📎",
        "🔒", "🔑", "💻", "🖥️", "⌨️", "🖱️", "📱", "🎧", "🎤", "🎮",
        "🕹️", "💾", "📷", "🎥", "📺", "📻", "🔋", "💡", "🔧", "⚙️",
      ],
    },
    {
      name: "Symbols",
      emojis: ["✅", "❌", "❓", "❗", "💯", "🔴", "🟠", "🟡", "🟢", "🔵"],
    },
  ];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const tabDisabled =
    tab !== "standard" && tab !== "personal" && tab !== "animated" && !serverId;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full z-40 mb-2 w-96 overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl",
        align === "left" ? "left-0" : "right-0",
      )}
      style={{ animation: "var(--animate-pop-in)" }}
    >
      {/* Tabs */}
      <div className="flex border-b border-line bg-bg-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              disabled={tabDisabled && t.needsServer}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-2 py-2 text-xs transition-colors",
                tab === t.id
                  ? "bg-accent text-[#062b18] border-b-2 border-accent"
                  : "text-text-dim hover:text-text hover:bg-bg-3",
              )}
              title={
                t.needsServer && !serverId ? "Select a server first" : undefined
              }
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {tab === "standard" && (
          <div className="space-y-2">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-text-faint uppercase">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onPick(emoji)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-bg-hover"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "custom" && (
          <div className="space-y-2">
            {!serverId && (
              <p className="py-4 text-center text-xs text-text-faint">
                Select a server to see its custom emojis.
              </p>
            )}
            {serverId && serverEmojis && (
              <>
                {serverEmojis.length === 0 && (
                  <p className="py-4 text-center text-xs text-text-faint">
                    No custom emojis yet.
                  </p>
                )}
                {serverEmojis.map((e) => (
                  <button
                    key={e._id}
                    onClick={() =>
                      onPick({ type: "custom", id: e._id, url: e.url ?? "", name: e.name, animated: e.animated })
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-bg-1 transition-colors hover:bg-bg-3 hover:border-line-strong"
                  >
                    {e.url ? (
                      <img
                        src={e.url}
                        alt={e.name}
                        className="h-8 w-8 rounded-sm object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-lg">{e.name.slice(0, 1)}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        {tab === "personal" && (
          <div className="space-y-2">
            {personalEmojis === undefined ? (
              <div className="h-32 flex items-center justify-center text-xs text-text-faint">
                Loading your emojis…
              </div>
            ) : personalEmojis.length === 0 ? (
              <p className="py-4 text-center text-xs text-text-faint">
                No personal emojis yet. Upload some in settings.
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {personalEmojis.map((e) => (
                  <button
                    key={e._id}
                    onClick={() =>
                      onPick({ type: "custom", id: e._id, url: e.url ?? "", name: e.name, animated: e.animated })
                    }
                    className="flex h-11 w-11 flex-col items-center justify-center rounded-md border border-line bg-bg-1 transition-colors hover:bg-bg-3 hover:border-line-strong"
                  >
                    {e.url ? (
                      <img
                        src={e.url}
                        alt={e.name}
                        className="h-8 w-8 rounded-sm object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-lg">{e.name.slice(0, 1)}</span>
                    )}
                    <span className="mt-1 text-[10px] truncate text-text-dim">
                      {e.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "animated" && (
          <div className="space-y-2">
            {animatedEmojis.length === 0 ? (
              <p className="py-4 text-center text-xs text-text-faint">
                No animated emojis available yet.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {animatedEmojis.map((e) => (
                  <button
                    key={e._id}
                    onClick={() =>
                      onPick({ type: "custom", id: e._id, url: e.url ?? "", name: e.name, animated: true })
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-bg-1 transition-colors hover:bg-bg-3 hover:border-line-strong group"
                  >
                    {e.url ? (
                      <img
                        src={e.url}
                        alt={e.name}
                        className="h-8 w-8 rounded-sm object-cover"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-lg">{e.name.slice(0, 1)}</span>
                    )}
                    {e.animated && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent text-[062b18] text-[9px] flex items-center justify-center group-hover:scale-110 transition-transform">
                        ↻
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "stickers" && (
          <div className="py-4 text-center text-xs text-text-faint">
            Stickers coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
