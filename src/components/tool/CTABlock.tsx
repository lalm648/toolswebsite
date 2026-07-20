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
    <Card className="border-white/10 bg-[var(--surface-cta)]">
      <CardContent className="flex flex-col gap-5 px-6 py-7 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <Button asChild className="shrink-0 self-start lg:self-auto">
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
