import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import {
  SmilePlus,
  Reply,
  Pencil,
  Trash2,
  Check,
  X,
  Download,
  CornerUpLeft,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Avatar } from "@/components/ui/Avatar";
import { EnhancedEmojiPicker } from "@/components/ui/EnhancedEmojiPicker";
import { QUICK_REACTIONS } from "@/lib/emojis";
import { renderMessageContent } from "./content";
import { cn, formatMessageTime, formatBytes } from "@/lib/utils";
import type { Member, Message, Reaction } from "@/types";

export function MessageItem({
  message,
  compact,
  members,
  reactions,
  canDelete,
  onReply,
  highlight,
  serverId,
}: {
  message: Message;
  compact: boolean;
  members: Map<string, Member>;
  reactions: Reaction[];
  canDelete: boolean;
  onReply: (message: Message) => void;
  highlight: boolean;
  serverId?: Id<"servers">;
}) {
  const { token, me } = useAuth();
  const { pushToast, openModal } = useUI();
  const toggleReaction = useMutation(api.reactions.toggle);
  const editMessage = useMutation(api.messages.edit);
  const deleteMessage = useMutation(api.messages.remove);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const author = members.get(message.authorId);
  const authorName =
    author?.displayName ?? message.replyTo?.authorName ?? "Unknown user";
  const mine = message.authorId === me?._id;

  const reactionGroups = new Map<string, { count: number; mine: boolean; userIds: string[] }>();
  for (const r of reactions) {
    const group = reactionGroups.get(r.emoji) ?? { count: 0, mine: false, userIds: [] };
    group.count += 1;
    if (r.userId === me?._id) group.mine = true;
    group.userIds.push(r.userId);
    reactionGroups.set(r.emoji, group);
  }

  const react = (emoji: string) => {
    if (!token) return;
    setPickerOpen(false);
    toggleReaction({ token, messageId: message._id, emoji }).catch((err: Error) =>
      pushToast(err.message, "error"),
    );
  };

  const saveEdit = () => {
    if (!token) return;
    const content = editText.trim();
    if (!content && message.attachments.length === 0) {
      pushToast("Message cannot be empty", "error");
      return;
    }
    editMessage({ token, messageId: message._id, content })
      .then(() => setEditing(false))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const knownUsernames = new Set(
    [...members.values()].map((m) => m.username),
  );

  return (
    <motion.div
      whileHover={{ backgroundColor: mine ? "rgba(0,229,122,0.03)" : "var(--color-bg-2)" }}
      id={`msg-${message._id}`}
      className={cn(
        "group relative px-4 transition-colors duration-100",
        compact ? "py-0.5" : "mt-3 py-0.5 pt-1",
        highlight && "bg-accent-dim/30",
      )}
    >
      {compact && (
        <span className="absolute top-1.5 left-0 w-16 text-right text-[10px] leading-5 text-text-faint opacity-0 transition-opacity group-hover:opacity-100">
          {formatMessageTime(message.createdAt)}
        </span>
      )}

      {message.replyTo && !compact && (
        <div className="mb-1 flex items-center gap-1.5 pl-11 text-xs text-text-faint">
          <CornerUpLeft size={12} className="shrink-0" />
          <span
            onClick={() => {
              document
                .getElementById(`msg-${message.replyTo!.messageId}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            role="button"
            className="truncate cursor-pointer hover:text-text-dim"
          >
            <span className="font-medium text-text-dim">
              {message.replyTo.authorName}
            </span>{" "}
            {message.replyTo.contentPreview || "(attachment)"}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {compact ? (
          <div className="w-8 shrink-0" />
        ) : (
          <button
            onClick={() =>
              author && openModal("profile", { userId: author.userId })
            }
            className="mt-0.5 shrink-0"
          >
            <Avatar
              name={authorName}
              id={message.authorId}
              url={author?.avatarUrl}
              size={40}
            />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {!compact && (
            <div className="flex items-baseline gap-2">
              <button
                onClick={() =>
                  author && openModal("profile", { userId: author.userId })
                }
                className="truncate font-semibold text-[15px] text-text hover:underline"
              >
                {authorName}
              </button>
              <span className="text-[11px] text-text-faint">
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          )}

          {editing ? (
            <div className="mt-0.5">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  } else if (e.key === "Escape") {
                    setEditing(false);
                    setEditText(message.content);
                  }
                }}
                rows={2}
                className="w-full resize-none rounded-md border border-accent/60 bg-bg-deep px-3 py-2 text-sm text-text focus:outline-none"
              />
              <div className="mt-1 flex items-center gap-2 text-[11px] text-text-faint">
                <span>escape to cancel · enter to save</span>
                <button
                  onClick={saveEdit}
                  className="rounded bg-accent p-1 text-[#062b18] hover:bg-accent-hover"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditText(message.content);
                  }}
                  className="rounded bg-bg-3 p-1 text-text hover:bg-bg-hover"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            message.content && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-0.5"
              >
                <p
                  className={cn(
                    "text-[15px] leading-[1.5] break-words whitespace-pre-wrap",
                    mine ? "text-text" : "text-text/95",
                  )}
                >
                  {renderMessageContent(
                    message.content,
                    knownUsernames,
                    me?.username,
                    (username) => {
                      const target = [...members.values()].find(
                        (m) => m.username === username,
                      );
                      if (target) openModal("profile", { userId: target.userId });
                    },
                  )}
                  {message.editedAt && (
                    <span className="ml-1.5 text-[10px] text-text-faint">
                      (edited)
                    </span>
                  )}
                </p>
              </motion.div>
            )
          )}

          {message.attachments.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {message.attachments.map((att) =>
                att.mimeType.startsWith("image/") ? (
                  <motion.a
                    key={att.storageId}
                    whileHover={{ scale: 1.02 }}
                    href={att.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-sm overflow-hidden rounded-lg border border-line"
                  >
                    <img
                      src={att.url ?? ""}
                      alt={att.name}
                      loading="lazy"
                      className="max-h-72 w-auto object-cover"
                      draggable={false}
                    />
                  </motion.a>
                ) : (
                  <motion.a
                    key={att.storageId}
                    whileHover={{ scale: 1.02 }}
                    href={att.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border border-line bg-bg-2 px-3 py-2 text-sm text-text-dim transition-colors hover:border-line-strong hover:text-text"
                  >
                    <Download size={16} className="shrink-0 text-accent" />
                    <span className="max-w-[200px] truncate">{att.name}</span>
                    <span className="text-xs text-text-faint">
                      {formatBytes(att.size)}
                    </span>
                  </motion.a>
                ),
              )}
            </div>
          )}

          {reactionGroups.size > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {[...reactionGroups.entries()].map(([emoji, group]) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => react(emoji)}
                  title={group.userIds
                    .map((id) => members.get(id)?.displayName ?? "user")
                    .join(", ")}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors",
                    group.mine
                      ? "border-accent/50 bg-accent-dim text-accent"
                      : "border-line bg-bg-2 text-text-dim hover:border-line-strong hover:text-text",
                  )}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="font-medium">{group.count}</span>
                </motion.button>
              ))}
              {pickerOpen && (
                <div className="relative">
                  <EnhancedEmojiPicker
                    align="left"
                    serverId={serverId}
                    onPick={(emoji) => {
                      if (typeof emoji === "string") {
                        react(emoji);
                      } else {
                        react(emoji.name);
                      }
                      setPickerOpen(false);
                    }}
                    onClose={() => setPickerOpen(false)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover toolbar */}
      {!editing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute -top-3 right-4 z-10 flex items-center overflow-hidden rounded-md border border-line bg-surface shadow-lg",
            confirmDelete || pickerOpen ? "opacity-100" : "opacity-0",
          )}
        >
          {confirmDelete ? (
            <>
              <button
                onClick={() => {
                  if (!token) return;
                  deleteMessage({ token, messageId: message._id })
                    .then(() => pushToast("Message deleted", "success"))
                    .catch((err: Error) => pushToast(err.message, "error"));
                  setConfirmDelete(false);
                }}
                className="bg-danger px-2.5 py-1.5 text-xs font-medium text-white hover:bg-danger-hover"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 text-xs text-text-dim hover:text-text"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => react(emoji)}
                  className="px-1.5 py-1 text-sm hover:bg-bg-3"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setPickerOpen((v) => !v)}
                title="Add reaction"
                className="px-1.5 py-1 text-text-dim hover:text-text"
              >
                <SmilePlus size={15} />
              </button>
              <button
                onClick={() => onReply(message)}
                title="Reply"
                className="px-1.5 py-1 text-text-dim hover:text-text"
              >
                <Reply size={15} />
              </button>
              {mine && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setEditText(message.content);
                  }}
                  title="Edit"
                  className="px-1.5 py-1 text-text-dim hover:text-text"
                >
                  <Pencil size={14} />
                </button>
              )}
              {(mine || canDelete) && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete"
                  className="px-1.5 py-1 text-text-dim hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </motion.div>
      )}

      {pickerOpen && reactionGroups.size === 0 && (
        <div className="absolute right-8 -top-2 z-20">
          <EnhancedEmojiPicker
            align="right"
            serverId={serverId}
            onPick={(emoji) => {
              if (typeof emoji === "string") {
                react(emoji);
              } else {
                react(emoji.name);
              }
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        </div>
      )}
    </motion.div>
  );
}