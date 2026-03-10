import type { ReactNode } from "react";
import Container from "@/components/Container";
import { Badge } from "@/components/ui/badge";

type ToolShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function ToolShell({
  eyebrow,
  title,
  description,
  children,
}: ToolShellProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            {description}
          </p>
        </div>

        {children}
      </Container>
    </section>
  );
}
