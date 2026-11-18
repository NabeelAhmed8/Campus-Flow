"use client";

import { X, ShieldCheck, Lock, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminFee } from "./types";

interface PaymentAuditModalProps {
  fee: AdminFee | null;
  onClose: () => void;
  onDownloadPDF: (fee: AdminFee) => void;
}

export function PaymentAuditModal({ fee, onClose, onDownloadPDF }: PaymentAuditModalProps) {
  if (!fee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Verified Payment Audit Record</h3>
            <p className="text-xs text-muted-foreground">Immutable financial clearance log</p>
          </div>
        </div>

        <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="leading-relaxed">
            <span className="font-semibold block">Tamper-Proof Protected:</span>
            This payment has been cleared and verified in institutional accounts. Reverting or downgrading cleared funds to pending is restricted to prevent institutional financial discrepancies.
          </div>
        </div>

        <div className="space-y-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Student Name:</span>
            <span className="font-semibold text-foreground">{fee.studentName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Roll Number / Class:</span>
            <span className="font-mono">
              {fee.rollNumber} • {fee.grade}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Billing Month:</span>
            <span className="font-semibold">{fee.month}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Amount Cleared:</span>
            <span className="font-bold text-sm text-emerald-600">
              Rs. {Number(fee.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Payment Channel:</span>
            <span className="font-semibold text-foreground">
              {fee.paymentMethod || "Pakistani Local Bank"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Challan / Trx Ref:</span>
            <span className="font-mono font-bold text-foreground">
              {fee.transactionRef || "Counter Receipt"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Audit Status:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Cleared &amp; Reconciled
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="outline" className="flex-1" size="sm" onClick={onClose}>
            Close Audit
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            size="sm"
            onClick={() => {
              onDownloadPDF(fee);
              onClose();
            }}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download Receipt PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
