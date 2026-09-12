"use client";

import { FormEvent, Suspense, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { auth } from "@/lib/firebaseConfig";
import { upsertUserProfile } from "@/lib/firestore";
import { isLocalAdminCredential, LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";
import { useAuth } from "@/src/context/AuthContext";

type Mode = "login" | "register" | "reset";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isUnauthorized = searchParams.get("error") === "unauthorized";
  const redirectParam = searchParams.get("redirect");
  const targetRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  const [mode, setMode] = useState<Mode>("login");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal state for newly registered student's Emergency Pass Code
  const [issuedEmergencyCode, setIssuedEmergencyCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyIssuedCode = async () => {
    if (!issuedEmergencyCode) return;
    try {
      await navigator.clipboard.writeText(issuedEmergencyCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (mode === "login" && isLocalAdminCredential(email, password)) {
        window.localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, "true");
        document.cookie = "bb_session=1; path=/; max-age=2592000; SameSite=Lax";
        router.replace((targetRedirect.startsWith("/admin") ? targetRedirect : "/admin") as any);
        return;
      }

      if (mode === "reset") {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match. Please verify your new password.");
          return;
        }
        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters long.");
          return;
        }
        if (!emergencyCode || emergencyCode.trim().length !== 6) {
          setError("Please enter your valid 6-digit Emergency Pass Code.");
          return;
        }

        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), emergencyCode: emergencyCode.trim(), newPassword })
        });
        const data = (await response.json()) as { error?: string; message?: string };

        if (!response.ok) {
          setError(data.error || "Failed to reset password. Please try again.");
          return;
        }

        setSuccess("Password reset successful! You can now sign in with your new credentials.");
        setMode("login");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setEmergencyCode("");
        return;
      }

      if (mode === "register") {
        const settingsResponse = await fetch("/api/settings/public", { cache: "no-store" });
        const platform = settingsResponse.ok
          ? ((await settingsResponse.json()) as { registrationLocked?: boolean })
          : {};
        if (platform.registrationLocked) {
          setError("New student registration is temporarily locked by the academy.");
          return;
        }

        // Cryptographically random 6-digit Emergency Pass Code
        const buffer = new Uint32Array(1);
        window.crypto.getRandomValues(buffer);
        const generatedEmergencyCode = (100000 + (buffer[0] % 900000)).toString();

        // Cryptographically hash the emergency code with SHA-256 so plaintext is never stored in DB
        const hashBuf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(generatedEmergencyCode));
        const emergencyCodeHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: handle.trim() });
        await upsertUserProfile({
          uid: credential.user.uid,
          handle: handle.trim(),
          email: credential.user.email,
          displayName: handle.trim(),
          role: "student",
          emergencyCodeHash,
          rank: "Script Kiddie",
          xp: 0,
          completedLabs: [],
          streak: 0,
          learningTimeMinutes: 0,
          lastActiveDate: ""
        });

        // Display imperative Emergency Pass Code confirmation modal
        setIssuedEmergencyCode(generatedEmergencyCode);
        return;
      }

      // Default: regular login
      await signInWithEmailAndPassword(auth, email, password);
      router.replace(targetRedirect as any);
    } catch (authError) {
      const code = authError instanceof Error ? authError.message : "";
      setError(
        code.includes("email-already-in-use")
          ? "That email is already registered."
          : "Authentication failed. Check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center grid-bg p-5">
      {/* Imperative Emergency Pass Code Modal on Registration */}
      {issuedEmergencyCode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-cyan/50 bg-[#0c121e] p-7 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <KeyRound size={24} />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Critical Credential
                </div>
                <h2 className="text-xl font-bold text-white">Emergency Pass Code</h2>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Save this Emergency Pass Code in a secure place. You will need it to reset your password if you ever forget it.
            </p>

            <div className="my-5 flex items-center justify-between rounded-xl border border-cyan/40 bg-[#080d18] px-5 py-4">
              <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-cyan">
                {issuedEmergencyCode}
              </span>
              <button
                type="button"
                onClick={copyIssuedCode}
                className="flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-xs font-bold text-cyan hover:bg-cyan/20 transition-all"
              >
                {codeCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <p className="mb-5 flex items-center gap-1.5 text-[11px] text-amber-300/90">
              <ShieldAlert size={14} className="shrink-0 text-amber-400" />
              ByteBreach will never show this code again. Store it in a safe place.
            </p>

            <button
              type="button"
              onClick={() => {
                setIssuedEmergencyCode(null);
                router.replace(targetRedirect as any);
              }}
              className="w-full rounded-xl bg-cyan py-3 text-xs font-bold text-ink shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:opacity-95 transition-all"
            >
              I have saved my code &rarr;
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-panel p-7 shadow-glow">
        <Link
          href={(user ? "/overview" : "/") as any}
          className="flex items-center gap-2 text-xs text-muted hover:text-cyan"
        >
          <ArrowLeft size={15} /> Back to academy overview
        </Link>

        {mode === "reset" ? (
          <div className="mt-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="eyebrow text-amber-400">Emergency recovery</div>
              <h1 className="mt-1 text-2xl font-bold">Reset password</h1>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan text-ink">
              <LockKeyhole size={20} />
            </div>
            <div>
              <div className="eyebrow text-cyan">Secure access</div>
              <h1 className="mt-1 text-2xl font-bold">{mode === "login" ? "Welcome back" : "Join the breach"}</h1>
            </div>
          </div>
        )}

        {isUnauthorized && mode !== "reset" && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)] backdrop-blur-sm"
          >
            <ShieldAlert className="mt-0.5 shrink-0 text-red-400" size={18} />
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                Access Restricted · Clearance Required
              </div>
              <p className="text-xs leading-relaxed text-red-200/90">
                Administrator clearance is required to access the Admin Console. Please authenticate with an authorized administrator account.
              </p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-sm"
          >
            <Check className="mt-0.5 shrink-0 text-emerald-400" size={18} />
            <p className="text-xs leading-relaxed text-emerald-200/90">{success}</p>
          </div>
        )}

        <p className="mt-3 text-sm text-muted">
          {mode === "login"
            ? "Sign in to continue your learning path."
            : mode === "register"
            ? "Create your learner identity and start earning XP."
            : "Enter your registered email and 6-digit Emergency Pass Code to set a new password."}
        </p>

        {mode !== "reset" && (
          <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#0b1018] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`rounded-lg py-2 text-xs font-semibold ${
                mode === "login" ? "bg-cyan text-ink" : "text-muted"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
              className={`rounded-lg py-2 text-xs font-semibold ${
                mode === "register" ? "bg-cyan text-ink" : "text-muted"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {mode === "register" && (
          <label className="mt-5 block text-xs text-muted">
            Handle
            <input
              required
              minLength={2}
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="nullbyte"
              className="mt-2 w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 text-sm outline-none focus:border-cyan"
            />
          </label>
        )}

        <label className="mt-5 block text-xs text-muted">
          {mode === "reset" ? "Registered Email" : "Email"}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 text-sm outline-none focus:border-cyan"
          />
        </label>

        {mode === "reset" && (
          <label className="mt-4 block text-xs text-muted">
            6-digit Emergency Pass Code
            <input
              required
              type="text"
              pattern="[0-9]{6}"
              maxLength={6}
              inputMode="numeric"
              placeholder="e.g. 583921"
              value={emergencyCode}
              onChange={(event) => setEmergencyCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 font-mono text-sm tracking-widest outline-none focus:border-cyan"
            />
          </label>
        )}

        {mode !== "reset" ? (
          <label className="mt-4 block text-xs text-muted">
            Password
            <div className="relative mt-2">
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 pr-10 text-sm outline-none focus:border-cyan"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cyan transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        ) : (
          <>
            <label className="mt-4 block text-xs text-muted">
              New Password
              <div className="relative mt-2">
                <input
                  required
                  minLength={6}
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 pr-10 text-sm outline-none focus:border-cyan"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cyan transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="mt-4 block text-xs text-muted">
              Confirm New Password
              <div className="relative mt-2">
                <input
                  required
                  minLength={6}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-line bg-[#0b1018] px-3 py-3 pr-10 text-sm outline-none focus:border-cyan"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cyan transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </>
        )}

        {mode === "login" && (
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError("");
                setSuccess("");
              }}
              className="text-xs text-muted hover:text-cyan transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {mode === "register" && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck size={14} className="text-cyan" /> Your profile is secured by Firebase Authentication.
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <button
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-cyan py-3 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Authenticating..."
            : mode === "login"
            ? "Sign in"
            : mode === "register"
            ? "Create account"
            : "Reset password"}
        </button>

        {mode === "reset" && (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="mt-3 w-full rounded-xl border border-line py-3 text-xs font-bold text-muted hover:text-white transition"
            >
              Back to login
            </button>

            <div className="mt-6 rounded-xl border border-line bg-[#080d18] p-4 text-center">
              <p className="text-xs text-muted leading-relaxed">
                Forgot your emergency code?{" "}
                <Link href="/contact" className="font-semibold text-cyan hover:underline">
                  Contact ByteBreach Support
                </Link>{" "}
                to verify your identity and reset your credentials.
              </p>
            </div>
          </>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center grid-bg p-5 font-mono text-xs text-cyan">
          INITIALIZING SECURE PORTAL...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


