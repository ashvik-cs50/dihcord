import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { THEMES, THEME_PRESETS, type ThemeId, type ThemeDefinition } from "@/lib/themes";
import { useAuth } from "@/contexts/AuthContext";
import type { Id } from "@convex/_generated/dataModel";

const THEME_KEY = "dihcord:theme";
const CUSTOM_THEME_KEY = "dihcord:custom-theme";

type SavedTheme = {
  _id: string;
  name: string;
  colors: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

type ThemeContextValue = {
  theme: ThemeDefinition;
  themeId: ThemeId;
  presets: typeof THEME_PRESETS;
  savedThemes: SavedTheme[];
  setTheme: (id: ThemeId) => void;
  updateCustomTheme: (updates: Partial<ThemeDefinition["colors"]>) => void;
  resetTheme: () => void;
  isPremiumTheme: (id: ThemeId) => boolean;
  saveTheme: (name: string, colors: Record<string, string>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  applyTheme: (theme: Partial<ThemeDefinition["colors"]> & { name?: string }) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
    if (saved && saved in THEMES) return saved;
    return "midnight";
  });

  const [customTheme, setCustomTheme] = useState<Partial<ThemeDefinition["colors"]> | null>(
    () => {
      try {
        const saved = localStorage.getItem(CUSTOM_THEME_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    },
  );

  const savedThemesQuery = useQuery(
    api.users.listUserThemes,
    token ? { token } : "skip",
  ) as SavedTheme[] | undefined;

  const theme = useMemo(() => {
    if (themeId === "custom" && customTheme) {
      return { ...THEMES[themeId], colors: { ...THEMES[themeId].colors, ...customTheme } };
    }
    return THEMES[themeId];
  }, [themeId, customTheme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(THEME_KEY, id);
    if (token) {
      void api.users.setUserTheme({ token, themeId: id, customTheme: undefined }).catch(() => {});
    }
  }, [token]);

  const updateCustomTheme = useCallback((updates: Partial<ThemeDefinition["colors"]>) => {
    const next = { ...(customTheme ?? {}), ...updates };
    setCustomTheme(next);
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(next));
    if (token) {
      void api.users.setUserTheme({
        token,
        themeId: "custom",
        customTheme: JSON.stringify(next),
      }).catch(() => {});
    }
  }, [token, customTheme]);

  const resetTheme = useCallback(() => {
    setCustomTheme(null);
    localStorage.removeItem(CUSTOM_THEME_KEY);
    setThemeIdState("midnight");
    localStorage.setItem(THEME_KEY, "midnight");
    if (token) {
      void api.users.setUserTheme({ token, themeId: "midnight", customTheme: undefined }).catch(() => {});
    }
  }, [token]);

  const isPremiumTheme = useCallback((id: ThemeId) => THEMES[id]?.isPremium ?? false, []);

  const saveTheme = useCallback(async (name: string, colors: Record<string, string>) => {
    if (!token) return;
    await api.users.saveUserTheme({ token, name, colors: JSON.stringify(colors) });
  }, [token]);

  const deleteTheme = useCallback(async (id: string) => {
    if (!token) return;
    await api.users.deleteUserTheme({ token, themeId: id as Id<"userThemes"> });
  }, [token]);

  const applyTheme = useCallback((updates: Partial<ThemeDefinition["colors"]> & { name?: string }) => {
    const next = { ...(customTheme ?? {}), ...updates };
    setCustomTheme(next);
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(next));
    setThemeIdState("custom");
    localStorage.setItem(THEME_KEY, "custom");
    if (token) {
      void api.users.setUserTheme({
        token,
        themeId: "custom",
        customTheme: JSON.stringify(next),
      }).catch(() => {});
    }
  }, [token, customTheme]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty("--color-bg-deep", c.bgDeep);
    root.style.setProperty("--color-bg-0", c.bg0);
    root.style.setProperty("--color-bg-1", c.bg1);
    root.style.setProperty("--color-bg-2", c.bg2);
    root.style.setProperty("--color-bg-3", c.bg3);
    root.style.setProperty("--color-bg-hover", c.bgHover);
    root.style.setProperty("--color-accent", c.accent);
    root.style.setProperty("--color-accent-hover", c.accentHover);
    root.style.setProperty("--color-accent-dim", c.accentDim);
    root.style.setProperty("--color-accent-glow", c.accentGlow);
    root.style.setProperty("--color-danger", c.danger);
    root.style.setProperty("--color-warning", c.warning);
    root.style.setProperty("--color-info", c.info);
    root.style.setProperty("--color-mention", c.mention);
    root.style.setProperty("--color-text", c.text);
    root.style.setProperty("--color-text-dim", c.textDim);
    root.style.setProperty("--color-text-faint", c.textFaint);
    root.style.setProperty("--color-line", c.line);
    root.style.setProperty("--color-line-strong", c.lineStrong);
    root.style.setProperty("--color-surface", c.surface);
    root.style.setProperty("--color-surface-elevated", c.surfaceElevated);

    const existingBg = document.getElementById("dihcord-animated-bg");
    if (existingBg) existingBg.remove();

    if (theme.animation?.bgType !== "none" && theme.animation) {
      const bg = document.createElement("div");
      bg.id = "dihcord-animated-bg";
      bg.className = "animated-bg";
      if (theme.animation.bgType === "aurora") bg.classList.add("aurora-bg");
      if (theme.animation.bgType === "particles") bg.classList.add("particles-bg");
      if (theme.animation.bgType === "gradient") bg.classList.add("gradient-bg");
      bg.style.opacity = String(theme.animation.opacity);
      document.body.insertBefore(bg, document.body.firstChild);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themeId,
      presets: THEME_PRESETS,
      savedThemes: savedThemesQuery ?? [],
      setTheme,
      updateCustomTheme,
      resetTheme,
      isPremiumTheme,
      saveTheme,
      deleteTheme,
      applyTheme,
    }),
    [
      theme,
      themeId,
      savedThemesQuery,
      setTheme,
      updateCustomTheme,
      resetTheme,
      isPremiumTheme,
      saveTheme,
      deleteTheme,
      applyTheme,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
