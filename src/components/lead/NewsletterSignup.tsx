"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { getLeadConfig, getLeadFallbackHref } from "@/lib/lead-capture";

type NewsletterSignupProps = {
  source: string;
  compact?: boolean;
};

export default function NewsletterSignup({ source, compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const config = getLeadConfig("newsletter");
  const fallbackHref = getLeadFallbackHref("newsletter", email, source);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    trackEvent("lead_submit", {
      lead_type: "newsletter",
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
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-50)] text-[var(--accent-700)]">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden="true"
        >
          <path d="M4 6.5h16v11H4Z" />
          <path d="m4.5 7 7.5 6 7.5-6" />
        </svg>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-700)]">
        Newsletter
      </p>
      {compact ? (
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--ink-900)]">New tools, without the noise</h3>
      ) : (
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">New tools, without the noise</h2>
      )}
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
        Get concise launch notes when useful browser tools and meaningful
        improvements ship.
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
          <label htmlFor={`newsletter-email-${source}`} className="block text-sm font-semibold text-[var(--ink-900)]">Email address</label>
          <Input
            id={`newsletter-email-${source}`}
            type="email"
            name={config.emailFieldName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
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
          <Button type="submit" variant="secondary" className="h-12 w-full" disabled={!config.hasProvider && !config.hasFallback}>
            {config.hasProvider ? "Join newsletter" : config.hasFallback ? "Request signup" : "Newsletter not configured"}
          </Button>
        </form>

        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          No spam · Easy unsubscribe · Privacy respected
        </p>

        <div className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          {config.hasProvider ? (
            <span>
              {config.target === "_blank"
                ? `${config.providerLabel} opens in a new tab to complete signup.`
                : `Signup stays inline through ${config.providerLabel}.`}
            </span>
          ) : config.hasFallback ? (
            <a
              href={fallbackHref}
              className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]"
            >
              No provider configured yet. Use email fallback.
            </a>
          ) : (
            <span>Signup is disabled until a newsletter provider or contact email is configured.</span>
          )}
        </div>

        {submitted ? (
          <p aria-live="polite" className="mt-3 rounded-[var(--radius-md)] border border-[var(--accent-200)] bg-[var(--success-surface)] px-3 py-2 text-sm font-medium text-[var(--success-foreground)]">
            {config.hasProvider
              ? config.target === "_blank"
                ? "Thanks. The signup form has been opened in a new tab."
                : "Thanks. Your newsletter signup has been sent."
              : "Email draft prepared for manual signup handling."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
