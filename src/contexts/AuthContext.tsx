import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/convex";
import { useAction, useMutation, useQuery } from "convex/react";
import type { Me, UserStatus } from "@/types";

const TOKEN_KEY = "dihcord:token";
const STATUS_KEY = "dihcord:status";

type AuthContextValue = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  unreadNotifications: number;
  unreadChannels: Record<string, number>;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setStatus: (status: UserStatus) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Safe wrappers that don't crash when ConvexProvider is not mounted
// (e.g. during GitHub Pages deployment before VITE_CONVEX_URL is set)
function safeUseQuery(queryFn: any, args: any) {
  try {
    return useQuery(queryFn, args);
  } catch {
    return undefined;
  }
}

function safeUseAction(actionFn: any) {
  try {
    return useAction(actionFn);
  } catch {
    return async () => {
      throw new Error("Convex backend not configured");
    };
  }
}

function safeUseMutation(mutationFn: any) {
  try {
    return useMutation(mutationFn);
  } catch {
    return async () => {
      throw new Error("Convex backend not configured");
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [status, setStatusState] = useState<UserStatus>(
    () => (localStorage.getItem(STATUS_KEY) as UserStatus) || "online",
  );

  const me = safeUseQuery(
    api.users.getSessionUser,
    token ? { token } : "skip",
  ) as Me | undefined | null;

  const unreadNotifications = safeUseQuery(
    api.notifications.unreadCount,
    token ? { token } : "skip",
  ) as number | undefined;

  const unreadChannels = safeUseQuery(
    api.notifications.unreadChannelCounts,
    token ? { token } : "skip",
  ) as Record<string, number> | undefined;

  const loginAction = safeUseAction(api.auth.login);
  const signupAction = safeUseAction(api.auth.signup);
  const logoutAction = safeUseMutation(api.users.logout);
  const heartbeatMutation = safeUseMutation(api.users.heartbeat);

  const loading = !!token && me === undefined;

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginAction({ username, password });
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
    },
    [loginAction],
  );

  const signup = useCallback(
    async (username: string, displayName: string, password: string) => {
      const result = await signupAction({ username, displayName, password });
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
    },
    [signupAction],
  );

  const heartbeat = useCallback(() => {
    if (!token) return;
    void heartbeatMutation({ token, status }).catch(() => {});
  }, [token, status, heartbeatMutation]);

  useEffect(() => {
    if (!token) return;
    const beat = () => {
      if (document.visibilityState === "hidden") return;
      heartbeat();
    };
    beat();
    const interval = setInterval(beat, 45_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, heartbeat]);

  const setStatus = useCallback((next: UserStatus) => {
    setStatusState(next);
    localStorage.setItem(STATUS_KEY, next);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutAction({ token });
      } catch {
        // ignore — token will fail validation anyway
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, [token, logoutAction]);

  const value = useMemo(
    () => ({
      token,
      me: me ?? null,
      loading,
      unreadNotifications: unreadNotifications ?? 0,
      unreadChannels: unreadChannels ?? {},
      login,
      signup,
      logout,
      setStatus,
    }),
    [token, me, loading, unreadNotifications, unreadChannels, login, signup, logout, setStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}