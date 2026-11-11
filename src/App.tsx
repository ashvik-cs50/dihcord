import { Navigate, Route, Routes } from "react-router";
import { AuthPage } from "@/pages/AuthPage";
import {
  AppShell,
  HomePage,
  DmPage,
  ServerPage,
} from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, me, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-text-dim">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          Starting DIHCORD…
        </div>
      </div>
    );
  }
  if (!token || !me) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { token, me, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    );
  }
  if (token && me) {
    return <Navigate to="/@me" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <RedirectIfAuthed>
            <AuthPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="@me" element={<HomePage />} />
        <Route path="@me/:channelId" element={<DmPage />} />
        <Route path="channels/:serverId" element={<ServerPage />} />
        <Route path="channels/:serverId/:channelId" element={<ServerPage />} />
        <Route path="*" element={<Navigate to="/@me" replace />} />
      </Route>
      <Route path="/" element={<Navigate to="/@me" replace />} />
    </Routes>
  );
}
