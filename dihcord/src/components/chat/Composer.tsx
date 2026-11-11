import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { Paperclip, Smile, SendHorizontal, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { EnhancedEmojiPicker } from "@/components/ui/EnhancedEmojiPicker";
import { uploadToConvex, formatBytes, cn } from "@/lib/utils";
import type { Message } from "@/types";

type PendingAttachment = {
  name: string;
  size: number;
  mimeType: string;
  storageId?: Id<"_storage">;
  uploading: boolean;
};

const MAX_MESSAGE_LENGTH = 2000;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENTS = 5;

export function Composer({
  channelId,
  replyTo,
  onCancelReply,
  getAuthorName,
}: {
  channelId: Id<"channels">;
  replyTo: Message | null;
  onCancelReply: () => void;
  getAuthorName: (userId: Id<"users">) => string;
}) {
  const { token } = useAuth();
  const { pushToast } = useUI();
  const send = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const setTyping = useMutation(api.typing.setTyping);

  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    if (attachments.length > 0 && attachments.every((a) => !a.uploading)) {
      textareaRef.current?.focus();
    }
  }, [attachments]);

  const onTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > 3000 && token) {
      lastTypingSentRef.current = now;
      void setTyping({ token, channelId }).catch(() => {});
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) return;
    const slots = MAX_TOTAL_ATTACHMENTS - attachments.length;
    const chosen = [...files].slice(0, Math.max(0, slots));
    if (chosen.length === 0) {
      pushToast(`Maximum ${MAX_TOTAL_ATTACHMENTS} attachments per message`, "error");
      return;
    }
    for (const file of chosen) {
      if (file.size > MAX_FILE_SIZE) {
        pushToast(`${file.name} exceeds the 20 MB limit`, "error");
        continue;
      }
      const pending: PendingAttachment = {
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        uploading: true,
      };
      setAttachments((prev) => [...prev, pending]);
      try {
        const uploadUrl = await generateUploadUrl({ token, channelId });
        const storageId = await uploadToConvex(uploadUrl, file);
        setAttachments((prev) =>
          prev.map((a) =>
            a.name === pending.name && a.uploading
              ? { ...a, storageId: storageId as Id<"_storage">, uploading: false }
              : a,
          ),
        );
      } catch (err) {
        pushToast(
          err instanceof Error ? err.message : "Upload failed",
          "error",
        );
        setAttachments((prev) => prev.filter((a) => a !== pending));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!token || sending) return;
    const content = value.trim();
    if (!content && !attachments.some((a) => a.storageId)) return;
    if (attachments.some((a) => a.uploading)) {
      pushToast("Wait for uploads to finish", "error");
      return;
    }
    setSending(true);
    try {
      await send({
        token,
        channelId,
        content,
        attachments: attachments
          .filter((a) => a.storageId)
          .map((a) => ({
            storageId: a.storageId!,
            name: a.name,
            mimeType: a.mimeType,
            size: a.size,
          })),
        replyTo: replyTo
          ? {
              messageId: replyTo._id,
              authorId: replyTo.authorId,
              authorName: getAuthorName(replyTo.authorId),
              contentPreview:
                replyTo.content.slice(0, 120) || "(attachment)",
            }
          : undefined,
      });
      setValue("");
      setAttachments([]);
      onCancelReply();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  const nearLimit = value.length > MAX_MESSAGE_LENGTH - 200;
  const overLimit = value.length > MAX_MESSAGE_LENGTH;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative shrink-0 px-4 pb-5"
    >
      {replyTo && (
        <div className="flex items-center gap-2 rounded-t-md border border-line border-b-0 bg-bg-2 px-3 py-1.5 text-xs text-text-dim">
          <span className="text-text-faint">Replying to</span>
          <span className="truncate font-medium text-text">
            {replyTo.content.slice(0, 60) || "(attachment)"}
          </span>
          <button
            onClick={onCancelReply}
            className="ml-auto rounded p-0.5 hover:bg-bg-3 hover:text-text"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-2 border border-line bg-bg-2 px-3 py-2",
            replyTo ? "" : "rounded-t-md border-b-0",
          )}
        >
          {attachments.map((a, i) => (
            <motion.div
              key={`${a.name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded border border-line-strong bg-bg-3 px-2 py-1 text-xs text-text-dim"
            >
              <Paperclip size={12} className={a.uploading ? "animate-pulse" : ""} />
              <span className="max-w-[160px] truncate text-text">{a.name}</span>
              <span className="text-text-faint">{formatBytes(a.size)}</span>
              {a.uploading ? (
                <span className="text-accent">uploading…</span>
              ) : (
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="rounded p-0.5 hover:bg-bg-hover hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        whileHover={{ borderColor: "var(--color-accent)" }}
        className={cn(
          "relative flex items-end gap-1 rounded-xl border border-line-strong bg-bg-2 px-2 py-2 transition-colors focus-within:border-accent/60",
          replyTo || attachments.length > 0 ? "rounded-t-none border-t" : "",
        )}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Attach files (max 20 MB)"
          className="rounded p-1.5 text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void pickFiles(e.target.files)}
        />
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(e) => {
            setValue(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Message…"
          className="max-h-[220px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[15px] text-text placeholder:text-text-faint focus:outline-none"
        />
        {nearLimit && (
          <span
            className={cn(
              "pb-2 text-[11px]",
              overLimit ? "text-danger" : "text-text-faint",
            )}
          >
            {value.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}
        <button
          onClick={() => setEmojiOpen((v) => !v)}
          title="Emoji"
          className="rounded p-1.5 text-text-dim transition-colors hover:bg-bg-3 hover:text-text"
        >
          <Smile size={18} />
        </button>
        <button
          onClick={() => void submit()}
          disabled={sending || overLimit || (!value.trim() && !attachments.some((a) => a.storageId))}
          title="Send"
          className="rounded p-1.5 text-accent transition-colors hover:bg-accent-dim disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>

        {emojiOpen && (
          <EnhancedEmojiPicker
            align="right"
            serverId={undefined}
            onPick={(emoji) => {
              if (typeof emoji === "string") {
                insertEmoji(emoji);
              } else {
                insertEmoji(`:${emoji.name}:`);
              }
              setEmojiOpen(false);
            }}
            onClose={() => setEmojiOpen(false)}
          />
        )}
      </motion.div>
      <div className="h-1" />
    </motion.div>
  );
}