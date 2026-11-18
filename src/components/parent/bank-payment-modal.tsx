"use client";

import { useState } from "react";
import { Building2, Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FeeDomainRecord } from "@/lib/domain-types";
import type { SchoolBankAccount } from "./types";

interface ParentBankModalProps {
  open: boolean;
  feeRecord: FeeDomainRecord | null;
  studentMonthlyFee?: number;
  bankAccounts: SchoolBankAccount[];
  selectedBankId: string;
  customChannel: string;
  depositorName: string;
  trxRef: string;
  submitting: boolean;
  onSelectBank: (id: string) => void;
  onCustomChannelChange: (val: string) => void;
  onDepositorChange: (val: string) => void;
  onTrxRefChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ParentBankPaymentModal({
  open,
  feeRecord,
  studentMonthlyFee,
  bankAccounts,
  selectedBankId,
  customChannel,
  depositorName,
  trxRef,
  submitting,
  onSelectBank,
  onCustomChannelChange,
  onDepositorChange,
  onTrxRefChange,
  onSubmit,
  onClose,
}: ParentBankModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open || !feeRecord) return null;

  const activeBank =
    bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0] || null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key.toUpperCase()} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Submit Bank Transfer Proof</h2>
              <p className="text-xs text-muted-foreground">
                Transfer fee to your school&apos;s official account, then submit the real transaction ID for Admin verification.
              </p>
            </div>
          </div>
        </div>

        {bankAccounts.length > 0 && activeBank ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {bankAccounts.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => onSelectBank(bank.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activeBank.id === bank.id
                      ? "border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-600"
                      : "bg-muted/30 hover:bg-muted/60"
                  }`}
                >
                  <span className="block font-semibold text-xs text-foreground truncate">
                    {bank.bankName}
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {bank.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {activeBank.bankName}
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                  {activeBank.badge}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">
                  Account Title:{" "}
                  <span className="font-medium text-foreground">{activeBank.accountTitle}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t">
                  <span className="text-muted-foreground font-mono">{activeBank.accountNo}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 text-[10px]"
                    onClick={() => copyToClipboard(activeBank.accountNo, "Account Number")}
                  >
                    {copiedKey === "Account Number" ? (
                      <Check className="h-3 w-3 text-emerald-600 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy A/C
                  </Button>
                </div>
                {activeBank.iban && (
                  <div className="flex items-center justify-between py-1 border-t">
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {activeBank.iban}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={() => copyToClipboard(activeBank.iban, "IBAN")}
                    >
                      {copiedKey === "IBAN" ? (
                        <Check className="h-3 w-3 text-emerald-600 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy IBAN
                    </Button>
                  </div>
                )}
                {activeBank.branch && (
                  <div className="text-[10px] text-muted-foreground pt-0.5">{activeBank.branch}</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label htmlFor="parent-custom-channel" className="font-semibold block mb-1 text-xs">
              Bank / Payment Channel Used *
            </label>
            <input
              id="parent-custom-channel"
              name="customChannel"
              type="text"
              required
              value={customChannel}
              onChange={(e) => onCustomChannelChange(e.target.value)}
              placeholder="e.g. Meezan Bank, HBL, Raast, JazzCash, EasyPaisa"
              className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="parent-depositor-name" className="font-semibold block mb-1">
                Depositor / Sender Name *
              </label>
              <input
                id="parent-depositor-name"
                name="depositorName"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Tariq Mahmood"
                value={depositorName}
                onChange={(e) => onDepositorChange(e.target.value)}
                className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="parent-fee-amount" className="font-semibold block mb-1">
                Total Fee Amount
              </label>
              <input
                id="parent-fee-amount"
                name="feeAmount"
                type="text"
                readOnly
                value={`Rs. ${Number(feeRecord.amount || studentMonthlyFee || 0).toLocaleString()}`}
                className="w-full h-8.5 rounded-lg border bg-muted px-3 text-xs font-semibold text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="parent-bank-trx-ref" className="font-semibold block mb-1">
              Real Bank Transaction Reference / Deposit Slip ID *
            </label>
            <input
              id="parent-bank-trx-ref"
              name="bankTrxRef"
              type="text"
              required
              minLength={4}
              autoComplete="off"
              placeholder="e.g. MZN-982149 or 1Link Ref #8821"
              value={trxRef}
              onChange={(e) => onTrxRefChange(e.target.value)}
              className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Required: School Administration will match this reference against their bank statement before marking your invoice Paid.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Admin Verification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
