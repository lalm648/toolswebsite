import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  items: FAQItem[];
};

export default function FAQSection({ items }: FAQSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <Badge variant="secondary">FAQ</Badge>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-900)]">
          Common questions
        </h2>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card
            key={item.question}
            className="bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(237,242,255,0.97)_56%,rgba(255,242,249,0.95))] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--outline-strong)] hover:shadow-[var(--shadow-lift)]"
          >
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-[var(--ink-900)]">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
