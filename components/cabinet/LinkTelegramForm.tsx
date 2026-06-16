"use client";

import { useFormState, useFormStatus } from "react-dom";
import { linkTelegram, type LinkState } from "@/app/cabinet/actions";
import { st, type Lang } from "@/lib/site-i18n";
import { ui, btn } from "@/components/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn("action")}>
      {pending ? "…" : label}
    </button>
  );
}

export default function LinkTelegramForm({ lang }: { lang: Lang }) {
  const [state, formAction] = useFormState<LinkState, FormData>(linkTelegram, {});

  return (
    <section className={ui.card}>
      <h2 className={ui.sectionTitle}>{st(lang, "link_title")}</h2>
      <p className={`mt-2 ${ui.body}`}>{st(lang, "link_intro")}</p>
      <p className={`mt-1 ${ui.meta}`}>{st(lang, "link_how")}</p>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={ui.label} htmlFor="code">
            {st(lang, "link_code_label")}
          </label>
          <input
            id="code"
            name="code"
            required
            autoComplete="off"
            maxLength={8}
            className={`mt-1 w-40 uppercase tracking-wide ${ui.input}`}
          />
        </div>
        <SubmitButton label={st(lang, "link_btn")} />
      </form>

      {state?.error && <p className={`mt-3 ${ui.alertErr}`}>{st(lang, state.error)}</p>}
    </section>
  );
}
