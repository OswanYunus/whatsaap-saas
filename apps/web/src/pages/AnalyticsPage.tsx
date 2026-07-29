import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { failureReasons, messagesOverTime, mostActiveCampaigns } from "../lib/mockData";

const PIE_COLORS = ["#22C55E", "#6366F1", "#F59E0B", "#EF4444", "#71717A"];

const CHART_GRID = "rgba(0,0,0,0.04)";
const CHART_TICK = "#71717A";

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card-flat p-4">
      <h2 className="section-title">{title}</h2>
      <div className="mt-3 h-60">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
};

export default function AnalyticsPage() {
  const deliveryRateSeries = messagesOverTime.map((d) => ({
    date: d.date,
    rate: Number(((d.delivered / d.sent) * 100).toFixed(1))
  }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Delivery performance over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Messages Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={messagesOverTime} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} className="dark:opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickLine={false}
                axisLine={false}
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="sent" stroke="#52525B" strokeWidth={1.5} dot={false} name="Sent" />
              <Line type="monotone" dataKey="delivered" stroke="#22C55E" strokeWidth={1.5} dot={false} name="Delivered" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Delivery Rate">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryRateSeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickLine={false}
                axisLine={false}
                dy={4}
              />
              <YAxis
                domain={[90, 100]}
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#22C55E"
                strokeWidth={1.5}
                dot={{ r: 2, fill: "#22C55E", strokeWidth: 0 }}
                name="Delivery rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Failure Reasons">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={failureReasons}
                dataKey="count"
                nameKey="reason"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={3}
                strokeWidth={0}
              >
                {failureReasons.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Active Campaigns">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mostActiveCampaigns} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: CHART_TICK }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: CHART_TICK }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="messages" fill="#22C55E" radius={[0, 3, 3, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
