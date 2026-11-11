import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  "#00e57a", "#00d4ff", "#ff6b6b", "#f5c04a", "#a855f7", "#34d399",
  "#fb7185", "#fbbf24", "#4ade80", "#60a5fa",
];

const THEMES = [
  { id: "dark", label: "Dark" },
  { id: "charcoal", label: "Charcoal" },
  { id: "deep", label: "Deep" },
];

export function ProfileEditor() {
  const { token, me } = useAuth();
  const { modal, closeModal, pushToast } = useUI();
  const updateCustomization = useMutation(api.users.updateProfileCustomization);

  const open = modal === "profileEditor";

  const [aboutMe, setAboutMe] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [theme, setTheme] = useState<string>("dark");
  const [accentColor, setAccentColor] = useState<string>("#00e57a");

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Profile Customization"
      subtitle="Personalize your profile — all features are free"
      width={640}
    >
      {!open || !me ? null : (
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              About me
            </label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              maxLength={190}
              rows={4}
              className="w-full rounded-md border border-line-strong bg-bg-deep px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-accent/70 focus:outline-none"
              placeholder="Tell people about yourself..."
            />
            <div className="mt-1 text-[10px] text-text-faint">
              {aboutMe.length}/190 characters
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
              Pronouns
            </label>
            <Input
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              maxLength={30}
              placeholder="e.g. they/them"
            />
          </div>

          <div className="rounded-lg border border-line bg-bg-2 p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-3">
                Accent color
              </label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={cn(
                      "h-9 w-9 rounded-full border transition-colors",
                      accentColor === color
                        ? "ring-2 ring-offset-1 ring-offset-bg-0 ring-accent"
                        : "border-line hover:border-line-strong",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-3">
                Theme
              </label>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      theme === t.id
                        ? "border-accent bg-accent-dim/30 text-accent"
                        : "border-line bg-bg-1 text-text-dim hover:border-line-strong",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );

  async function handleSave() {
    if (!token) return;
    try {
      await updateCustomization({
        token,
        aboutMe: aboutMe.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        accentColor,
        theme,
      });
      pushToast("Profile updated", "success");
      closeModal();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  }
}