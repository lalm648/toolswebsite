import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type ToolResultProps = {
  title: string;
  children: ReactNode;
};

export default function ToolResult({ title, children }: ToolResultProps) {
  return (
    <Card className="bg-[var(--surface-raised)]">
      <CardContent className="p-10 sm:p-12">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,var(--accent-200),var(--accent-500))] text-white shadow-[var(--shadow-soft)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <path d="M8 10.5h8" />
              <path d="M8 14.5h5" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-[var(--ink-900)]">{title}</h2>
        </div>
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}
