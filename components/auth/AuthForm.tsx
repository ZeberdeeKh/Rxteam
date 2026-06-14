"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { st, type Lang } from "@/lib/site-i18n";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export default function AuthForm({ mode, lang }: { mode: "login" | "register"; lang: Lang }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useFormState<AuthState, FormData>(action, {});

  const title = mode === "login" ? "auth_login_title" : "auth_register_title";
  const btn = mode === "login" ? "auth_login_btn" : "auth_register_btn";
  const switchKey = mode === "login" ? "auth_to_register" : "auth_to_login";
  const switchHref = mode === "login" ? "/register" : "/login";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark">{st(lang, title)}</h1>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700" htmlFor="email">
            {st(lang, "auth_email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700" htmlFor="password">
            {st(lang, "auth_password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-neutral-500">{st(lang, "auth_min_pass")}</p>
          )}
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {st(lang, state.error)}
          </p>
        )}

        <SubmitButton label={st(lang, btn)} />
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href={switchHref} className="text-brand hover:underline">
          {st(lang, switchKey)}
        </Link>
      </p>
    </div>
  );
}
