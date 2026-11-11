import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function AuthPage() {
  const { login, signup } = useAuth();
  const { pushToast } = useUI();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, displayName, password);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-bg-deep p-6">
      <div className="grid w-full max-w-4xl grid-cols-1 items-stretch overflow-hidden rounded-xl border border-line bg-bg-1 shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-line bg-bg-0 p-10 md:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-[#062b18]">
                <MessageSquare size={20} strokeWidth={2.4} />
              </div>
              <span className="text-xl font-bold tracking-tight text-text">
                DIHCORD
              </span>
            </div>
            <p className="mt-6 text-2xl leading-snug font-semibold text-text">
              Your community,
              <br />
              <span className="text-accent">instantly alive.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-dim">
              Servers, channels, realtime chat, DMs, friends and presence — all
              synced live through Convex.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-text-dim">
            <li className="flex items-center gap-2">
              <Dot /> Realtime messages and typing indicators
            </li>
            <li className="flex items-center gap-2">
              <Dot /> Friends, DMs and mentions
            </li>
            <li className="flex items-center gap-2">
              <Dot /> File attachments and reactions
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="p-8 md:p-10">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className="text-2xl font-bold text-text">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-1 text-sm text-text-dim">
              {mode === "login"
                ? "Log in to your DIHCORD account."
                : "Pick a username — it's how friends will find you."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. vicky"
                  autoComplete="username"
                  required
                />
              </div>
              {mode === "register" && (
                <div>
                  <Label>Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you appear in chat"
                    maxLength={32}
                    required
                  />
                </div>
              )}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 8 characters" : ""}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-text-dim">
              {mode === "login" ? "New to DIHCORD?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-medium text-accent hover:underline"
              >
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />;
}
