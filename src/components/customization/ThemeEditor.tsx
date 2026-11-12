import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Palette,
  Save,
  Trash2,
  RotateCw,
  Plus,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/themes/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const ROLE_GROUPS: { label: string; roles: (keyof typeof THEMES["midnight"]["colors"])[] }[] = [
  {
    label: "Backgrounds",
    roles: ["bgDeep", "bg0", "bg1", "bg2", "bg3", "bgHover"],
  },
  {
    label: "Accent & UI",
    roles: ["accent", "accentHover", "accentDim", "accentGlow"],
  },
  {
    label: "Text",
    roles: ["text", "textDim", "textFaint"],
  },
  {
    label: "Borders & surfaces",
    roles: ["line", "lineStrong", "surface", "surfaceElevated"],
  },
  {
    label: "Semantic",
    roles: ["danger", "warning", "info", "mention"],
  },
];

export function ThemeEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, themeId, presets, savedThemes, setTheme, updateCustomTheme, saveTheme, deleteTheme, applyTheme, resetTheme } = useTheme();

  const [editing, setEditing] = useState<Record<string, string>>({ ...theme.colors });
  const [themeName, setThemeName] = useState("My theme");
  const [gradientStops, setGradientStops] = useArrayState([
    { color: theme.colors.accent, position: 0 },
    { color: theme.colors.info, position: 50 },
    { color: theme.colors.mention, position: 100 },
  ]);
  const [gradientAngle, setGradientAngle] = useState(135);

  const gradientCss = useMemo(() => {
    const stops = gradientStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    return `linear-gradient(${gradientAngle}deg, ${stops})`;
  }, [gradientStops, gradientAngle]);

  const applyGradient = () => {
    applyTheme({ bg0: gradientCss });
  };

  const addGradientStop = () => {
    setGradientStops([
      ...gradientStops,
      { color: editing.accent ?? "#00e57a", position: 100 },
    ]);
  };

  const presetCard = (id: ThemeId) => {
    const t = THEMES_MAP[id];
    const active = themeId === id;
    return (
      <button
        key={id}
        onClick={() => setTheme(id)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
          active
            ? "border-accent bg-accent-dim/30 text-accent"
            : "border-line bg-bg-1 text-text-dim hover:border-line-strong hover:text-text",
        )}
      >
        <div
          className="h-10 w-10 rounded-lg mb-1"
          style={{ background: t.colors.bg0, border: `1px solid ${t.colors.line}` }}
        />
        <span className="text-xs font-medium">{t.name}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[700px] w-[1000px] overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-2xl"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          >
            {/* Left panel: presets */}
            <div className="flex-1 overflow-y-auto border-r border-line bg-bg-1 p-4 space-y-4">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-text">Theme editor</h2>
                <p className="text-xs text-text-faint">
                  Customize DIHCORD. Changes save to your account.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={resetTheme}>
                    <RotateCw size={14} /> Reset to default
                  </Button>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
                  Presets
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => presetCard(p.id as ThemeId))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
                  Saved themes
                </h3>
                {savedThemes.length === 0 ? (
                  <p className="text-xs text-text-faint">
                    No saved themes yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedThemes.map((t) => (
                      <motion.div
                        key={t._id}
                        whileHover={{ backgroundColor: "var(--color-bg-2)" }}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors border-line bg-bg-1 cursor-pointer"
                        onClick={() => {
                          setTheme("custom" as ThemeId);
                          applyTheme(t.colors);
                        }}
                      >
                        <span className="text-sm font-medium truncate">{t.name}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteTheme(t._id);
                          }}
                          className="text-text-faint hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="border-t border-line pt-3 space-y-3">
                  <Input
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="Theme name"
                    className="text-xs"
                  />
                  <Button
                    onClick={() => saveTheme(themeName, editing)}
                    className="w-full text-xs"
                  >
                    <Save size={14} /> Save current as "{themeName}"
                  </Button>
                </div>
              </div>
            </div>

            {/* Right panel: editor + preview */}
            <div className="flex-1 flex flex-col bg-bg-0 p-6">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div className="rounded-xl border border-line bg-surface p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette size={16} className="text-text-faint" />
                    <h3 className="text-sm font-semibold text-text">Live preview</h3>
                  </div>
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-2 p-3">
                      <div className="h-10 w-10 rounded-full" style={{ background: editing.accent }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-text truncate">DIHCORD</div>
                        <div className="text-xs text-text-faint truncate">Custom theme preview</div>
                      </div>
                      <Button size="sm" className="bg-accent text-[#062b18]" style={{ background: editing.accent, color: "#062b18" }}>
                        Send
                      </Button>
                    </div>
                    <div className="rounded-lg border border-line bg-bg-1 p-4">
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-lg border border-line p-3" style={{ background: editing.bg1 }} />
                        <div className="flex-1 rounded-lg border border-line p-3" style={{ background: editing.bg2 }} />
                      </div>
                      <div className="mt-3 rounded-lg border border-line p-3" style={{ background: editing.bgHover }} />
                      <p className="mt-2 text-[11px] text-text-faint">Sample message area</p>
                    </div>
                  </div>
                </div>

                {ROLE_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <h3 className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {group.roles.map((role) => (
                        <div key={role} className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-text-dim flex justify-between">
                            <span>{role}</span>
                            <span className="text-[10px] text-text-faint truncate max-w-[120px]">
                              {editing[role] ?? theme.colors[role]}
                            </span>
                          </label>
                          <input
                            type="color"
                            value={editing[role] ?? theme.colors[role]}
                            onChange={(e) => {
                              const next = { ...editing, [role]: e.target.value };
                              setEditing(next);
                              updateCustomTheme({ [role]: e.target.value });
                            }}
                            className="w-full h-8 rounded-md border-0 bg-transparent cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold tracking-wide text-text-faint uppercase">
                    Gradient background
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div
                      className="h-16 rounded-lg border border-line"
                      style={{ background: gradientCss }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <label className="text-xs text-text-faint">Angle (deg)</label>
                      <Input
                        type="number"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(Math.min(360, Math.max(0, Number(e.target.value) || 0)))}
                        className="text-xs"
                      />
                      <Button size="sm" onClick={applyGradient}>
                        Apply gradient to background
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {gradientStops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={stop.color}
                            onChange={(e) => {
                              const next = [...gradientStops];
                              next[i] = { ...next[i], color: e.target.value };
                              setGradientStops(next);
                            }}
                            className="h-7 rounded-md border-0 bg-transparent cursor-pointer"
                          />
                          <Input
                            type="number"
                            value={stop.position}
                            onChange={(e) => {
                              const next = [...gradientStops];
                              next[i] = { ...next[i], position: Math.min(100, Math.max(0, Number(e.target.value) || 0)) };
                              setGradientStops(next);
                            }}
                            placeholder="%"
                            className="w-16 text-xs"
                          />
                          <button
                            onClick={() => {
                              if (gradientStops.length <= 2) return;
                              const next = [...gradientStops];
                              next.splice(i, 1);
                              setGradientStops(next);
                            }}
                            className="p-1 text-text-faint hover:text-danger"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={addGradientStop}>
                        <Plus size={12} /> Add stop
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-line p-4 flex items-center justify-between bg-bg-0">
                <Button variant="ghost" onClick={onClose}>
                  Close editor
                </Button>
                <div className="text-xs text-text-faint">
                  Saved to your DIHCORD account
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useArrayState<T>(initial: T[]) {
  const [value, setValue] = useState<T[]>(initial);
  return [value, (next: T[]) => setValue(next)] as const;
}

const THEMES_MAP: Record<ThemeId, { name: string; colors: { bg0: string; line: string; accent: string } }> = Object.fromEntries(
  Object.entries(THEMES).map(([id, t]) => [id, { name: t.name, colors: { bg0: t.colors.bg0, line: t.colors.line, accent: t.colors.accent } }]),
) as Record<ThemeId, { name: string; colors: { bg0: string; line: string; accent: string } }>;
