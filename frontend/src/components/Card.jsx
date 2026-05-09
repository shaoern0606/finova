export default function Card({ title, value, children, accent }) {
  return (
    <section className="card p-4 relative">
      {title && <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 truncate">{title}</p>}
      {value && <h3 className={`mt-1 text-xl font-black tracking-tight truncate ${accent || "text-gx-900"}`}>{value}</h3>}
      {children}
    </section>
  );
}

