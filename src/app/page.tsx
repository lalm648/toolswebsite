import Container from "@/components/Container";
import CategoryCard from "@/components/CategoryCard";

const categories = [
  {
    title: "Image Tools",
    description: "Convert, compress, resize, crop, and optimize images quickly in the browser.",
  },
  {
    title: "Text Tools",
    description: "Count words, change case, clean spacing, and improve everyday text workflows.",
  },
  {
    title: "Developer Tools",
    description: "Format JSON, encode Base64, transform URLs, and streamline development tasks.",
  },
  {
    title: "SEO Tools",
    description: "Generate slugs, meta tags, and useful search optimization helpers for websites.",
  },
];

export default function Home() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Practical Online Tools
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 sm:text-xl">
            Fast, simple, and scalable browser-based utilities for images, text, development, and SEO.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              description={category.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}