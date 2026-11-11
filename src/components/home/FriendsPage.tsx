import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import {
  UserPlus,
  MessageSquare,
  X,
  Check,
  Search as SearchIcon,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn, isOnline } from "@/lib/utils";
import type { FriendUser } from "@/types";

export function FriendsPage() {
  const { token, me } = useAuth();
  const { pushToast, openModal } = useUI();
  const navigate = useNavigate();

  const friendships = useQuery(
    api.friendships.list,
    token ? { token } : "skip",
  ) as
    | {
        friends: FriendUser[];
        incomingRequests: FriendUser[];
        outgoingRequests: FriendUser[];
      }
    | undefined;

  const sendRequest = useMutation(api.friendships.sendRequest);
  const accept = useMutation(api.friendships.accept);
  const decline = useMutation(api.friendships.decline);
  const remove = useMutation(api.friendships.remove);
  const openDm = useMutation(api.dms.open);

  const [addUsername, setAddUsername] = useState("");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"online" | "all">("all");

  const openConversation = (userId: Id<"users">) => {
    if (!token) return;
    openDm({ token, userId })
      .then((channelId) => navigate(`/@me/${channelId}`))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const visibleFriends = useMemo(() => {
    const all = friendships?.friends ?? [];
    const filtered = filter.trim()
      ? all.filter(
          (f) =>
            f.displayName.toLowerCase().includes(filter.toLowerCase()) ||
            f.username.includes(filter.toLowerCase()),
        )
      : all;
    if (tab === "online") {
      return filtered.filter((f) => isOnline(f.status, f.lastSeenAt));
    }
    return filtered;
  }, [friendships, filter, tab]);

  const submitAddFriend = () => {
    if (!token || !addUsername.trim()) return;
    sendRequest({ token, username: addUsername.trim() })
      .then((r) => {
        if ("accepted" in r && r.accepted) {
          pushToast("They already requested you — you are now friends!", "success");
        } else {
          pushToast(`Friend request sent to @${addUsername.trim()}`, "success");
        }
        setAddUsername("");
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
        <h1 className="font-semibold text-text">Friends</h1>
        <div className="mx-2 h-6 w-px bg-line" />
        {(["all", "online"] as const).map((t) => (
          <motion.button
            key={t}
            whileHover={{ backgroundColor: "var(--color-bg-3)" }}
            onClick={() => setTab(t)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "bg-bg-3 text-text"
                : "text-text-dim hover:bg-bg-2 hover:text-text",
            )}
          >
            {t}
          </motion.button>
        ))}
        <div className="relative ml-auto">
          <SearchIcon
            size={13}
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-text-faint"
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search friends"
            className="w-48 rounded border border-line bg-bg-deep py-1.5 pr-2 pl-7 text-xs text-text placeholder:text-text-faint focus:border-accent/70 focus:outline-none"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <section className="mb-8">
          <h2 className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            Add friend
          </h2>
          <div className="flex max-w-lg gap-2">
            <input
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAddFriend()}
              placeholder="Enter a username (e.g. vicky)"
              className="flex-1 rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent/70 focus:outline-none"
            />
            <Button onClick={submitAddFriend} disabled={!addUsername.trim()}>
              <UserPlus size={15} /> Send request
            </Button>
          </div>
        </section>

        {friendships && friendships.incomingRequests.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
              Pending — incoming ({friendships.incomingRequests.length})
            </h2>
            <ul className="divide-y divide-line/60">
              <AnimatePresence>
                {friendships.incomingRequests.map((u) => (
                  <motion.li
                    key={u.friendshipId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <FriendRow
                      user={u}
                      meId={me?._id}
                      onProfile={() => openModal("profile", { userId: u._id })}
                      actions={
                        <>
                          <Button
                            variant="primary"
                            className="px-2 py-1.5"
                            onClick={() =>
                              token &&
                              accept({ token, friendshipId: u.friendshipId })
                                .then(() => pushToast(`You are now friends with ${u.displayName}`, "success"))
                                .catch((err: Error) => pushToast(err.message, "error"))
                            }
                          >
                            <Check size={14} /> Accept
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2 py-1.5"
                            onClick={() =>
                              token &&
                              decline({ token, friendshipId: u.friendshipId })
                                .then(() => pushToast("Request declined", "info"))
                                .catch((err: Error) => pushToast(err.message, "error"))
                            }
                          >
                            <X size={14} /> Decline
                          </Button>
                        </>
                      }
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {friendships && friendships.outgoingRequests.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
              Pending — outgoing ({friendships.outgoingRequests.length})
            </h2>
            <ul className="divide-y divide-line/60">
              <AnimatePresence>
                {friendships.outgoingRequests.map((u) => (
                  <motion.li
                    key={u.friendshipId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <FriendRow
                      user={u}
                      meId={me?._id}
                      onProfile={() => openModal("profile", { userId: u._id })}
                      actions={
                        <Button
                          variant="ghost"
                          className="px-2 py-1.5"
                          onClick={() =>
                            token &&
                            remove({ token, friendshipId: u.friendshipId })
                              .then(() => pushToast("Request cancelled", "info"))
                              .catch((err: Error) => pushToast(err.message, "error"))
                          }
                        >
                          <X size={14} /> Cancel
                        </Button>
                      }
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            {tab === "online" ? "Online" : "All friends"} —{" "}
            {visibleFriends.length}
          </h2>
          {visibleFriends.length === 0 ? (
            <p className="mt-6 max-w-md text-sm text-text-faint">
              No friends here yet. Send a request above — friends can DM you
              instantly.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              <AnimatePresence>
                {visibleFriends.map((u) => (
                  <motion.li
                    key={u.friendshipId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="mb-1"
                  >
                    <FriendRow
                      user={u}
                      meId={me?._id}
                      onProfile={() => openModal("profile", { userId: u._id })}
                      actions={
                        <>
                          <Button
                            variant="secondary"
                            className="px-2 py-1.5"
                            onClick={() => openConversation(u._id)}
                          >
                            <MessageSquare size={14} /> Message
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2 py-1.5 text-danger hover:text-danger"
                            onClick={() => {
                              if (
                                !window.confirm(`Remove ${u.displayName} from friends?`)
                              )
                                return;
                              if (!token) return;
                              remove({ token, friendshipId: u.friendshipId })
                                .then(() => pushToast("Friend removed", "info"))
                                .catch((err: Error) => pushToast(err.message, "error"));
                            }}
                          >
                            <X size={14} /> Remove
                          </Button>
                        </>
                      }
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function FriendRow({
  user,
  meId,
  onProfile,
  actions,
}: {
  user: FriendUser;
  meId?: Id<"users">;
  onProfile: () => void;
  actions: React.ReactNode;
}) {
  const online = isOnline(user.status, user.lastSeenAt);
  return (
    <motion.li
      whileHover={{ backgroundColor: "var(--color-bg-2)" }}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
        !online && "opacity-60",
      )}
    >
      <button onClick={onProfile} className="shrink-0">
        <Avatar
          name={user.displayName}
          id={user._id}
          url={user.avatarUrl}
          size={40}
          status={user.status}
          lastSeenAt={user.lastSeenAt}
          showPresence
        />
      </button>
      <button onClick={onProfile} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-text">
            {user.displayName}
          </span>
          {user._id === meId && (
            <span className="text-[10px] text-text-faint uppercase">you</span>
          )}
        </div>
        <div className="truncate text-xs text-text-faint">
          {user.customStatus || (online ? "Online" : `@${user.username}`)}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </motion.li>
  );
}