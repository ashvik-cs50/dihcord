import { useMemo as useReactMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Shield } from "lucide-react";
import { useUI } from "@/contexts/UIContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn, isOnline } from "@/lib/utils";
import type { Member } from "@/types";

export function MemberSidebar({ members }: { members: Member[] | undefined }) {
  const { openModal } = useUI();
  const { me } = useAuth();

  const { online, offline } = useReactMemo(() => {
    const all = members ?? [];
    const on = all.filter((m) => isOnline(m.status, m.lastSeenAt));
    const off = all.filter((m) => !isOnline(m.status, m.lastSeenAt));
    on.sort((a, b) => a.displayName.localeCompare(b.displayName));
    off.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { online: on, offline: off };
  }, [members]);

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-l border-line bg-bg-1 px-2 py-4 lg:flex">
      <h3 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
        Online — {online.length}
      </h3>
      <ul className="mb-4">
        {online.map((m) => (
          <MemberRow
            key={m.membershipId}
            member={m}
            meId={me?._id}
            dim={false}
            onClick={() => openModal("profile", { userId: m.userId })}
          />
        ))}
        {online.length === 0 && (
          <li className="px-2 py-1 text-xs text-text-faint">Nobody online</li>
        )}
      </ul>
      <h3 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
        Offline — {offline.length}
      </h3>
      <ul>
        {offline.map((m) => (
          <MemberRow
            key={m.membershipId}
            member={m}
            meId={me?._id}
            dim
            onClick={() => openModal("profile", { userId: m.userId })}
          />
        ))}
      </ul>
    </aside>
  );
}

function MemberRow({
  member,
  dim,
  meId,
  onClick,
}: {
  member: Member;
  dim?: boolean;
  meId?: string;
  onClick: () => void;
}) {
  const showCrown = member.role === "owner";
  const showShield = member.role === "admin";
  return (
    <motion.li
      whileHover={{ backgroundColor: dim ? "rgba(255,255,255,0.03)" : "var(--color-bg-3)" }}
      className="mb-0.5"
    >
      <motion.button
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors",
          dim ? "opacity-60 hover:opacity-100" : "",
        )}
      >
        <Avatar
          name={member.displayName}
          id={member.userId}
          url={member.avatarUrl}
          size={32}
          status={member.status}
          lastSeenAt={member.lastSeenAt}
          showPresence
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm text-text-dim">{member.displayName}</span>
            {showCrown && <Crown size={12} className="shrink-0 text-warning" />}
            {showShield && <Shield size={12} className="shrink-0 text-info" />}
          </div>
          {member.customStatus && (
            <div className="truncate text-[11px] text-text-faint">
              {member.customStatus}
            </div>
          )}
        </div>
        {member.userId === meId && (
          <span className="text-[10px] text-text-faint uppercase">you</span>
        )}
      </motion.button>
    </motion.li>
  );
}