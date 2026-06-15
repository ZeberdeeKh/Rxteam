"use client";

import { useFormState, useFormStatus } from "react-dom";
import { linkTelegram, type LinkState } from "@/app/cabinet/actions";
import { st, type Lang } from "@/lib/site-i18n";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-neutral-50 transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export default function LinkTelegramForm({ lang }: { lang: Lang }) {
  const [state, formAction] = useFormState<LinkState, FormData>(linkTelegram, {});

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-brand-dark">{st(lang, "link_title")}</h2>
      <p className="mt-2 text-sm text-gray-700">{st(lang, "link_intro")}</p>
      <p className="mt-1 text-xs text-gray-500">{st(lang, "link_how")}</p>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="code">
            {st(lang, "link_code_label")}
          </label>
          <input
            id="code"
            name="code"
            required
            autoComplete="off"
            maxLength={8}
            className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <SubmitButton label={st(lang, "link_btn")} />
      </form>

      {state?.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {st(lang, state.error)}
        </p>
      )}
    </section>
  );
}
