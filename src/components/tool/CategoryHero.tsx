import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryDefinition } from "@/lib/data/tools";

type CategoryHeroProps = {
  category: CategoryDefinition;
  toolCount: number;
  value: string;
  onChange: (value: string) => void;
};

const heroStyles: Record<CategoryDefinition["slug"], string> = {
  image: "from-emerald-950 via-emerald-900 to-cyan-900",
  video: "from-violet-950 via-indigo-950 to-slate-950",
  audio: "from-fuchsia-950 via-rose-950 to-slate-950",
  document: "from-orange-950 via-amber-950 to-slate-950",
  text: "from-amber-950 via-stone-900 to-slate-950",
  developer: "from-cyan-950 via-slate-950 to-blue-950",
  security: "from-green-950 via-emerald-950 to-slate-950",
  network: "from-teal-950 via-cyan-950 to-slate-950",
  seo: "from-fuchsia-950 via-purple-950 to-slate-950",
};

const searchSuggestions: Record<CategoryDefinition["slug"], string[]> = {
  image: ["compress", "background", "convert", "crop"],
  video: ["compress", "extract audio", "trim", "captions"],
  audio: ["join", "record", "convert", "normalize"],
  document: ["merge PDF", "extract text", "split", "Markdown"],
  text: ["count words", "case", "duplicate", "spaces"],
  developer: ["JSON", "minify", "regex", "SQL"],
  security: ["password", "hash", "QR", "UUID"],
  network: ["latency", "broken links", "DNS", "sitemap"],
  seo: ["meta tags", "Open Graph", "JSON-LD"],
};

export default function CategoryHero({
  category,
  toolCount,
  value,
  onChange,
}: CategoryHeroProps) {
  return (
    <Card
      className={`relative isolate overflow-hidden rounded-[1.75rem] border-0 bg-gradient-to-br ${heroStyles[category.slug]} text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.8)]`}
    >
      <span
        className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10 bg-white/5"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl"
        aria-hidden="true"
      />
      <CardContent className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-10">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/10 text-white">
              {category.badge}
            </Badge>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
              {category.eyebrow}
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
            {category.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
            {category.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              `${toolCount} focused tools`,
              "No account needed",
              category.slug === "network"
                ? "Protected diagnostics"
                : "Files stay local",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/12 bg-black/10 px-3 py-1.5 text-xs font-semibold text-white/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/12 bg-white/[0.075] p-3.5 shadow-2xl backdrop-blur-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold text-white">
                Find your workflow
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                Search by task, format, or result
              </p>
            </div>
            <span className="hidden rounded-lg border border-white/10 bg-black/10 px-2 py-1 font-mono text-[10px] text-white/55 sm:inline">
              press /
            </span>
          </div>
          <div className="[&_input]:border-white/10 [&_input]:bg-white [&_input]:text-slate-900 [&_input]:shadow-xl [&_input]:placeholder:text-slate-400">
            <SearchBar
              value={value}
              onChange={onChange}
              placeholder={`Search ${category.title.toLowerCase()}`}
              analyticsSource={`category_${category.slug}`}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searchSuggestions[category.slug].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion)}
                className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
