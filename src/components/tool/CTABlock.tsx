"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackCtaClick } from "@/lib/analytics";

type CTABlockProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export default function CTABlock({ title, description, href, label }: CTABlockProps) {
  return (
    <Card className="bg-[var(--surface-cta)]">
      <CardContent className="px-8 py-10 text-[var(--ink-900)]">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
        <Button asChild className="mt-6">
          <Link
            href={href}
            onClick={() => {
              trackCtaClick(label, href, title);
            }}
          >
            {label}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
