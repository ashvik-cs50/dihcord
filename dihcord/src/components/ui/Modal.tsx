import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 460,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl"
            style={{ width: "100%", maxWidth: width }}
          >
            <div className="flex items-start justify-between border-b border-line px-5 pt-4 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-text">{title}</h2>
                {subtitle && (
                  <p className="mt-0.5 text-xs text-text-dim">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-text-faint transition-colors hover:bg-bg-3 hover:text-text"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={cn("px-5 py-4")}>{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-bg-0 px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}