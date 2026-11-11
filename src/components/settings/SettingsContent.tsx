import { useState } from "react";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Palette as PaletteIcon,
  Bell as BellIcon,
  Mic as MicIcon,
  Key as KeyIcon,
  Link as LinkIcon,
  Eye as EyeIcon,
  Lock as LockIcon,
  MoreHorizontal as MoreIcon,
  Palette,
  Image,
  RotateCw,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { ThemePicker } from "@/components/customization/ThemePicker";
import { useTheme } from "@/contexts/themes/ThemeProvider";

const SETTINGS_SECTIONS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "My Account", icon: UserIcon },
  { id: "profile", label: "Profile", icon: SettingsIcon },
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "accessibility", label: "Accessibility", icon: EyeIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "privacy", label: "Privacy", icon: LockIcon },
  { id: "voice", label: "Voice & Video", icon: MicIcon },
  { id: "keybinds", label: "Keybinds", icon: KeyIcon },
  { id: "devices", label: "Devices", icon: LinkIcon },
  { id: "connections", label: "Connections", icon: LinkIcon },
  { id: "customization", label: "Customization Studio", icon: PaletteIcon },
  { id: "advanced", label: "Advanced", icon: MoreIcon },
];

export function SettingsContent() {
  const { modal, closeModal } = useUI();
  const { me, token, logout, unreadNotifications } = useAuth();
  const [section, setSection] = useState("account");
  const [displayName, setDisplayName] = useState(me?.displayName ?? "");
  const [customStatus, setCustomStatus] = useState(me?.customStatus ?? "");

  if (!me) return null;

  return (
    <Modal
      open={modal === "settings"}
      onClose={closeModal}
      title="User Settings"
      width={760}
    >
      <div className="flex h-[600px] w-full">
        {/* Sidebar */}
        <div className="flex w-[200px] shrink-0 flex-col border-r border-line bg-bg-1">
          <div className="flex-1 overflow-y-auto p-3">
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  section === s.id
                    ? "bg-accent text-[#062b18]"
                    : "text-text-dim hover:bg-bg-3 hover:text-text",
                )}
              >
                <s.icon className="shrink-0 w-5 h-5" />
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-line">
            <Button
              variant="danger"
              className="w-full text-xs"
              onClick={() => {
                if (token) void logout().catch(() => {});
                closeModal();
              }}
            >
              Log out
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-bg-0 p-6">
          <AnimatePresence>
            <motion.div
              key={section}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {section === "account" && <AccountSection me={me} />}
              {section === "profile" && <ProfileSection
                displayName={displayName}
                setDisplayName={setDisplayName}
                customStatus={customStatus}
                setCustomStatus={setCustomStatus}
                me={me}
              />}
              {section === "appearance" && <ThemePicker />}
              {section === "customization" && <CustomizationStudio />}
              {section === "notifications" && <NotificationsSection unreadNotifications={unreadNotifications} />}
              {section === "privacy" && <PrivacySection />}
              {section === "voice" && <VoiceSection />}
              {section === "keybinds" && <KeybindsSection />}
              {section === "devices" && <DevicesSection />}
              {section === "connections" && <ConnectionsSection />}
              {section === "customization" && <CustomizationStudio />}
              {section === "advanced" && <AdvancedSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}

function AccountSection({ me }: { me: { _id: string; username: string; displayName: string; createdAt: number } }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Account</h2>
        <p className="mt-1 text-sm text-text-dim">
          Manage your DIHCORD account details.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              Username
            </label>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-auto items-center rounded-md border border-line-strong bg-bg-deep px-3 text-xs text-text-dim">
                @{me?.username}
              </span>
              <span className="text-xs text-text-faint">Cannot be changed</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              Email
            </label>
            <div className="flex h-9 items-center rounded-md border border-line-strong bg-bg-deep px-3 text-xs text-text-dim">
              Not configured
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              Member since
            </label>
            <div className="flex h-9 items-center rounded-md border border-line-strong bg-bg-deep px-3 text-xs text-text-dim">
              {new Date(me?.createdAt ?? 0).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              User ID
            </label>
            <div className="flex h-9 items-center rounded-md border border-line-strong bg-bg-deep px-3 text-xs font-mono text-text-dim truncate">
              {me?._id}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Change password</h3>
        <p className="mb-3 text-xs text-text-faint">
          Your password is stored securely with scrypt hashing.
        </p>
        <div className="space-y-3">
          <Input placeholder="Current password" type="password" />
          <Input placeholder="New password" type="password" />
          <Input placeholder="Confirm new password" type="password" />
          <Button variant="secondary" className="w-fit">
            Change password
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  displayName,
  setDisplayName,
  customStatus,
  setCustomStatus,
  me,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  customStatus: string;
  setCustomStatus: (v: string) => void;
  me: { _id: string; username: string; displayName: string; createdAt: number } | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Profile</h2>
        <p className="mt-1 text-sm text-text-dim">
          Customize how you appear to others.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5">
        <div>
          <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
            Display name
          </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
            />
        </div>
        <div className="mt-5">
          <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
            Custom status
          </label>
          <Input
            value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            maxLength={80}
            placeholder="What's happening?"
          />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Avatar</h3>
        <p className="mb-3 text-xs text-text-faint">
          Upload a square image (PNG/JPG, max 8 MB).
        </p>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-bg-3 flex items-center justify-center text-lg">
            {me?.displayName?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <Button variant="secondary" className="text-xs">
            Upload avatar
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({ unreadNotifications }: { unreadNotifications: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Notifications</h2>
        <p className="mt-1 text-sm text-text-dim">
          Manage when and how you receive notifications.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-4">
        {[
          { id: "mentions", label: "Mentions", desc: "Notify when someone mentions you" },
          { id: "friendRequests", label: "Friend requests", desc: "Notify when someone sends you a friend request" },
          { id: "serverInvites", label: "Server invites", desc: "Notify when you are invited to a server" },
          { id: "directMessages", label: "Direct messages", desc: "Notify when you receive a direct message" },
        ].map((n) => (
          <div key={n.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text">{n.label}</div>
              <div className="text-xs text-text-faint">{n.desc}</div>
            </div>
            <button className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-line bg-bg-2 transition-colors focus:outline-none">
              <span className="inline-block h-4 w-4 rounded-full bg-accent transition-transform translate-x-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-text-faint uppercase mb-3">Unread notifications</h3>
        <p className="text-xs text-text-dim">
          {unreadNotifications} unread notification{unreadNotifications !== 1 ? "s" : ""}.
        </p>
        <Button variant="secondary" className="w-fit text-xs">
          Mark all as read
        </Button>
      </div>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Privacy</h2>
        <p className="mt-1 text-sm text-text-dim">
          Control who can contact you and see your information.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-4">
        {[
          { id: "directMessages", label: "Direct messages", desc: "Allow anyone to DM you" },
          { id: "friendRequests", label: "Friend requests", desc: "Allow anyone to send you friend requests" },
          { id: "status", label: "Online status", desc: "Show your online status to friends" },
          { id: "activity", label: "Activity status", desc: "Show what you're doing" },
        ].map((n) => (
          <div key={n.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text">{n.label}</div>
              <div className="text-xs text-text-faint">{n.desc}</div>
            </div>
            <button className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-line bg-bg-2 transition-colors focus:outline-none">
              <span className="inline-block h-4 w-4 rounded-full bg-accent transition-transform translate-x-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-text-faint uppercase mb-3">Blocked users</h3>
        <p className="text-xs text-text-faint">You haven't blocked any users.</p>
        <Button variant="secondary" className="w-fit text-xs">
          Manage blocked users
        </Button>
      </div>
    </div>
  );
}

function VoiceSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Voice & Video</h2>
        <p className="mt-1 text-sm text-text-dim">
          Configure your audio and video devices for calls.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-4">
        <div className="space-y-3">
          <label className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            Input device
          </label>
          <select className="w-full rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text">
            <option>Default microphone</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            Output device
          </label>
          <select className="w-full rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text">
            <option>Default speakers</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
            Camera device
          </label>
          <select className="w-full rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text">
            <option>Default camera</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-text-faint uppercase mb-3">Voice activity</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-bg-3 rounded-full overflow-hidden">
            <div className="h-full bg-accent w-1/3" />
          </div>
          <span className="text-xs text-text-dim">-42 dB</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-accent" />
          <span className="text-sm text-text">Push to talk</span>
        </label>
      </div>
    </div>
  );
}

function KeybindsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Keybinds</h2>
        <p className="mt-1 text-sm text-text-dim">
          Customize keyboard shortcuts.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        {[
          { label: "Toggle mute", key: "Ctrl + Shift + M" },
          { label: "Toggle deafen", key: "Ctrl + Shift + D" },
          { label: "Toggle overlay", key: "Ctrl + Shift + O" },
          { label: "Push to talk", key: "None" },
          { label: "Search", key: "Ctrl + K" },
        ].map((k) => (
          <div key={k.label} className="flex items-center justify-between">
            <div className="text-sm text-text">{k.label}</div>
            <div className="flex items-center gap-2 text-xs text-text-faint bg-bg-1 border border-line rounded px-2 py-1">
              {k.key}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevicesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Devices</h2>
        <p className="mt-1 text-sm text-text-dim">
          Manage sessions and authorized devices.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">This device</div>
            <div className="text-xs text-text-faint">macOS • Chrome • Active now</div>
          </div>
          <span className="text-xs text-accent">Active</span>
        </div>
        <div className="pt-3 border-t border-line/50">
          <p className="text-xs text-text-faint">No other active sessions.</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Connections</h2>
        <p className="mt-1 text-sm text-text-dim">
          Connect third-party accounts to your profile.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-3">
        {[
          { name: "Steam", icon: "S" },
          { name: "Xbox", icon: "X" },
          { name: "PlayStation", icon: "P" },
          { name: "Twitch", icon: "T" },
          { name: "YouTube", icon: "Y" },
          { name: "Reddit", icon: "R" },
        ].map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-bg-3 flex items-center justify-center text-sm font-semibold text-text-dim">
                {c.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-text">{c.name}</div>
                <div className="text-xs text-text-faint">Not connected</div>
              </div>
            </div>
            <Button variant="secondary" className="text-xs">
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Advanced</h2>
        <p className="mt-1 text-sm text-text-dim">
          Developer and experimental options.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">Developer mode</div>
            <div className="text-xs text-text-faint">Enable inspector and advanced tools</div>
          </div>
          <button className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-line bg-bg-2 transition-colors focus:outline-none">
            <span className="inline-block h-4 w-4 rounded-full bg-text-faint transition-transform translate-x-1" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">Hardware acceleration</div>
            <div className="text-xs text-text-faint">Use GPU for rendering</div>
          </div>
          <button className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-line bg-bg-2 transition-colors focus:outline-none">
            <span className="inline-block h-4 w-4 rounded-full bg-accent transition-transform translate-x-5" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text">Clear cache</div>
            <div className="text-xs text-text-faint">Free up storage space</div>
          </div>
          <Button variant="secondary" className="text-xs">
            Clear cache
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomizationStudio() {
  const { themeId } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Customization Studio</h2>
        <p className="mt-1 text-sm text-text-dim">
          Personalize every aspect of DIHCORD. All features are free.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Studio sidebar */}
        <div className="flex w-[200px] shrink-0 flex-col border-r border-line bg-bg-1 p-3">
          {[
            { id: "themes", label: "Themes", icon: <Palette className="w-5 h-5" /> },
            { id: "backgrounds", label: "Backgrounds", icon: <Image className="w-5 h-5" /> },
            { id: "animations", label: "Animations", icon: <RotateCw className="w-5 h-5" /> },
            { id: "colors", label: "Colors", icon: <Star className="w-5 h-5" /> },
          ].map((s) => (
            <button
              key={s.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                s.id === "themes"
                  ? "bg-accent text-[#062b18]"
                  : "text-text-dim hover:bg-bg-3 hover:text-text",
              )}
            >
              {s.icon}
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Studio content */}
        <div className="flex-1 space-y-6">
          <ThemePicker />
          <div className="rounded-lg border border-line bg-bg-2 p-5">
            <h3 className="mb-3 text-sm font-semibold text-text">Backgrounds</h3>
            <p className="text-xs text-text-faint mb-4">
              Animated backgrounds are available in Aurora, Cyberpunk, Synthwave,
              Retro Futurism, Neon Dreams, Blood Moon themes.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "none", label: "None", color: "var(--color-bg-0)" },
                { id: "aurora", label: "Aurora", color: "var(--color-accent-glow)" },
                { id: "particles", label: "Particles", color: "var(--color-text-faint)" },
              ].map((bg) => (
                <button
                  key={bg.id}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                    themeId === bg.id
                      ? "border-accent bg-accent-dim/30 text-accent"
                      : "border-line bg-bg-1 text-text-dim hover:border-line-strong",
                  )}
                >
                  <div className="h-10 w-10 rounded-lg" style={{ background: bg.color }} />
                  <span className="text-xs font-medium">{bg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}