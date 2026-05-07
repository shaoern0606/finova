export default function Card({ title, value, children, accent }) {
  return (
    <section className="card p-3 relative">
      {title && <p className="text-[11px] font-semibold text-slate-400 truncate">{title}</p>}
      {value && <h3 className={`mt-0.5 text-lg font-black truncate ${accent || "text-gx-900"}`}>{value}</h3>}
      {children}
    </section>
  );
}

