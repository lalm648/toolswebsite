"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { getLeadConfig, getLeadFallbackHref } from "@/lib/lead-capture";

type NewsletterSignupProps = {
  source: string;
};

export default function NewsletterSignup({ source }: NewsletterSignupProps) {
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
      return;
    }

    event.currentTarget.submit();
  }

  return (
    <section className="overflow-hidden rounded-[1.65rem] border border-[var(--outline-soft)] bg-[linear-gradient(135deg,rgba(232,241,255,0.98),rgba(255,245,250,0.98)_62%,rgba(255,255,255,0.98))] shadow-[var(--shadow-lift)]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="premium-pill bg-[rgba(255,255,255,0.76)]">Newsletter</span>
            <span className="premium-pill bg-[rgba(255,255,255,0.76)]">Weekly launch notes</span>
            {config.hasProvider ? <span className="premium-pill bg-[rgba(255,255,255,0.76)]">{config.providerLabel}</span> : null}
          </div>

          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">Audience growth</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-[2rem]">
              Get new tools and monetization-ready ideas first
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              Join the list for launches, SEO updates, browser-tool experiments, and practical ideas that help turn traffic into repeat usage.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <div className="premium-stat">
              <span className="premium-stat-label">Focus</span>
              <span className="premium-stat-value">New tools</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-label">Cadence</span>
              <span className="premium-stat-value">Light and useful</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-label">Privacy</span>
              <span className="premium-stat-value">No spam</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Join the list</p>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
            Designed for low-friction capture on mobile and desktop.
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
              placeholder="Enter your email"
              required
              className="h-12 bg-[rgba(255,255,255,0.92)]"
            />
            <input type="hidden" name={config.sourceFieldName} value={source} />
            {config.hiddenFields.map((field) => (
              <input key={field.name} type="hidden" name={field.name} value={field.value} />
            ))}
            <Button type="submit" className="h-12 w-full">
              {config.hasProvider ? "Join newsletter" : "Request signup"}
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
              No spam
            </span>
            <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
              Easy unsubscribe
            </span>
            {config.hasProvider ? (
              <span className="rounded-full border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.74)] px-2.5 py-1">
                {`Connected to ${config.providerLabel}`}
              </span>
            ) : null}
          </div>

          <div className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
            {config.hasProvider ? (
              <span>
                {config.target === "_blank"
                  ? `${config.providerLabel} opens in a new tab to complete signup.`
                  : `Signup stays inline through ${config.providerLabel}.`}
              </span>
            ) : (
              <a href={fallbackHref} className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]">
                No provider configured yet. Use email fallback.
              </a>
            )}
          </div>

          {submitted ? (
            <p className="mt-3 rounded-[0.95rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {config.hasProvider
                ? config.target === "_blank"
                  ? "Thanks. The signup form has been opened in a new tab."
                  : "Thanks. Your newsletter signup has been sent."
                : "Email draft prepared for manual signup handling."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
