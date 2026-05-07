export default function Card({ title, value, children, accent }) {
  return (
    <section className="card p-4 relative">
      {title && <p className="text-sm font-medium text-slate-500">{title}</p>}
      {value && <h3 className={`mt-1 text-2xl font-bold ${accent || "text-gx-900"}`}>{value}</h3>}
      {children}
    </section>
  );
}

