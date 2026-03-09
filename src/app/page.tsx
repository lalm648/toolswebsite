export default function Home() {
  const categories = [
    "Image Tools",
    "Text Tools",
    "Developer Tools",
    "SEO Tools",
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-12 space-y-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Tools Website
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
            A fast, scalable platform for practical online utilities across
            images, text, development, and SEO workflows.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <article
              key={category}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-medium">{category}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Curated utilities coming soon.
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
