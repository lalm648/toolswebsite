type CategoryCardProps = {
  title: string;
  description: string;
};

export default function CategoryCard({ title, description }: CategoryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}