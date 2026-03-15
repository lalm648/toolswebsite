"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "clickproqa@gmail.com";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Tool request");
  const [message, setMessage] = useState("");

  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    `[${topic}] Message from ${name || "Website visitor"}`
  )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`)}`;

  return (
    <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Send a message</h2>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          This contact flow works without a database. It opens your email client with the message
          prefilled so you can send tool requests, sponsorship inquiries, or bug reports directly.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[var(--ink-900)]">
            Name
            <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2" />
          </label>
          <label className="text-sm font-medium text-[var(--ink-900)]">
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
          </label>
        </div>

        <label className="text-sm font-medium text-[var(--ink-900)]">
          Topic
          <Input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2" />
        </label>

        <label className="text-sm font-medium text-[var(--ink-900)]">
          Message
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-40" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild>
          <a href={mailtoHref}>Open email draft</a>
        </Button>
        <p className="text-sm text-[var(--muted-foreground)]">Direct email: {contactEmail}</p>
      </div>
    </div>
  );
}
