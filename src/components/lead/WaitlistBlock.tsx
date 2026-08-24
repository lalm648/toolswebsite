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
  compact?: boolean;
};

export default function WaitlistBlock({
  source,
  title = "Join the waitlist for premium features",
  description = "Register interest for advanced tools, pro workflows, API access, or sponsor-ready launches before they go public.",
  compact = false,
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
      event.preventDefault();
      if (!config.hasFallback) return;
      const fallbackLink = document.createElement("a");
      fallbackLink.href = fallbackHref;
      fallbackLink.click();
      return;
    }

    event.currentTarget.submit();
  }

  return (
    <section className={compact ? "h-full p-1" : "rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7"}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden="true"
        >
          <path d="M12 3.5v17M3.5 12h17" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-700)]">
        Early access
      </p>
      {compact ? (
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--ink-900)]">{title}</h3>
      ) : (
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">{title}</h2>
      )}
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>

      <div className={compact ? "mt-5" : "mt-6 rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4 sm:p-5"}>
        <form
          noValidate
          action={config.action || undefined}
          method={config.method}
          target={config.hasProvider ? config.target : undefined}
          rel={
            config.hasProvider && config.target === "_blank"
              ? "noreferrer"
              : undefined
          }
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <label htmlFor={`waitlist-email-${source}`} className="block text-sm font-semibold text-[var(--ink-900)]">Email address</label>
          <Input
            id={`waitlist-email-${source}`}
            type="email"
            name={config.emailFieldName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Work email"
            required
            className="h-12 bg-[var(--surface-raised)]"
          />
          <input className="hidden" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <input type="hidden" name={config.sourceFieldName} value={source} />
          {config.hiddenFields.map((field) => (
            <input
              key={field.name}
              type="hidden"
              name={field.name}
              value={field.value}
            />
          ))}
          <Button type="submit" className="h-12 w-full" disabled={!config.hasProvider && !config.hasFallback}>
            {config.hasProvider ? "Join waitlist" : config.hasFallback ? "Request waitlist access" : "Waitlist not configured"}
          </Button>
        </form>

        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Administrator-reviewed · Full early-access benefits when approved
        </p>

        <div className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          {config.hasProvider ? (
            <span>
              {config.target === "_blank"
                ? `${config.providerLabel} will open in a new tab.`
                : `Connected to ${config.providerLabel}.`}
            </span>
          ) : config.hasFallback ? (
            <a
              href={fallbackHref}
              className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]"
            >
              Send this request to the Webutilia administrator for review.
            </a>
          ) : (
            <span>Signup is disabled until a waitlist provider or contact email is configured.</span>
          )}
        </div>

        {submitted ? (
          <p aria-live="polite" className="mt-3 rounded-[var(--radius-md)] border border-[var(--accent-200)] bg-[var(--success-surface)] px-3 py-2 text-sm font-medium text-[var(--success-foreground)]">
            {config.hasProvider
              ? config.target === "_blank"
                ? "Waitlist form opened in a new tab."
                : "Waitlist request submitted."
              : "Approval request prepared for the Webutilia administrator."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
