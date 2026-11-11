import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/themes/ThemeProvider";
import { type ThemeId } from "@/lib/themes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { theme, themeId, presets, setTheme, updateCustomTheme, resetTheme, isPremiumTheme } = useTheme();
  const [customizing, setCustomizing] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(theme.colors.accent);

  const ACCENT_COLORS = [
    "#00e57a", "#00d4ff", "#ff6b6b", "#f5c04a", "#a855f7", "#34d399",
    "#fb7185", "#fbbf24", "#4ade80", "#60a5fa", "#ff00ff", "#00ffff",
  ];

  const handleThemeSelect = (id: ThemeId) => {
    if (isPremiumTheme(id) && id !== "custom") {
      // Still allow - premium gating removed, all features free
    }
    setTheme(id);
    setCustomizing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text">Themes</h2>
        <p className="mt-1 text-sm text-text-dim">
          Choose your DIHCORD visual identity.
        </p>
      </div>

      {/* Preset themes grid */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const isActive = themeId === p.id;
          return (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleThemeSelect(p.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                isActive
                  ? `border-accent bg-accent-dim/30 text-accent`
                  : "border-line bg-bg-1 text-text-dim hover:border-line-strong hover:text-text",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-lg shadow-md",
                  isActive ? "text-[#062b18]" : "text-text",
                )}
                style={{
                  background: isActive ? p.color : "var(--color-bg-3)",
                  color: isActive ? "#062b18" : "var(--color-text)",
                }}
              >
                {p.label.charAt(0)}
              </div>
              <span className="text-xs font-medium capitalize">{p.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom theme editor */}
      <div className="rounded-lg border border-line bg-bg-2 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">Custom Theme</h3>
            <p className="text-xs text-text-faint">
              Create your own color scheme
            </p>
          </div>
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => setCustomizing(!customizing)}
          >
            {customizing ? "Close" : "Customize"}
          </Button>
        </div>

        {customizing && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
                Accent color
              </label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      updateCustomTheme({ accent: color, accentHover: color, accentDim: color });
                    }}
                    className={cn(
                      "h-9 w-9 rounded-full border transition-colors",
                      selectedColor === color
                        ? "ring-2 ring-offset-1 ring-offset-bg-0 ring-accent"
                        : "border-line hover:border-line-strong",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-text-faint uppercase mb-2">
                Background color
              </label>
              <Input
                value={theme.colors.bg0}
                onChange={(e) => updateCustomTheme({ bg0: e.target.value })}
                placeholder="#0f1014"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetTheme} className="text-xs">
                Reset
              </Button>
              <Button onClick={() => setTheme("custom")} className="text-xs">
                Save as custom
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-bg-2 p-4">
        <h3 className="mb-3 text-sm font-semibold text-text">Current theme preview</h3>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-line bg-bg-1">
          <div className="h-8 w-8 rounded-full bg-accent" />
          <div className="flex-1">
            <div className="text-sm font-medium text-text">DIHCORD</div>
            <div className="text-xs text-text-dim">Your server name here</div>
          </div>
          <Button variant="ghost" className="text-xs">Join</Button>
        </div>
      </div>
    </div>
  );
}