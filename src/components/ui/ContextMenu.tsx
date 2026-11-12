import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ContextMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
};

export function ContextMenu({
  items,
  x,
  y,
  onClose,
}: {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 6 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[100] flex min-w-[180px] flex-col rounded-xl border border-line bg-surface-elevated shadow-2xl p-1"
        style={{
          left: Math.min(x, window.innerWidth - 220),
          top: Math.min(y, window.innerHeight - 280),
        }}
      >
        {items.map((item, i) => {
          if (item.separator) {
            return (
              <div key={i} className="mx-1.5 my-0.5 h-px bg-line" />
            );
          }
          return (
            <button
              key={i}
              disabled={item.disabled}
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                item.disabled
                  ? "text-text-faint pointer-events-none"
                  : item.danger
                    ? "text-danger hover:bg-danger/10"
                    : "text-text hover:bg-bg-3",
              )}
            >
              {item.icon && (
                <span className="shrink-0 opacity-70">{item.icon}</span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
