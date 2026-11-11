import { useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import {
  Trash2,
  Upload,
  MessageSquare,
  UserPlus,
  Camera,
  Check,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { uploadToConvex, formatJoined, cn } from "@/lib/utils";
import type { Profile as ProfileType } from "@/types";

const STATUS_OPTIONS = [
  { value: "online", label: "Online", dot: "#00e57a" },
  { value: "idle", label: "Idle", dot: "#f5c04a" },
  { value: "dnd", label: "Do not disturb", dot: "#f45c5c" },
  { value: "invisible", label: "Invisible", dot: "#5b5d64" },
] as const;

type ProfileData = ProfileType & {
  friendship?: "self" | "none" | "incoming" | "outgoing" | "friends";
};

export function ProfileModal() {
  const { token, me } = useAuth();
  const { modal, modalPayload, closeModal, pushToast } = useUI();
  const navigate = useNavigate();
  const openDm = useMutation(api.dms.open);
  const sendRequest = useMutation(api.friendships.sendRequest);

  const open = modal === "profile";
  const userId = modalPayload.userId;

  const rawProfile = useQuery(
    api.users.getProfile,
    open && token && userId ? { token, userId } : "skip",
  ) as ProfileData | null | undefined;

  const profile: ProfileData | null | undefined =
    rawProfile ?? (me && userId === me._id ? { ...me, friendship: "self" } : rawProfile);

  const isMe = profile?.friendship === "self";

  const message = () => {
    if (!token || !profile || !profile._id) return;
    openDm({ token, userId: profile._id })
      .then((channelId) => {
        closeModal();
        navigate(`/@me/${channelId}`);
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const addFriend = () => {
    if (!token || !profile || !profile._id) return;
    sendRequest({ token, username: profile.username })
      .then(() => {
        pushToast(`Friend request sent to @${profile.username}`, "success");
        closeModal();
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={isMe ? "Your profile" : "Profile"}
      width={420}
    >
      {profile === undefined && !isMe && (
        <p className="text-sm text-text-faint">Loading…</p>
      )}
      {profile === null && <p className="text-sm text-danger">User not found.</p>}
      {profile && (
        <div>
          <div
            className="relative -mx-5 -mt-4 mb-3 flex h-20 items-end justify-center"
            style={{ background: "linear-gradient(180deg, #1d2027 0%, #17181c 100%)" }}
          >
            <div className="translate-y-8">
              <Avatar
                name={profile.displayName}
                id={profile._id}
                url={profile.avatarUrl}
                size={80}
                status={profile.status}
                lastSeenAt={profile.lastSeenAt}
                showPresence
              />
            </div>
          </div>
          <div className="pt-10 text-center">
            <div className="text-lg font-semibold text-text">
              {profile.displayName}
            </div>
            <div className="text-sm text-text-dim">@{profile.username}</div>
            {profile.customStatus && (
              <div className="mt-1 text-sm text-text-dim">
                “{profile.customStatus}”
              </div>
            )}
            <div className="mt-1 text-xs text-text-faint">
              Member since {formatJoined(profile.createdAt)}
            </div>
          </div>
          {!isMe && (
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={message}>
                <MessageSquare size={14} /> Message
              </Button>
              {profile.friendship === "none" && (
                <Button variant="secondary" onClick={addFriend}>
                  <UserPlus size={14} /> Add friend
                </Button>
              )}
              {profile.friendship === "outgoing" && (
                <Button variant="ghost" disabled>
                  Request sent
                </Button>
              )}
              {profile.friendship === "incoming" && (
                <Button variant="ghost" disabled>
                  <Check size={14} /> Wants to be your friend
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function SettingsModal() {
  const { token, me, setStatus, logout } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setAvatar);
  const clearAvatar = useMutation(api.users.clearAvatar);
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(me?.displayName ?? "");
  const [customStatus, setCustomStatus] = useState(me?.customStatus ?? "");
  const [uploading, setUploading] = useState(false);
  const open = modal === "settings";

  if (!me) return null;

  const save = () => {
    if (!token) return;
    updateProfile({
      token,
      displayName: displayName.trim(),
      customStatus,
    })
      .then(() => pushToast("Profile updated", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const uploadAvatar = async (file: File) => {
    if (!token) return;
    if (!file.type.startsWith("image/")) {
      pushToast("Avatar must be an image", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      pushToast("Avatar must be under 8 MB", "error");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const storageId = await uploadToConvex(uploadUrl, file);
      await setAvatar({ token, storageId: storageId as Id<"_storage"> });
      pushToast("Avatar updated", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    if (!token) return;
    clearAvatar({ token })
      .then(() => pushToast("Avatar removed", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="User settings"
      width={520}
      footer={
        <>
          <Button variant="danger" onClick={() => void logout()}>
            Log out
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!displayName.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={me.displayName}
            id={me._id}
            url={me.avatarUrl}
            size={64}
            status={me.status}
            lastSeenAt={me.lastSeenAt}
            showPresence
          />
          <div className="flex flex-col gap-1.5">
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={13} /> {uploading ? "Uploading…" : "Upload avatar"}
            </Button>
            {me.avatarUrl && (
              <Button variant="ghost" className="text-xs" onClick={removeAvatar}>
                <Trash2 size={13} /> Remove avatar
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <span className="flex items-center gap-1 text-[10px] text-text-faint">
              <Camera size={10} /> PNG/JPG, max 8 MB
            </span>
          </div>
        </div>

        <div>
          <Label>Display name</Label>
          <Input
            value={displayName}
            maxLength={32}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div>
          <Label>Custom status</Label>
          <Input
            value={customStatus}
            maxLength={80}
            placeholder="What's happening?"
            onChange={(e) => setCustomStatus(e.target.value)}
          />
        </div>

        <div>
          <Label>Presence</Label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  me.status === opt.value
                    ? "border-accent bg-accent-dim text-accent"
                    : "border-line bg-bg-2 text-text-dim hover:border-line-strong",
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: opt.dot }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line bg-bg-2 p-3 text-xs text-text-dim">
          <strong className="text-text">Voice & video:</strong> mic/headphone
          toggles are wired to local state and ready for LiveKit. Voice rooms
          activate once a LiveKit project is connected (see README).
        </div>

        <div className="rounded-md border border-line bg-bg-2 p-3 text-xs text-text-dim">
          <strong className="text-text">Account:</strong> @{me.username} · member
          since {formatJoined(me.createdAt)}
        </div>
      </div>
    </Modal>
  );
}
