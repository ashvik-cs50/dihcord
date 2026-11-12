import { useState, useCallback, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function AuthPage() {
  const { login, signup } = useAuth();
  const { pushToast } = useUI();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!username.trim()) {
      next.username = "Username is required";
    } else if (!/^[a-z0-9_]{3,24}$/.test(username.trim())) {
      next.username =
        "Username must be 3-24 characters: lowercase letters, numbers, underscores";
    }
    if (mode === "register") {
      if (!displayName.trim()) next.displayName = "Display name is required";
      else if (displayName.trim().length > 32) {
        next.displayName = "Display name must be 32 characters or less";
      }
    }
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }
    if (mode === "register" && password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [mode, username, displayName, password, confirmPassword]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username.trim().toLowerCase(), password);
      } else {
        await signup(
          username.trim().toLowerCase(),
          displayName.trim(),
          password,
        );
      }
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  return (
    <div className="flex h-full items-center justify-center bg-bg-deep p-6 overflow-hidden">
      {/* Animated decorative background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-[120px] animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-info/10 blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-mention/10 blur-[130px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex w-full max-w-[900px] items-stretch overflow-hidden rounded-xl border border-line bg-bg-1 shadow-2xl md:grid md:grid-cols-2",
        )}
      >
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-line bg-bg-deep p-10 md:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-info text-[#062b18]">
                <MessageSquare size={22} strokeWidth={2.2} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-text">
                DIHCORD
              </span>
            </div>
            <p className="mt-6 text-2xl leading-snug font-semibold text-text">
              Your community,{" "}
              <span className="text-accent">instantly alive.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-dim">
              Servers, channels, realtime chat, DMs, friends and presence — all
              synced live through Convex.
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-text-dim">
            {[
              "Realtime messages and typing indicators",
              "Friends, DMs and mentions",
              "File attachments and reactions",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-1"
          >
            <h1 className="text-2xl font-bold text-text">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-text-dim">
              {mode === "login"
                ? "Log in to your DIHCORD account."
                : "Pick a username — it's how friends will find you."}
            </p>
          </motion.div>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                <Input
                  id="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. vicky"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className={cn(
                    "pl-10",
                    errors.username ? "border-danger" : undefined,
                  )}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-danger">
                  <AlertCircle size={12} /> {errors.username}
                </p>
              )}
            </div>

            {mode === "register" && (
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you appear in chat"
                  maxLength={32}
                  required
                  className={cn(
                    errors.displayName ? "border-danger" : undefined,
                  )}
                />
                {errors.displayName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-danger">
                    <AlertCircle size={12} /> {errors.displayName}
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded p-1 text-text-faint transition-colors hover:bg-bg-3 hover:text-text"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 8 characters" : ""}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  className={cn(
                    "pl-10",
                    errors.password ? "border-danger" : undefined,
                  )}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-danger">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
              {mode === "register" && (
                <>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-bg-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-info transition-all duration-300"
                      style={{ width: `${Math.min((passwordStrength / 4) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px]">
                    <span className="text-text-faint">Password strength</span>
                    <span
                      className={cn(
                        "font-medium",
                        passwordStrength <= 1 ? "text-danger" :
                        passwordStrength <= 2 ? "text-warning" :
                        passwordStrength <= 3 ? "text-info" : "text-accent",
                      )}
                    >
                      {passwordStrength <= 1 ? "Weak" : passwordStrength <= 2 ? "Fair" : passwordStrength <= 3 ? "Strong" : "Excellent"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {mode === "register" && (
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className={errors.confirmPassword ? "border-danger" : undefined}
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-danger">
                    <AlertCircle size={12} /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={busy || Object.keys(errors).length > 0}
              loading={busy}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating your account…
                </>
              ) : mode === "login" ? (
                <span className="flex items-center justify-center gap-2">Log in <ArrowRight size={16} /></span>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="mt-2 text-sm text-text-dim">
              {mode === "login" ? "New to DIHCORD?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
                className="font-medium text-accent hover:underline transition-colors"
              >
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </form>

          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-6 border-t border-line pt-4"
            >
              <div className="flex items-center justify-between text-xs text-text-faint">
                <span>Random default avatar assigned</span>
                <span className="flex gap-1">
                  {DEFAULT_AVATARS.slice(0, 3).map((key) => (
                    <img
                      key={key}
                      src={`/avatars/${key}`}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover border border-line"
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const DEFAULT_AVATARS = [
  "default-01.svg",
  "default-04.svg",
  "default-07.svg",
];
