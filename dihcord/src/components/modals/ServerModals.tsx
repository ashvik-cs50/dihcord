import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Copy, Check, RefreshCw, Trash2, LogOut, Globe, Lock, Star } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { ServerEmojiManager } from "@/components/modals/ServerEmojiManager";
import type { ServerDetail, ExploreServer } from "@/types";

const SERVER_EMOJIS = ["🟢", "⚡", "🎮", "🚀", "🎧", "🔥", "🌊", "🌙", "🧩", "🛠️", "📢", "🧪"];

export function CreateServerModal() {
  const { token } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const create = useMutation(api.servers.create);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("🟢");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!token || !name.trim() || busy) return;
    setBusy(true);
    create({
      token,
      name: name.trim(),
      iconEmoji: emoji,
      description: description.trim() || undefined,
      isPublic,
    })
      .then((serverId) => {
        pushToast("Server created", "success");
        closeModal();
        navigate(`/channels/${serverId}`);
      })
      .catch((err: Error) => pushToast(err.message, "error"))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      open={modal === "createServer"}
      onClose={closeModal}
      title="Create a server"
      subtitle="Your server is private until you share an invite or make it public."
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || busy}>
            Create server
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-1.5">
            {SERVER_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border text-lg transition-colors",
                  emoji === e
                    ? "border-accent bg-accent-dim"
                    : "border-line bg-bg-2 hover:border-line-strong",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Server name</Label>
          <Input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. DIHCORD HQ"
          />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <Textarea
            rows={2}
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this server about?"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-bg-2 p-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 accent-[#00e57a]"
          />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-text">
              {isPublic ? <Globe size={14} className="text-accent" /> : <Lock size={14} />}
              Listed in Explore
            </div>
            <div className="text-xs text-text-dim">
              Public servers appear in the Explore directory for anyone to join.
            </div>
          </div>
        </label>
      </div>
    </Modal>
  );
}

export function JoinServerModal() {
  const { token } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const join = useMutation(api.servers.joinByInvite);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!token || !code.trim() || busy) return;
    setBusy(true);
    join({ token, code: code.trim() })
      .then((serverId) => {
        pushToast("Joined server", "success");
        closeModal();
        navigate(`/channels/${serverId}`);
      })
      .catch((err: Error) => pushToast(err.message, "error"))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      open={modal === "joinServer"}
      onClose={closeModal}
      title="Join a server"
      subtitle="Paste an invite code shared by a friend."
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!code.trim() || busy}>
            Join
          </Button>
        </>
      }
    >
      <Input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="e.g. k7m3x2pa"
      />
    </Modal>
  );
}

export function ExploreModal() {
  const { token } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const explore = useQuery(
    api.servers.explore,
    modal === "explore" && token ? { token } : "skip",
  ) as ExploreServer[] | undefined;
  const join = useMutation(api.servers.joinByInvite);
  const navigate = useNavigate();

  const joinServer = (code: string, serverId: string) => {
    if (!token) return;
    join({ token, code })
      .then(() => {
        pushToast("Joined server", "success");
        closeModal();
        navigate(`/channels/${serverId}`);
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={modal === "explore"}
      onClose={closeModal}
      title="Explore public servers"
      subtitle="Community servers that are open to everyone."
      width={560}
    >
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {explore === undefined && (
          <p className="py-6 text-center text-sm text-text-faint">Loading…</p>
        )}
        {explore && explore.length === 0 && (
          <p className="py-6 text-center text-sm text-text-faint">
            No public servers yet. Create one and mark it as listed in Explore!
          </p>
        )}
        {explore?.map((s) => (
          <div
            key={s._id}
            className="flex items-center gap-3 rounded-md border border-line bg-bg-2 p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bg-3 text-lg">
              {s.iconEmoji ?? s.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text">
                {s.name}
              </div>
              <div className="truncate text-xs text-text-dim">
                {s.description || "No description"}
              </div>
            </div>
            <div className="shrink-0 text-xs text-text-faint">
              {s.memberCount} member{s.memberCount === 1 ? "" : "s"}
            </div>
            <Button
              variant="primary"
              className="shrink-0 px-2.5 py-1.5 text-xs"
              onClick={() => joinServer(s.inviteCode, s._id)}
            >
              Join
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function CreateChannelModal({
  server,
}: {
  server: ServerDetail | undefined;
}) {
  const { token } = useAuth();
  const { modal, modalPayload, closeModal, pushToast } = useUI();
  const create = useMutation(api.channels.create);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">(
    (modalPayload.channelType as "text" | "voice") ?? "text",
  );
  const [category, setCategory] = useState(modalPayload.category ?? "TEXT CHANNELS");
  const [busy, setBusy] = useState(false);

  const open = modal === "createChannel";

  const submit = () => {
    if (!token || !server || !name.trim() || busy) return;
    setBusy(true);
    create({
      token,
      serverId: server._id,
      name: name.trim(),
      type,
      category: category.toUpperCase() || undefined,
    })
      .then((channelId) => {
        pushToast("Channel created", "success");
        closeModal();
        if (type === "text") navigate(`/channels/${server._id}/${channelId}`);
      })
      .catch((err: Error) => pushToast(err.message, "error"))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Create channel"
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || busy}>
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Type</Label>
          <div className="flex gap-2">
            {(["text", "voice"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors",
                  type === t
                    ? "border-accent bg-accent-dim text-accent"
                    : "border-line bg-bg-2 text-text-dim hover:border-line-strong",
                )}
              >
                {t === "text" ? "# text" : "🔊 voice"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Channel name</Label>
          <Input
            autoFocus
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={type === "text" ? "e.g. announcements" : "e.g. Hangout"}
          />
          {type === "text" && name && (
            <p className="mt-1 text-[11px] text-text-faint">
              Will be created as #
              {name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}
            </p>
          )}
        </div>
        <div>
          <Label>Category</Label>
          <Input
            value={category}
            maxLength={32}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="TEXT CHANNELS"
          />
        </div>
      </div>
    </Modal>
  );
}

export function EditChannelModal() {
  const { token } = useAuth();
  const { modal, modalPayload, closeModal, pushToast } = useUI();
  const update = useMutation(api.channels.update);
  const remove = useMutation(api.channels.remove);

  const [name, setName] = useState(modalPayload.channelName ?? "");
  const [category, setCategory] = useState("");
  const open = modal === "editChannel";

  const submit = () => {
    if (!token || !modalPayload.channelId) return;
    update({
      token,
      channelId: modalPayload.channelId,
      name: name.trim(),
      category: category.trim() || undefined,
    })
      .then(() => {
        pushToast("Channel updated", "success");
        closeModal();
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const del = () => {
    if (!token || !modalPayload.channelId) return;
    if (!window.confirm(`Delete #${modalPayload.channelName}? This cannot be undone.`))
      return;
    remove({ token, channelId: modalPayload.channelId })
      .then(() => {
        pushToast("Channel deleted", "success");
        closeModal();
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`Edit #${modalPayload.channelName ?? "channel"}`}
      footer={
        <>
          <Button variant="danger" onClick={del}>
            <Trash2 size={14} /> Delete channel
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            autoFocus
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <div>
          <Label>Category</Label>
          <Input
            value={category}
            maxLength={32}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Leave empty to keep current"
          />
        </div>
      </div>
    </Modal>
  );
}

export function InviteModal({ server }: { server: ServerDetail | undefined }) {
  const { token } = useAuth();
  const { modal, modalPayload, closeModal, pushToast } = useUI();
  const regenerate = useMutation(api.servers.regenerateInvite);
  const [copied, setCopied] = useState(false);
  const open = modal === "invite";

  const code = server?.inviteCode ?? "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast("Copy failed — code shown below", "error");
    }
  };

  const regen = () => {
    if (!token || !server) return;
    regenerate({ token, serverId: server._id })
      .then(() => pushToast("Invite code regenerated", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`Invite people to ${modalPayload.serverName ?? server?.name ?? "your server"}`}
      subtitle="Share this code — friends join from the Join a server dialog."
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border border-line bg-bg-deep px-3 py-2.5 font-mono text-base tracking-widest text-accent select-all">
          {code}
        </div>
        <Button variant="secondary" onClick={() => void copy()}>
          {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={regen} className="text-xs">
          <RefreshCw size={13} /> Regenerate code
        </Button>
      </div>
    </Modal>
  );
}

export function ServerSettingsModal({
  server,
}: {
  server: ServerDetail | undefined;
}) {
  const { token, me } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const update = useMutation(api.servers.update);
  const regenerate = useMutation(api.servers.regenerateInvite);
  const remove = useMutation(api.servers.remove);
  const leave = useMutation(api.servers.leave);
  const navigate = useNavigate();

  const [name, setName] = useState(server?.name ?? "");
  const [description, setDescription] = useState(server?.description ?? "");
  const [isPublic, setIsPublic] = useState(server?.isPublic ?? false);
  const open = modal === "serverSettings";

  if (!server) return null;
  const isOwner = server.ownerId === me?._id;
  const canModerate = server.myRole !== "member";
  const save = () => {
    if (!token) return;
    update({
      token,
      serverId: server._id,
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    })
      .then(() => {
        pushToast("Server updated", "success");
        closeModal();
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const regen = () => {
    if (!token) return;
    regenerate({ token, serverId: server._id })
      .then(() => pushToast("Invite code regenerated", "success"))
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const del = () => {
    if (!token || !isOwner) return;
    if (!window.confirm(`Delete "${server.name}" permanently? All channels and messages will be lost.`))
      return;
    remove({ token, serverId: server._id })
      .then(() => {
        pushToast("Server deleted", "success");
        closeModal();
        navigate("/@me");
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  const leaveServer = () => {
    if (!token) return;
    if (!window.confirm(`Leave "${server.name}"?`)) return;
    leave({ token, serverId: server._id })
      .then(() => {
        pushToast("Left server", "success");
        closeModal();
        navigate("/@me");
      })
      .catch((err: Error) => pushToast(err.message, "error"));
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`${server.name} — settings`}
      subtitle={isOwner ? "You are the owner of this server." : `Your role: ${server.myRole}`}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          {canModerate && <Button onClick={save}>Save changes</Button>}
        </>
      }
    >
      <div className="space-y-4">
        {canModerate ? (
          <>
            <div>
              <Label>Server name</Label>
              <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-bg-2 p-3">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 accent-[#00e57a]"
              />
              <div>
                <div className="text-sm font-medium text-text">Listed in Explore</div>
                <div className="text-xs text-text-dim">
                  Public servers appear in the Explore directory.
                </div>
              </div>
            </label>
            <div className="flex items-center gap-2 rounded-md border border-line bg-bg-2 p-3">
              <span className="font-mono text-sm tracking-widest text-accent">
                {server.inviteCode}
              </span>
              <Button variant="ghost" className="ml-auto text-xs" onClick={regen}>
                <RefreshCw size={13} /> Regenerate
              </Button>
            </div>
            {canModerate && (
              <div className="mt-3 rounded-lg border border-line bg-bg-2 p-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-accent" />
                  <div>
                    <div className="text-sm font-medium text-text">Custom emojis</div>
                    <div className="text-xs text-text-dim">
                      Manage server emoji collection
                    </div>
                  </div>
                  <button
                    onClick={() => openModal("serverEmojiManager")}
                    className="ml-auto rounded px-2 py-1 text-xs text-accent hover:bg-accent-dim"
                  >
                    Manage
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-dim">
            Only owners and admins can edit server settings.
          </p>
        )}

        <div className="rounded-md border border-danger/30 bg-[#241416] p-3">
          <h4 className="mb-1 text-xs font-semibold tracking-wide text-danger uppercase">
            Danger zone
          </h4>
          <div className="flex gap-2">
            {!isOwner && (
              <Button variant="secondary" className="text-xs" onClick={leaveServer}>
                <LogOut size={13} /> Leave server
              </Button>
            )}
            {isOwner && (
              <Button variant="danger" className="text-xs" onClick={del}>
                <Trash2 size={13} /> Delete server
              </Button>
            )}
          </div>
        </div>
      </div>
      {canModerate && (
        <ServerEmojiManager server={server} />
      )}
    </Modal>
  );
}
