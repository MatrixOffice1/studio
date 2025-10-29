"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
          contentStyle={{
            background: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)'
          }}
        />
        <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
