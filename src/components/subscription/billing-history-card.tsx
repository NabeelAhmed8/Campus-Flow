"use client";

import { ExternalLink, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatReadableDate } from "@/lib/format";
import { BillingInvoiceRecord } from "./types";

interface BillingHistoryCardProps {
  history: BillingInvoiceRecord[];
}

export function BillingHistoryCard({ history }: BillingHistoryCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b text-foreground">
        <ReceiptText className="h-4 w-4 text-primary" />
        Subscription Billing &amp; Tax Invoice History ({history.length})
      </h3>

      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center rounded-xl border border-dashed">
          No paid invoices yet — your institution is currently on the 14-day free trial.
        </p>
      ) : (
        <div className="space-y-2">
          {history.map((inv) => (
            <div
              key={inv.invoiceId}
              className="rounded-xl border bg-muted/15 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-foreground">
                    {inv.invoiceId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase">
                    {inv.status === "auto_renewed" ? "Auto-Renewed" : "Paid"}
                  </span>
                  <span className="font-semibold text-primary">
                    {inv.planName}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {inv.paymentMethod} • Cycle:{" "}
                  {formatReadableDate(inv.periodStart)} –{" "}
                  {formatReadableDate(inv.periodEnd)}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="font-bold text-foreground">
                    ${inv.amountUsd} USD{" "}
                    <span className="font-normal text-muted-foreground">
                      (≈ PKR {inv.amountPkr.toLocaleString()})
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Paid {formatReadableDate(inv.paidAt)}
                  </p>
                </div>

                {inv.invoiceUrl && (
                  <Button variant="outline" size="xs" className="h-7 text-[11px]" asChild>
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tax Invoice
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
