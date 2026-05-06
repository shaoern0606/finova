import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#00a86b", "#28c98b", "#0f766e", "#84cc16", "#f59e0b", "#14b8a6", "#64748b", "#94a3b8"];

export function SpendingPie({ breakdown = {} }) {
  const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={54} outerRadius={88} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `RM${Number(value).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ breakdown = {} }) {
  const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => `RM${Number(value).toFixed(2)}`} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#00a86b" />
      </BarChart>
    </ResponsiveContainer>
  );
}

