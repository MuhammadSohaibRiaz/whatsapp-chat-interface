"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginCard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }

    setIsLoading(false);
  }

  return (
    <div className="relative isolate mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-[color:var(--line)] bg-white/90 p-7 shadow-[0_35px_90px_-45px_rgba(14,35,64,0.55)] backdrop-blur">
      <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[color:var(--accent-soft)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-[color:var(--teal-soft)] blur-2xl" />

      <div className="relative mb-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface)] px-3 py-1 text-xs font-medium text-[color:var(--ink-soft)]">
          <Sparkles size={14} />
          Clinic Live Concierge
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
          Sign in to monitor WhatsApp conversations and step in instantly when needed.
        </p>
      </div>

      <form className="relative space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[color:var(--ink-soft)]">Email</span>
          <span className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2.5 transition focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
            <Mail size={16} className="text-[color:var(--ink-soft)]" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-sm text-[color:var(--ink)] outline-none"
              placeholder="owner@clinic.com"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[color:var(--ink-soft)]">Password</span>
          <span className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2.5 transition focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
            <Lock size={16} className="text-[color:var(--ink-soft)]" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-sm text-[color:var(--ink)] outline-none"
              placeholder="••••••••"
            />
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-[color:var(--status-attention-line)] bg-[color:var(--status-attention-bg)] px-3 py-2 text-sm text-[color:var(--status-attention-text)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--ink)] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_30px_-20px_rgba(15,31,56,0.9)] transition hover:-translate-y-0.5 hover:bg-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing in..." : "Enter dashboard"}
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}
