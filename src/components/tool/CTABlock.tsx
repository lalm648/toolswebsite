import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CTABlockProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export default function CTABlock({ title, description, href, label }: CTABlockProps) {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(233,240,255,0.98),rgba(255,237,247,0.98))]">
      <CardContent className="px-8 py-10 text-[var(--ink-900)]">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        <Button asChild className="mt-6">
          <Link href={href}>{label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
