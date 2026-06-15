"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, buttonClass } from "@/components/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass("primary")} w-full`}
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
      <h1 className={ui.pageTitle}>{st(lang, title)}</h1>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className={ui.label} htmlFor="email">
            {st(lang, "auth_email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-1 ${ui.input}`}
          />
        </div>

        <div>
          <label className={ui.label} htmlFor="password">
            {st(lang, "auth_password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={`mt-1 ${ui.input}`}
          />
          {mode === "register" && (
            <p className={`mt-1 ${ui.meta}`}>{st(lang, "auth_min_pass")}</p>
          )}
        </div>

        {state?.error && <p className={ui.alertErr}>{st(lang, state.error)}</p>}

        <SubmitButton label={st(lang, btn)} />
      </form>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <Link href={switchHref} className={`${buttonClass("secondary")} w-full`}>
          {st(lang, switchKey)}
        </Link>
      </div>
    </div>
  );
}
