import { Navigate, Route, Routes } from "react-router";
import { AuthPage } from "@/pages/AuthPage";
import {
  AppShell,
  HomePage,
  DmPage,
  ServerPage,
} from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { isConvexConfigured } from "@/lib/convex";
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

function ConvexSetupBanner() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-0 p-6">
      <div className="max-w-xl rounded-xl border border-accent/30 bg-accent-dim/20 p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-[#062b18] font-bold">
            ⚙️
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">DIHCORD Setup Required</h2>
            <p className="mt-1 text-sm text-text-dim">
              Convex backend connection not configured.
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="text-accent font-medium">✓</span>
            <span>Code deployed to GitHub Pages</span>
          </div>
          <div className="flex gap-2">
            <span className="text-text-faint font-medium">○</span>
            <span>Convex backend URL missing</span>
          </div>
        </div>
        <div className="mt-5 bg-bg-2 rounded-lg border border-line p-4 text-xs text-text-faint">
          <p className="font-medium mb-2">To enable the backend:</p>
          <ol className="list-disc list-inside space-y-1 text-text-dim">
            <li>
              Create a Convex project at{" "}
              <a
                href="https://dashboard.convex.dev"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                convex.dev
              </a>
            </li>
            <li>
              Run <code className="bg-bg-3 px-1 py-0.5 rounded">npx convex dev</code>
              to link your project
            </li>
            <li>
              Add <code className="bg-bg-3 px-1 py-0.5 rounded">VITE_CONVEX_URL</code>
              to GitHub repository Settings → Secrets and variables → Actions
              (value: your Convex deployment URL, e.g.
              <code className="bg-bg-3 px-1 py-0.5 rounded">https://your-project.convex.cloud</code>)
            </li>
            <li>
              Push to <code className="bg-bg-3 px-1 py-0.5 rounded">main</code> to
              redeploy with the backend connected
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConvexConfigured()) {
    return <ConvexSetupBanner />;
  }

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