"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";
import {
  sqlTemplates,
  visualizeSql,
  type SqlSchema,
  type SqlTemplate,
} from "@/lib/tools/sql-schema";

type GalleryFilter = "All" | "Featured" | "Popular" | "New";

function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    code: <><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
    fit: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    spark: <><path d="m12 3 1.4 4.1L18 9l-4.6 1.9L12 15l-1.4-4.1L6 9l4.6-1.9L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function MiniDiagram({ template }: { template: SqlTemplate }) {
  const schema = useMemo(() => visualizeSql(template.sql), [template.sql]);
  return (
    <div className="relative h-40 overflow-hidden bg-[linear-gradient(var(--outline-soft)_1px,transparent_1px),linear-gradient(90deg,var(--outline-soft)_1px,transparent_1px)] bg-[size:18px_18px] p-4">
      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M91 48 C135 48 145 82 194 82" fill="none" stroke={template.accent} strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M105 115 C150 115 158 105 215 105" fill="none" stroke={template.accent} strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
      <div className="relative grid grid-cols-2 gap-3" style={{ transform: "scale(.84)", transformOrigin: "top left", width: "119%" }}>
        {schema.tables.slice(0, 4).map((table, index) => (
          <div key={table.name} className={`overflow-hidden rounded-lg border bg-[var(--surface-card)] shadow-sm ${index % 2 ? "mt-7" : ""}`} style={{ borderColor: `${template.accent}45` }}>
            <div className="truncate px-2 py-1.5 text-[9px] font-bold text-white" style={{ backgroundColor: template.accent }}>{table.name}</div>
            {table.columns.slice(0, 3).map((column) => <div key={column.name} className="flex justify-between border-t border-[var(--outline-soft)] px-2 py-1 text-[7px]"><span>{column.name}</span><span className="opacity-60">{column.type}</span></div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function createDiagramSvg(schema: SqlSchema) {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const cardWidth = 280;
  const gap = 36;
  const columns = Math.min(3, Math.max(1, schema.tables.length));
  const heights = schema.tables.map((table) => 48 + table.columns.length * 30);
  const rows = Math.ceil(schema.tables.length / columns);
  const rowHeights = Array.from({ length: rows }, (_, row) => Math.max(...heights.slice(row * columns, (row + 1) * columns)));
  const yPositions = rowHeights.map((_, row) => 28 + rowHeights.slice(0, row).reduce((sum, height) => sum + height + gap, 0));
  const width = columns * cardWidth + (columns - 1) * gap + 56;
  const height = yPositions.at(-1)! + rowHeights.at(-1)! + 28;
  const cards = schema.tables.map((table, index) => {
    const x = 28 + (index % columns) * (cardWidth + gap);
    const y = yPositions[Math.floor(index / columns)];
    const rowsMarkup = table.columns.map((column, columnIndex) => `<text x="${x + 16}" y="${y + 68 + columnIndex * 30}" font-family="ui-monospace,monospace" font-size="12" fill="#334155">${escape(column.name)}</text><text x="${x + cardWidth - 16}" y="${y + 68 + columnIndex * 30}" text-anchor="end" font-family="ui-monospace,monospace" font-size="11" fill="#64748b">${escape(column.type)}</text>`).join("");
    return `<g><rect x="${x}" y="${y}" width="${cardWidth}" height="${heights[index]}" rx="12" fill="#ffffff" stroke="#cbd5e1"/><path d="M${x + 12} ${y}h${cardWidth - 24}a12 12 0 0 1 12 12v28H${x}V${y + 12}a12 12 0 0 1 12-12Z" fill="#0f766e"/><text x="${x + 16}" y="${y + 26}" font-family="ui-monospace,monospace" font-size="13" font-weight="700" fill="#ffffff">${escape(table.name)}</text>${rowsMarkup}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f8fafc"/>${cards}</svg>`;
}

export default function SqlSchemaVisualizerTool() {
  const initialTemplate = sqlTemplates[0];
  const [input, setInput] = useState(initialTemplate.sql);
  const [schema, setSchema] = useState<SqlSchema>(() => visualizeSql(initialTemplate.sql));
  const [activeTemplate, setActiveTemplate] = useState(initialTemplate.id);
  const [error, setError] = useState("");
  const [view, setView] = useState<"diagram" | "sql">("diagram");
  const [zoom, setZoom] = useState(100);
  const [tableQuery, setTableQuery] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All templates");

  const categories = ["All templates", ...Array.from(new Set(sqlTemplates.map((template) => template.category)))];
  const filteredTemplates = sqlTemplates.filter((template) => {
    const query = templateQuery.trim().toLowerCase();
    return (galleryFilter === "All" || template.status === galleryFilter) &&
      (categoryFilter === "All templates" || template.category === categoryFilter) &&
      (!query || `${template.title} ${template.description} ${template.dialect} ${template.category}`.toLowerCase().includes(query));
  });
  const visibleTables = schema.tables.filter((table) => table.name.toLowerCase().includes(tableQuery.trim().toLowerCase()));

  function processSchema() {
    try {
      setSchema(visualizeSql(input));
      setError("");
      setView("diagram");
      setActiveTemplate("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The SQL schema could not be parsed.");
    }
  }

  function openTemplate(template: SqlTemplate) {
    setInput(template.sql);
    setSchema(visualizeSql(template.sql));
    setActiveTemplate(template.id);
    setError("");
    setView("diagram");
    document.getElementById("schema-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <section id="schema-workspace" className="scroll-mt-24 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-overlay)]">
        <header className="flex flex-col gap-3 border-b border-[var(--outline-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-100)] text-[var(--accent-700)]"><Icon name="database" className="h-5 w-5" /></span>
            <div><h2 className="text-sm font-bold text-[var(--ink-900)]">Schema workspace</h2><p className="text-xs text-[var(--muted-foreground)]">Common CREATE TABLE syntax · local processing</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-[var(--surface-panel)] p-1" role="tablist" aria-label="Workspace view">
              <button type="button" role="tab" aria-selected={view === "diagram"} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${view === "diagram" ? "bg-[var(--surface-card)] text-[var(--ink-900)] shadow-sm" : "text-[var(--muted-foreground)]"}`} onClick={() => setView("diagram")}><Icon name="grid" />Diagram</button>
              <button type="button" role="tab" aria-selected={view === "sql"} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${view === "sql" ? "bg-[var(--surface-card)] text-[var(--ink-900)] shadow-sm" : "text-[var(--muted-foreground)]"}`} onClick={() => setView("sql")}><Icon name="code" />SQL editor</button>
            </div>
            <CopyButton value={schema.mermaid} label="Copy Mermaid" size="sm" />
            <Button size="sm" onClick={() => downloadTextFile(createDiagramSvg(schema), "database-schema.svg", "image/svg+xml")}><Icon name="download" className="mr-1.5 h-4 w-4" />Export SVG</Button>
          </div>
        </header>

        {view === "diagram" ? (
          <div className="grid min-h-[570px] lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="border-b border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4 lg:border-b-0 lg:border-r">
              <label className="relative block">
                <span className="sr-only">Search tables</span><Icon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input className="h-10 bg-[var(--surface-card)] pl-9 text-sm" value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} placeholder="Find a table…" />
              </label>
              <div className="mt-5 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Tables</p><span className="rounded-full bg-[var(--surface-card)] px-2 py-0.5 text-[10px] font-bold tabular-nums">{schema.tables.length}</span></div>
              <nav className="tool-output-scroll mt-2 space-y-1" aria-label="Schema tables">
                {visibleTables.map((table, index) => <a key={table.name} href={`#table-${index}`} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-card)] hover:text-[var(--accent-700)]"><span className="h-2 w-2 rounded-sm bg-[var(--accent-500)]" />{table.name}<span className="ml-auto text-[10px] tabular-nums opacity-60">{table.columns.length}</span></a>)}
              </nav>
              <dl className="mt-6 grid grid-cols-2 gap-2 border-t border-[var(--outline-soft)] pt-4">
                <div className="rounded-xl bg-[var(--surface-card)] p-3"><dt className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Columns</dt><dd className="mt-1 text-lg font-bold tabular-nums text-[var(--ink-900)]">{schema.tables.reduce((sum, table) => sum + table.columns.length, 0)}</dd></div>
                <div className="rounded-xl bg-[var(--surface-card)] p-3"><dt className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Relations</dt><dd className="mt-1 text-lg font-bold tabular-nums text-[var(--ink-900)]">{schema.relationships.length}</dd></div>
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-3 text-[10px] leading-4 text-[var(--accent-700)]"><Icon name="lock" className="h-4 w-4 shrink-0" />Your schema never leaves this browser.</div>
            </aside>
            <div className="relative min-w-0 overflow-hidden bg-[linear-gradient(var(--outline-soft)_1px,transparent_1px),linear-gradient(90deg,var(--outline-soft)_1px,transparent_1px)] bg-[size:24px_24px]">
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-card)] p-1 shadow-[var(--shadow-soft)]">
                <button className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold hover:bg-[var(--surface-panel)]" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(60, value - 10))}>−</button>
                <span className="w-11 text-center text-[10px] font-bold tabular-nums">{zoom}%</span>
                <button className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold hover:bg-[var(--surface-panel)]" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(140, value + 10))}>+</button>
                <button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--surface-panel)]" type="button" aria-label="Fit diagram" onClick={() => setZoom(100)}><Icon name="fit" /></button>
              </div>
              <div className="tool-output-scroll min-h-0 p-7 pt-16 sm:p-10 sm:pt-16">
                <div className="grid min-w-[560px] grid-cols-2 items-start gap-6 xl:grid-cols-3" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: `${10000 / zoom}%` }}>
                  {visibleTables.map((table, index) => (
                    <article id={`table-${index}`} key={table.name} className="overflow-hidden rounded-xl border border-[var(--outline-strong)] bg-[var(--surface-card)] shadow-[var(--shadow-lift)]">
                      <h3 className="flex items-center gap-2 border-b border-[var(--outline-soft)] bg-[var(--surface-cta)] px-4 py-3 font-mono text-xs font-bold text-white"><Icon name="database" />{table.name}</h3>
                      <ul className="divide-y divide-[var(--outline-soft)]">
                        {table.columns.map((column) => <li key={column.name} className="flex min-w-0 items-center gap-2 px-3.5 py-2.5 text-[11px]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${column.primary ? "bg-amber-400" : column.foreign ? "bg-sky-500" : "bg-[var(--outline-strong)]"}`} /><span className="min-w-0 flex-1 truncate font-mono font-semibold text-[var(--ink-900)]" title={column.name}>{column.name}</span>{column.primary ? <span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">PK</span> : null}{column.foreign ? <span className="rounded bg-sky-100 px-1 py-0.5 text-[8px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">FK</span> : null}<span className="max-w-20 truncate font-mono text-[9px] text-[var(--muted-foreground)]">{column.type}</span></li>)}
                      </ul>
                    </article>
                  ))}
                </div>
                {!visibleTables.length ? <div className="mx-auto mt-24 max-w-xs rounded-xl bg-[var(--surface-card)] p-5 text-center shadow-sm"><p className="font-semibold text-[var(--ink-900)]">No matching tables</p><button className="mt-2 text-xs font-bold text-[var(--accent-700)]" onClick={() => setTableQuery("")} type="button">Clear search</button></div> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-4 sm:p-6">
              <label className="text-sm font-bold text-[var(--ink-900)]" htmlFor="schema-sql">Paste SQL DDL</label>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Supports common PostgreSQL, MySQL, and SQLite CREATE TABLE statements.</p>
              <Textarea id="schema-sql" className="mt-3 min-h-[420px] resize-none font-mono text-xs leading-6" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} />
              {error ? <p role="alert" className="mt-3 rounded-xl border border-[var(--error-outline)] bg-[var(--error-surface)] p-3 text-sm text-[var(--error-foreground)]">{error}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2"><Button onClick={processSchema}>Generate diagram <Icon name="arrow" className="ml-2 h-4 w-4" /></Button><CopyButton value={input} label="Copy SQL" /><Button variant="secondary" onClick={() => downloadTextFile(input, "database-schema.sql", "application/sql")}><Icon name="download" className="mr-1.5 h-4 w-4" />Download SQL</Button></div>
            </div>
            <aside className="border-t border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Quick start</p>
              <div className="mt-3 space-y-2">{sqlTemplates.slice(0, 4).map((template) => <button key={template.id} type="button" onClick={() => openTemplate(template)} className={`w-full rounded-xl border p-3 text-left hover:-translate-y-0.5 hover:shadow-sm ${activeTemplate === template.id ? "border-[var(--accent-500)] bg-[var(--accent-50)]" : "border-[var(--outline-soft)] bg-[var(--surface-card)]"}`}><span className="block text-xs font-bold text-[var(--ink-900)]">{template.title}</span><span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{template.dialect} · {visualizeSql(template.sql).tables.length} tables</span></button>)}</div>
              <div className="mt-5 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-card)] p-4"><p className="text-xs font-bold text-[var(--ink-900)]">Parser scope</p><p className="mt-1.5 text-[10px] leading-4 text-[var(--muted-foreground)]">Designed for schema exploration, not full dialect validation. Procedures, triggers, and ALTER TABLE statements are not rendered.</p></div>
            </aside>
          </div>
        )}
      </section>

      <section aria-labelledby="template-gallery-title" className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-lift)]">
        <div className="border-b border-[var(--outline-soft)] px-5 py-6 sm:px-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]"><Icon name="spark" />Starter library</span><h2 id="template-gallery-title" className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Database schema templates</h2><p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">Start with a real-world data model, inspect its relationships, then adapt the SQL to your project.</p></div><span className="text-xs font-medium text-[var(--muted-foreground)]">{sqlTemplates.length} curated schemas · 3 dialects</span></div></div>
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 lg:border-b-0 lg:border-r">
            <label className="relative block"><span className="sr-only">Search templates</span><Icon name="search" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--muted-foreground)]" /><Input className="bg-[var(--surface-card)] pl-9 text-sm" value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Search templates…" /></label>
            <nav className="mt-5 space-y-1" aria-label="Template status">{(["Featured", "Popular", "New", "All"] as GalleryFilter[]).map((filter) => <button key={filter} type="button" onClick={() => setGalleryFilter(filter)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${galleryFilter === filter ? "bg-[var(--accent-100)] text-[var(--accent-700)]" : "text-[var(--foreground)] hover:bg-[var(--surface-card)]"}`}><span className={`h-2 w-2 rounded-full ${filter === "Featured" ? "bg-violet-500" : filter === "Popular" ? "bg-orange-500" : filter === "New" ? "bg-emerald-500" : "bg-slate-400"}`} />{filter === "All" ? "All diagrams" : filter}</button>)}</nav>
            <p className="mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Use case</p>
            <div className="mt-2 space-y-0.5">{categories.map((category) => <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${categoryFilter === category ? "font-bold text-[var(--accent-700)]" : "text-[var(--foreground)] hover:bg-[var(--surface-card)]"}`}>{category}</button>)}</div>
          </aside>
          <div className="p-4 sm:p-6">
            {filteredTemplates.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredTemplates.map((template) => { const preview = visualizeSql(template.sql); return <article key={template.id} className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-[var(--outline-strong)] hover:shadow-[var(--shadow-lift)]"><MiniDiagram template={template} /><div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-[var(--ink-900)]">{template.title}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{template.description}</p></div><span className="flex shrink-0 items-center gap-1 text-[9px] text-[var(--muted-foreground)]"><Icon name="eye" className="h-3 w-3" />Preview</span></div><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-2 py-1 text-[9px] font-semibold">{template.dialect}</span><span className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-2 py-1 text-[9px] font-semibold">{template.category}</span><span className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-2 py-1 text-[9px] font-semibold">{preview.tables.length} tables</span></div><button type="button" onClick={() => openTemplate(template)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--action-bg)] px-4 py-2.5 text-xs font-bold text-[var(--action-fg)] opacity-90 transition group-hover:opacity-100">Open template <Icon name="arrow" /></button></div></article>; })}</div> : <div className="grid min-h-72 place-items-center text-center"><div><p className="font-semibold text-[var(--ink-900)]">No templates found</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Try another search or clear the filters.</p><Button className="mt-4" variant="secondary" onClick={() => { setTemplateQuery(""); setGalleryFilter("All"); setCategoryFilter("All templates"); }}>Clear filters</Button></div></div>}
          </div>
        </div>
      </section>
    </div>
  );
}
