import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Id } from "@convex/_generated/dataModel";

export function ServerEmojiManager({
  server,
}: {
  server: { _id: Id<"servers">; name: string } | undefined;
}) {
  const { token } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const listEmojis = useQuery(
    api.emojis.listServerEmojis,
    server && token ? { token, serverId: server._id } : "skip",
  ) as { _id: string; name: string; url: string | null }[] | undefined;
  const uploadEmoji = useMutation(api.emojis.uploadEmoji);
  const deleteEmoji = useMutation(api.emojis.deleteEmoji);
  const generateUploadUrl = useMutation(api.emojis.generateEmojiUploadUrl);

  const open = modal === "serverEmojiManager";
  const [emojiName, setEmojiName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!server) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const upload = async () => {
    if (!token || !file || !emojiName.trim()) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ token, serverId: server._id });
      const storageId = await (await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })).json() as { storageId: Id<"_storage"> };
      await uploadEmoji({
        token,
        serverId: server._id,
        name: emojiName.trim(),
        imageStorageId: storageId.storageId,
      });
      pushToast("Emoji uploaded", "success");
      setEmojiName("");
      setFile(null);
      if (document.getElementById("emoji-file-input")) {
        (document.getElementById("emoji-file-input") as HTMLInputElement).value = "";
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (emojiId: string) => {
    if (!token) return;
    if (!window.confirm("Delete this emoji?")) return;
    try {
      await deleteEmoji({ token, serverId: server._id, emojiId: emojiId as Id<"serverEmojis"> });
      // Note: storage cleanup handled server-side
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`Emoji — ${server.name}`}
      subtitle="Manage custom server emojis"
      width={560}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-bg-2 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              id="emoji-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <label className="flex items-center gap-2 rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text cursor-pointer hover:border-line-strong">
              <ImageIcon size={14} className="shrink-0" />
              <span>Choose image</span>
            </label>
            <Input
              value={emojiName}
              onChange={(e) => setEmojiName(e.target.value)}
              placeholder="emoji name"
              maxLength={32}
              className="max-w-xs"
              disabled={!file}
            />
            <Button onClick={upload} disabled={!file || !emojiName.trim() || uploading} className="text-xs">
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          <p className="text-[10px] text-text-faint">
            PNG/JPG under 256 KB. Name: 2-32 lowercase letters, numbers, underscores.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            Custom emojis ({listEmojis?.length ?? 0})
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {listEmojis?.map((e) => (
              <div
                key={e._id}
                className="relative group flex flex-col items-center gap-1"
              >
                {e.url && (
                  <img
                    src={e.url}
                    alt={e.name}
                    className="h-8 w-8 rounded-md object-cover border border-line"
                  />
                )}
                <span className="text-[10px] truncate text-text-dim">{e.name}</span>
                <button
                  onClick={() => remove(e._id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-danger rounded p-1 transition-opacity"
                  title="Delete"
                >
                  <Trash2 size={10} className="text-white" />
                </button>
              </div>
            ))}
            {listEmojis?.length === 0 && (
              <p className="py-4 text-center text-xs text-text-faint">
                No custom emojis yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={closeModal}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}