"use client";

import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { PAKISTANI_BANK_OPTIONS } from "@/lib/constants";
import type { AdminFee } from "./types";

interface RecordBankPaymentModalProps {
  fee: AdminFee | null;
  selectedBank: string;
  bankTrxRef: string;
  processing: boolean;
  onBankChange: (val: string) => void;
  onTrxRefChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function RecordBankPaymentModal({
  fee,
  selectedBank,
  bankTrxRef,
  processing,
  onBankChange,
  onTrxRefChange,
  onConfirm,
  onClose,
}: RecordBankPaymentModalProps) {
  if (!fee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold">Record Pakistani Bank Payment</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Invoice {fee.id} • {fee.studentName} ({fee.rollNumber})
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due:</span>
              <span className="font-bold text-sm text-foreground">
                Rs. {Number(fee.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing Month:</span>
              <span className="font-medium">{fee.month}</span>
            </div>
          </div>

          <div>
            <label htmlFor="admin-bank-channel" className="font-semibold block mb-1.5">
              Select Pakistani Payment Channel / Bank
            </label>
            <CustomSelect
              name="selectedBank"
              value={selectedBank}
              onChange={onBankChange}
              options={PAKISTANI_BANK_OPTIONS}
            />
          </div>

          <div>
            <label htmlFor="admin-bank-trx-ref" className="font-semibold block mb-1.5">
              Bank Transaction Reference / Deposit Slip Number
            </label>
            <input
              id="admin-bank-trx-ref"
              name="bankTrxRef"
              type="text"
              autoComplete="off"
              placeholder="e.g. MZN-98214 or Challan Slip #1042"
              value={bankTrxRef}
              onChange={(e) => onTrxRefChange(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Enter the real bank slip / transfer reference number (or leave blank for Cash Counter Receipt).
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onConfirm}
              disabled={processing}
            >
              {processing ? "Recording..." : "Confirm & Clear Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
