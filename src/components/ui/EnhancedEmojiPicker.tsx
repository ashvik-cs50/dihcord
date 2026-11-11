import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Image as ImageIcon, Star, Smile as SmileIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

export function EnhancedEmojiPicker({
  onPick,
  onClose,
  serverId,
  align = "left",
}: {
  onPick: (emoji: string | { type: "custom"; id: string; url: string; name: string }) => void;
  onClose: () => void;
  serverId?: Id<"servers">;
  align?: "left" | "right";
}) {
  const { token } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"standard" | "custom" | "stickers">("standard");

  const serverEmojis = useQuery(
    api.emojis.listServerEmojis,
    serverId && token ? { token, serverId } : "skip",
  ) as { _id: string; name: string; url: string | null }[] | undefined;

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
        "👋", "🤚", "✋", "👌", "🤌", "✌️", "🤞", "🤟", "🤘", "🤙",
        "👍", "👎", "✊", "👊", "👏", "🙌", "👐", "🤝", "🙏", "💅",
      ],
    },
    {
      name: "Symbols",
      emojis: ["✅", "❌", "❓", "❗", "💯", "🔴", "🟠", "🟡", "🟢", "🔵"],
    },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full z-40 mb-2 w-80 overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl",
        align === "left" ? "left-0" : "right-0",
      )}
      style={{ animation: "var(--animate-pop-in)" }}
    >
      {/* Tabs */}
      <div className="flex border-b border-line bg-bg-1">
        {[
          { id: "standard", label: "Emoji", icon: <SmileIcon size={14} /> },
          { id: "custom", label: "Server emoji", icon: <Star size={14} /> },
          { id: "stickers", label: "Stickers", icon: <ImageIcon size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            disabled={t.id !== "standard" && !serverId}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm transition-colors",
              tab === t.id
                ? "bg-accent text-[#062b18] border-b-2 border-accent"
                : "text-text-dim hover:text-text hover:bg-bg-3",
            )}
            title={t.id !== "standard" && !serverId ? "Select a server first" : undefined}
          >
            {t.icon}
            <span className="text-[10px]">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
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
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-bg-hover"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "custom" && serverEmojis && (
          <div className="space-y-2">
            {serverEmojis.length === 0 && (
              <p className="py-4 text-center text-xs text-text-faint">
                No custom emojis yet.
              </p>
            )}
            {serverEmojis.map((e) => (
              <button
                key={e._id}
                onClick={() => onPick({ type: "custom", id: e._id, url: e.url ?? "", name: e.name })}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-bg-1 transition-colors hover:bg-bg-3 hover:border-line-strong"
              >
                {e.url ? (
                  <img src={e.url} alt={e.name} className="h-8 w-8 rounded-sm object-cover" />
                ) : (
                  <span className="text-lg">{e.name.slice(0, 1)}</span>
                )}
              </button>
            ))}
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