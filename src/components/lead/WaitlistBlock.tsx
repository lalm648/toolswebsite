"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { getLeadConfig, getLeadFallbackHref } from "@/lib/lead-capture";

type WaitlistBlockProps = {
  source: string;
  title?: string;
  description?: string;
};

export default function WaitlistBlock({
  source,
  title = "Join the waitlist for premium features",
  description = "Register interest for advanced tools, pro workflows, API access, or sponsor-ready launches before they go public.",
}: WaitlistBlockProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const config = getLeadConfig("waitlist");
  const fallbackHref = getLeadFallbackHref("waitlist", email, source);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    trackEvent("lead_submit", {
      lead_type: "waitlist",
      source,
      has_provider: config.hasProvider,
      provider: config.provider || "fallback",
    });
    setSubmitted(true);

    if (!config.hasProvider) {
      return;
    }

    event.currentTarget.submit();
  }

  return (
    <section className="overflow-hidden rounded-[1.65rem] border border-[var(--outline-soft)] bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(244,247,255,0.98)_55%,rgba(255,241,248,0.95))] shadow-[var(--shadow-lift)]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="premium-pill">Waitlist</span>
            <span className="premium-pill">Premium workflows</span>
            {config.hasProvider ? <span className="premium-pill">{config.providerLabel}</span> : null}
          </div>

          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-700)]">Future revenue layer</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-[2rem]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <div className="premium-stat">
              <span className="premium-stat-label">Signals</span>
              <span className="premium-stat-value">High intent users</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-label">Use case</span>
              <span className="premium-stat-value">Premium bundles</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-label">Good for</span>
              <span className="premium-stat-value">Early validation</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Reserve your spot</p>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
            Best for people who want advanced exports, automation, API access, or sponsor-ready packages.
          </p>

          <form
            action={config.action || undefined}
            method={config.method}
            target={config.hasProvider ? config.target : undefined}
            rel={config.hasProvider && config.target === "_blank" ? "noreferrer" : undefined}
            onSubmit={handleSubmit}
            className="mt-4 space-y-3"
          >
            <Input
              type="email"
              name={config.emailFieldName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Work email"
              required
              className="h-12 bg-[rgba(255,255,255,0.92)]"
            />
            <input type="hidden" name={config.sourceFieldName} value={source} />
            {config.hiddenFields.map((field) => (
              <input key={field.name} type="hidden" name={field.name} value={field.value} />
            ))}
            <Button type="submit" className="h-12 w-full">
              {config.hasProvider ? "Join waitlist" : "Request waitlist access"}
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
              Early access
            </span>
            <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
              Product feedback
            </span>
            <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
              Premium-ready audience
            </span>
          </div>

          <div className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
            {config.hasProvider ? (
              <span>
                {config.target === "_blank"
                  ? `${config.providerLabel} will open in a new tab.`
                  : `Connected to ${config.providerLabel}.`}
              </span>
            ) : (
              <a href={fallbackHref} className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]">
                No waitlist provider configured yet. Use email fallback.
              </a>
            )}
          </div>

          {submitted ? (
            <p className="mt-3 rounded-[0.95rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {config.hasProvider
                ? config.target === "_blank"
                  ? "Waitlist form opened in a new tab."
                  : "Waitlist request submitted."
                : "Email draft prepared for manual waitlist handling."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
