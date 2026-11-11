import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { EMOJI_CATEGORIES } from "@/lib/emojis";
import { cn } from "@/lib/utils";

export function EmojiPicker({
  onPick,
  onClose,
  align = "left",
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

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

  const allEmojis = EMOJI_CATEGORIES.flatMap((cat) => cat.emojis);
  const filtered = search
    ? allEmojis.filter((e) => e.includes(search))
    : allEmojis;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "absolute bottom-full z-40 mb-2 w-80 overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl",
        align === "left" ? "left-0" : "right-0",
      )}
    >
      <div className="p-2 border-b border-line bg-bg-1">
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji…"
            className="w-full rounded-md border border-line-strong bg-bg-deep pl-8 pr-3 py-2 text-xs text-text placeholder:text-text-faint focus:border-accent/70 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 && search ? (
          <div className="py-4 text-center text-xs text-text-faint">
            No emojis found.
          </div>
        ) : (
          EMOJI_CATEGORIES.map((cat) => {
            const catEmojis = search
              ? cat.emojis.filter((e) => filtered.includes(e))
              : cat.emojis;
            if (catEmojis.length === 0) return null;
            return (
              <div key={cat.name}>
                <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-text-faint uppercase">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {catEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onPick(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-bg-hover active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}