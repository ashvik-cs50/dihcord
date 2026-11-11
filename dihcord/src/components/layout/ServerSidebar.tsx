import { useQuery, useMutation } from "convex/react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, PlusCircle, Home } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { cn } from "@/lib/utils";
import type { ServerSummary } from "@/types";

export function ServerSidebar() {
  const { token, me, unreadChannels, unreadNotifications } = useAuth();
  const { openModal, pushToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const servers = useQuery(
    api.servers.listMine,
    token ? { token } : "skip",
  ) as ServerSummary[] | undefined;

  const leave = useMutation(api.servers.leave);

  const homeUnread =
    unreadNotifications +
    (unreadChannels
      ? Object.values(unreadChannels).reduce((a, b) => a + b, 0)
      : 0);

  const activeServerId = location.pathname.startsWith("/channels/")
    ? location.pathname.split("/")[2]
    : undefined;

  const onLeave = (server: ServerSummary) => {
    if (!window.confirm(`Leave "${server.name}"?`)) return;
    leave({ token: token!, serverId: server._id })
      .then(() => {
        pushToast(`Left ${server.name}`, "success");
        if (activeServerId === server._id) navigate("/@me");
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-bg-deep py-3 no-scrollbar">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/@me")}
        title="DIHCORD Home"
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-lg transition-colors duration-100",
          location.pathname.startsWith("/@me")
            ? "bg-accent text-[#062b18]"
            : "bg-bg-2 text-text-dim hover:bg-accent hover:text-[#062b18]",
        )}
      >
        <Home size={22} strokeWidth={2.2} />
        {homeUnread > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity }}
            className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {Math.min(99, homeUnread)}
          </motion.div>
        )}
      </motion.button>

      <div className="h-px w-8 bg-line-strong" />

      <AnimatePresence>
        {servers?.map((server) => (
          <motion.button
            key={server._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/channels/${server._id}`)}
            onContextMenu={(e) => {
              e.preventDefault();
              onLeave(server);
            }}
            title={`${server.name} (right-click to leave)`}
            className={cn(
              "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-100",
              activeServerId === server._id
                ? "bg-bg-3"
                : "bg-bg-2 hover:bg-bg-3",
            )}
          >
            <motion.div
              whileHover={{ width: 4 }}
              className={cn(
                "absolute top-1/2 left-0 -translate-y-1/2 rounded-r-full transition-all duration-150",
                activeServerId === server._id
                  ? "h-8 w-1 bg-accent accent-glow"
                  : "h-0 w-1 bg-text group-hover:h-4",
              )}
            />
            {server.iconEmoji ? (
              <span className="text-xl">{server.iconEmoji}</span>
            ) : (
              <span
                className={cn(
                  "text-sm font-bold",
                  activeServerId === server._id
                    ? "text-text"
                    : "text-text-dim group-hover:text-accent-hover",
                )}
              >
                {server.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openModal("createServer")}
        title="Add a server"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-2 text-accent transition-colors hover:bg-accent hover:text-[#062b18]"
      >
        <PlusCircle size={22} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openModal("explore")}
        title="Explore public servers"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-2 text-accent transition-colors hover:bg-accent hover:text-[#062b18]"
      >
        <Compass size={22} />
      </motion.button>

      <div className="mt-auto px-1 text-center text-[9px] leading-tight text-text-faint">
        {me ? `@${me.username}` : ""}
      </div>
    </nav>
  );
}