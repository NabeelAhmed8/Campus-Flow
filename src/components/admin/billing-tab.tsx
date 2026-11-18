"use client";

import {
  Receipt,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
  ShieldCheck,
  Lock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import type { AdminFee } from "./types";

interface BillingTabProps {
  fees: AdminFee[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  feeStatusFilter: string;
  onFeeStatusFilterChange: (val: string) => void;
  feeStatusOptions: Array<{ value: string; label: string; badge?: string }>;
  verifyingFeeId: string | null;
  onDownloadPDF: (fee: AdminFee) => void;
  onOpenBankPay: (fee: AdminFee) => void;
  onOpenAudit: (fee: AdminFee) => void;
  onOpenBankSettings: () => void;
  onVerifyOrRejectFee: (fee: AdminFee, approve: boolean) => void;
}

export function BillingTab({
  fees,
  searchTerm,
  onSearchChange,
  feeStatusFilter,
  onFeeStatusFilterChange,
  feeStatusOptions,
  verifyingFeeId,
  onDownloadPDF,
  onOpenBankPay,
  onOpenAudit,
  onOpenBankSettings,
  onVerifyOrRejectFee,
}: BillingTabProps) {
  return (
    <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
        <div>
          <h2 className="font-semibold tracking-tight text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Fee Records &amp; Pakistani Local Bank Billing
          </h2>
          <p className="text-xs text-muted-foreground">
            Verify parent bank transfers, collect dues, configure official school bank accounts, and issue PDF vouchers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenBankSettings} className="h-8.5 text-xs">
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            School Bank Accounts
          </Button>
          <div className="w-48 min-w-[160px]">
            <CustomSelect
              value={feeStatusFilter}
              onChange={onFeeStatusFilterChange}
              options={feeStatusOptions}
              size="sm"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="admin-search-fee"
              name="feeSearch"
              type="text"
              autoComplete="off"
              aria-label="Search student or invoice"
              placeholder="Search student or invoice..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8.5 w-48 rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Grade</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fees.length > 0 ? (
              fees.map((fee) => {
                const isVerifying = fee.status === "pending_verification";
                const isBusy = verifyingFeeId === fee.mongoId;
                return (
                  <tr
                    key={fee.id}
                    className={`transition-colors ${
                      isVerifying ? "bg-sky-500/5 hover:bg-sky-500/10" : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-foreground">{fee.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{fee.studentName}</div>
                      <div className="text-[11px] text-muted-foreground">{fee.rollNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{fee.grade}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      Rs. {Number(fee.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{fee.dueDate}</td>
                    <td className="py-3 px-4">
                      {fee.paymentMethod ? (
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{fee.paymentMethod}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Unpaid</span>
                      )}
                      {fee.transactionRef && (
                        <div className="text-[10px] font-mono text-muted-foreground">
                          Ref: {fee.transactionRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          fee.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : isVerifying
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : fee.status === "pending"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {fee.status === "paid" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {isVerifying ? "Verify Proof" : fee.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onDownloadPDF(fee)}
                        title={
                          fee.status === "paid"
                            ? "Download Cleared Receipt PDF"
                            : "Download PDF Fee Voucher"
                        }
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {fee.status === "paid" ? "Receipt" : "Voucher"}
                      </Button>

                      {isVerifying ? (
                        <>
                          <Button
                            size="xs"
                            disabled={isBusy}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            onClick={() => onVerifyOrRejectFee(fee, true)}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve &amp; Clear
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isBusy}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => onVerifyOrRejectFee(fee, false)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      ) : fee.status !== "paid" ? (
                        <Button
                          size="xs"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          onClick={() => onOpenBankPay(fee)}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Record Bank Pay
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-[11px] gap-1 shadow-2xs"
                          onClick={() => onOpenAudit(fee)}
                          title="Tamper-proof verified payment. Click to inspect audit trail."
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Paid &amp; Verified</span>
                          <Lock className="h-2.5 w-2.5 opacity-60 text-emerald-600 ml-0.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    <p className="font-medium text-foreground text-sm">No Fee Invoices Found</p>
                    <p className="text-xs max-w-sm">
                      Admit students to issue their monthly tuition vouchers.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
