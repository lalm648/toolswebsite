"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Container from "@/components/Container";

const STORAGE_KEY = "toolswebsite-short-links";

export default function LocalShortLinkPage() {
  const params = useParams<{ code: string }>();
  const [message, setMessage] = useState("Looking up this local redirect…");

  useEffect(() => {
    try {
      const links = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as Array<{ code: string; url: string }>;
      const match = links.find((link) => link.code === params.code);
      if (!match) {
        setMessage("This code is not registered in this browser.");
        return;
      }
      const url = new URL(match.url);
      if (!/^https?:$/.test(url.protocol)) throw new Error();
      window.location.replace(url.toString());
    } catch {
      setMessage("This local redirect is invalid.");
    }
  }, [params.code]);

  return (
    <section className="py-24">
      <Container>
        <div className="mx-auto max-w-lg rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-8 text-center shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-semibold text-[var(--ink-900)]">
            Local short link
          </h1>
          <p className="mt-4 text-[var(--muted-foreground)]">{message}</p>
          <Link
            href="/tools/security/url-shortener"
            className="mt-6 inline-block font-medium text-[var(--accent-700)]"
          >
            Open the registry
          </Link>
        </div>
      </Container>
    </section>
  );
}
