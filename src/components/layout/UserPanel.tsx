import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import {
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  Settings,
  Zap,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/types";

const STATUS_OPTIONS: { value: UserStatus; label: string; dot: string }[] = [
  { value: "online", label: "Online", dot: "#00e57a" },
  { value: "idle", label: "Idle", dot: "#f5c04a" },
  { value: "dnd", label: "Do not disturb", dot: "#f45c5c" },
  { value: "invisible", label: "Invisible", dot: "#5b5d64" },
];

export function UserPanel() {
  const { token, me, setStatus } = useAuth();
  const { openModal, pushToast } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const updateProfile = useMutation(api.users.updateProfile);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  if (!me) return null;

  const chooseStatus = (status: UserStatus) => {
    setStatus(status);
    setMenuOpen(false);
    pushToast(`Status set to ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`, "success");
  };

  const setCustomStatus = () => {
    const input = window.prompt("Custom status (max 80 chars)", me.customStatus ?? "");
    if (input === null) return;
    updateProfile({ token: token!, customStatus: input })
      .then(() => pushToast("Custom status updated", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
      className="relative flex h-[52px] shrink-0 items-center gap-1.5 border-t border-line bg-bg-deep px-2"
    >
      <button
        ref={menuRef}
        onClick={() => setMenuOpen((v) => !v)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-bg-3"
      >
        <Avatar
          name={me.displayName}
          id={me._id}
          url={me.avatarUrl}
          size={32}
          status={me.status}
          lastSeenAt={me.lastSeenAt}
          showPresence
        />
        <div className="min-w-0 text-left">
          <div className="truncate text-[13px] font-semibold text-text leading-tight">
            {me.displayName}
          </div>
          <div className="truncate text-[11px] text-text-dim leading-tight">
            {me.customStatus ||
              STATUS_OPTIONS.find((s) => s.value === me.status)?.label ||
              "Online"}
          </div>
        </div>
      </button>

      <button
        onClick={() => setMicMuted((v) => !v)}
        title={micMuted ? "Unmute microphone" : "Mute microphone"}
        className={cn(
          "rounded p-1.5 transition-colors",
          micMuted
            ? "text-danger bg-bg-3"
            : "text-text-dim hover:bg-bg-3 hover:text-text",
        )}
      >
        {micMuted ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      <button
        onClick={() => setDeafened((v) => !v)}
        title={deafened ? "Undeafen" : "Deafen"}
        className={cn(
          "rounded p-1.5 transition-colors",
          deafened
            ? "text-danger bg-bg-3"
            : "text-text-dim hover:bg-bg-3 hover:text-text",
        )}
      >
        {deafened ? <HeadphoneOff size={16} /> : <Headphones size={16} />}
      </button>
      <button
        onClick={() => openModal("settings")}
        title="User settings"
        className="rounded p-1.5 text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
      >
        <Settings size={16} />
      </button>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-full left-2 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl"
        >
          <div className="border-b border-line px-3 py-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            {me.username}
          </div>
          {STATUS_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileHover={{ backgroundColor: "var(--color-bg-3)" }}
              onClick={() => chooseStatus(opt.value)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors",
                me.status === opt.value ? "text-accent" : "text-text-dim",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: opt.dot }}
              />
              {opt.label}
            </motion.button>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              setCustomStatus();
            }}
            className="w-full border-t border-line px-3 py-2 text-left text-sm text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
          >
            Set custom status…
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              openModal("personalEmojiManager");
            }}
            className="w-full border-t border-line px-3 py-2 text-left text-sm text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
          >
            <Zap size={14} className="mr-2" />
            My emoji
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              openModal("settings");
            }}
            className="w-full border-t border-line px-3 py-2 text-left text-sm text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
          >
            Open settings…
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}