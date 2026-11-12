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

export function PersonalEmojiManager() {
  const { token } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const emojis = useQuery(
    api.users.listUserEmojis,
    token ? { token } : "skip",
  ) as { _id: string; name: string; url: string | null; animated: boolean }[] | undefined;
  const uploadEmoji = useMutation(api.users.uploadUserEmoji);
  const deleteEmoji = useMutation(api.users.deleteUserEmoji);
  const generateUploadUrl = useMutation(api.users.generateUserEmojiUploadUrl);

  const open = modal === "personalEmojiManager";
  const [emojiName, setEmojiName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [animated, setAnimated] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const upload = async () => {
    if (!token || !file || !emojiName.trim()) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const storageId = await (await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })).json() as { storageId: Id<"_storage"> };
      await uploadEmoji({
        token,
        name: emojiName.trim(),
        imageStorageId: storageId.storageId,
        animated,
      });
      pushToast("Personal emoji uploaded", "success");
      setEmojiName("");
      setFile(null);
      setAnimated(false);
      const input = document.getElementById("personal-emoji-file-input");
      if (input) (input as HTMLInputElement).value = "";
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (emojiId: string) => {
    if (!token) return;
    if (!window.confirm("Delete this personal emoji?")) return;
    try {
      await deleteEmoji({ token, emojiId: emojiId as Id<"userEmojis"> });
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="My emoji"
      subtitle="Your personal custom emojis, usable anywhere"
      width={560}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-bg-2 p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input
              id="personal-emoji-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <label className="flex items-center gap-2 rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text cursor-pointer hover:border-line-strong">
              <ImageIcon size={14} className="shrink-0" />
              <span>Choose image (GIF supported)</span>
            </label>
            <Input
              value={emojiName}
              onChange={(e) => setEmojiName(e.target.value)}
              placeholder="emoji name"
              maxLength={32}
              className="max-w-md"
              disabled={!file}
            />
            <label className="flex items-center gap-1 rounded-md border border-line-strong bg-bg-deep px-2 py-1.5 text-xs text-text cursor-pointer hover:border-line-strong">
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
                className="accent-accent"
              />
              <span>Animated</span>
            </label>
            <Button onClick={upload} disabled={!file || !emojiName.trim() || uploading} className="text-xs">
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          <p className="text-[10px] text-text-faint">
            PNG/JPG/GIF under 256 KB. Name: 2-32 lowercase letters, numbers, underscores.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            My emojis ({emojis?.length ?? 0})
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {emojis?.map((e) => (
              <div key={e._id} className="relative group flex flex-col items-center gap-1">
                {e.url && (
                  <img
                    src={e.url}
                    alt={e.name}
                    className="h-8 w-8 rounded-md object-cover border border-line"
                  />
                )}
                {e.animated && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent text-[#062b18] text-[9px] flex items-center justify-center">↻</span>
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
            {emojis?.length === 0 && (
              <p className="py-4 text-center text-xs text-text-faint">
                No personal emojis yet.
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
