"use client";

import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { AdminFee, RevenuePoint } from "./types";

interface AnalyticsTabProps {
  revenueData: RevenuePoint[];
  fees: AdminFee[];
  onFocusBilling: () => void;
}

export function AnalyticsTab({ revenueData, fees, onFocusBilling }: AnalyticsTabProps) {
  const hasRevenue =
    revenueData.length > 0 && revenueData.some((d) => d.collected > 0 || d.target > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Financial Influx & Target Velocity</h3>
            <p className="text-xs text-muted-foreground">
              Monthly billing recovery trend vs institutional budget target
            </p>
          </div>
        </div>
        {hasRevenue ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1, #b45309)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1, #b45309)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `Rs.${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value: unknown) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="var(--chart-1, #b45309)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  name="Collected"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed rounded-xl">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Revenue Recorded Yet</p>
            <p className="text-xs max-w-sm mt-1">
              Once payments are confirmed via Pakistani local bank transfers or cash, financial trends will automatically display here.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Billing Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Current billing cycle breakdown</p>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Paid & Cleared</span>
              </div>
              <span className="font-semibold">
                {fees.filter((f) => f.status === "paid").length} invoices
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Pending Due</span>
              </div>
              <span className="font-semibold">
                {fees.filter((f) => f.status === "pending").length} invoices
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span>Overdue</span>
              </div>
              <span className="font-semibold">
                {fees.filter((f) => f.status === "overdue").length} invoices
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t mt-6">
          <Button variant="outline" size="sm" className="w-full" onClick={onFocusBilling}>
            Focus Fee Vouchers ({fees.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
