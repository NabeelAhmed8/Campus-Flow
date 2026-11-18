"use client";

import { Receipt, ShieldCheck, Download, Building2, CheckCircle2, Copy, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SchoolBankAccount } from "./types";

interface ParentFeePayTabProps {
  student: any;
  feeRecord: any | null;
  bankAccounts: SchoolBankAccount[];
  onDownloadVoucher: () => void;
  onOpenBankModal: () => void;
}

export function ParentFeePayTab({
  student,
  feeRecord,
  bankAccounts,
  onDownloadVoucher,
  onOpenBankModal,
}: ParentFeePayTabProps) {
  const isPaid = feeRecord?.status === "paid";
  const isVerifying = feeRecord?.status === "pending_verification";

  return (
    <div id="fees" className="space-y-6 scroll-mt-20">
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-base">Monthly Fee Voucher &amp; Bank Clearance</h3>
              <p className="text-xs text-muted-foreground">
                Download printable PDF or submit bank transfer proof for Admin verification
              </p>
            </div>
          </div>
          {feeRecord ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                isPaid
                  ? "bg-emerald-500/10 text-emerald-600"
                  : isVerifying
                  ? "bg-sky-500/10 text-sky-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {isVerifying ? "Pending Verification" : feeRecord.status}
            </span>
          ) : (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
              No Voucher
            </span>
          )}
        </div>

        {feeRecord ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5 p-4 rounded-xl bg-muted/20 border">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Billing Month:</span>
                  <span className="font-semibold">{feeRecord.month || "Current Month"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-semibold">
                    {feeRecord.dueDate
                      ? new Date(feeRecord.dueDate).toISOString().split("T")[0]
                      : "15 days from issue"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Invoice Reference:</span>
                  <span className="font-mono font-bold text-foreground">
                    {feeRecord.invoiceNumber || feeRecord._id}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-xl bg-muted/20 border">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Student Name:</span>
                  <span className="font-semibold">{student.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Roll Number:</span>
                  <span className="font-mono">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between py-1 items-baseline">
                  <span className="font-bold">Total Dues:</span>
                  <span className="font-bold text-lg text-primary">
                    Rs. {Number(feeRecord.amount || student.monthlyFee || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {isPaid && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verified &amp; Cleared via {feeRecord.paymentMethod || "Bank Transfer"}</span>
                </div>
                {feeRecord.transactionRef && (
                  <div className="text-[11px] font-mono">
                    Reference / Challan: {feeRecord.transactionRef}
                  </div>
                )}
              </div>
            )}

            {isVerifying && (
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-800 dark:text-sky-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Clock className="h-4 w-4" />
                  <span>Transfer Proof Submitted — Awaiting Admin Verification</span>
                </div>
                <div className="text-[11px]">
                  Channel: <strong>{feeRecord.paymentMethod}</strong> • Ref:{" "}
                  <code className="font-mono font-bold">{feeRecord.transactionRef}</code>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" size="sm" onClick={onDownloadVoucher}>
                <Download className="mr-1.5 h-4 w-4" />
                {isPaid ? "Download Cleared Receipt" : "Download PDF Voucher"}
              </Button>
              {isPaid ? (
                <Button variant="outline" size="sm" disabled className="flex-1">
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                  Payment Verified
                </Button>
              ) : isVerifying ? (
                <Button variant="outline" size="sm" disabled className="flex-1 text-sky-700 dark:text-sky-300">
                  <Clock className="mr-1.5 h-4 w-4" />
                  Pending Admin Approval
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-1"
                  onClick={onOpenBankModal}
                >
                  <Building2 className="mr-1.5 h-4 w-4" />
                  Submit Bank Transfer Proof
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-xs">
            <p>No billing invoice issued for this student yet.</p>
          </div>
        )}
      </div>

      {/* Real School-Configured Bank Accounts Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            School Official Bank Accounts &amp; Wallets
          </h4>
          <span className="text-[10px] text-muted-foreground">Configured by School Administration</span>
        </div>

        {bankAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-foreground truncate">{b.bankName}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {b.badge}
                  </span>
                </div>
                <div className="text-[11px] text-foreground truncate">{b.accountTitle}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">{b.accountNo}</div>
                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="xs"
                    variant="outline"
                    className="flex-1 text-[10px] h-6"
                    onClick={() => {
                      navigator.clipboard.writeText(b.accountNo);
                      toast.success(`Copied ${b.bankName} Account Number!`);
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy A/C
                  </Button>
                  {b.iban && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="flex-1 text-[10px] h-6"
                      onClick={() => {
                        navigator.clipboard.writeText(b.iban);
                        toast.success(`Copied ${b.bankName} IBAN!`);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy IBAN
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center text-xs text-muted-foreground">
            Your school administrator has not added official bank account numbers yet. You can still submit your branch challan or transfer reference once you have payment details from the accounts office.
          </div>
        )}
      </div>
    </div>
  );
}
