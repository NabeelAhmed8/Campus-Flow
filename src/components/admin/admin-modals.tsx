"use client";

import {
  X,
  Building2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { GRADE_OPTIONS, PAKISTANI_BANK_OPTIONS } from "@/lib/constants";
import type { AdminFee, NewStudentDraft } from "./types";

interface AdmissionModalProps {
  open: boolean;
  institutionName: string;
  draft: NewStudentDraft;
  submitting: boolean;
  onChange: (next: NewStudentDraft) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function StudentAdmissionModal({
  open,
  institutionName,
  draft,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: AdmissionModalProps) {
  if (!open) return null;

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
          <h2 className="text-lg font-bold">Enroll New Student</h2>
          <p className="text-xs text-muted-foreground">
            Register student to {institutionName} and issue their initial fee voucher.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="admission-student-name" className="font-semibold block mb-1">
              Student Full Name *
            </label>
            <input
              id="admission-student-name"
              name="studentName"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Ayaan Tariq"
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="admission-grade" className="font-semibold block mb-1">
                Grade Level
              </label>
              <CustomSelect
                name="studentGrade"
                value={draft.grade}
                onChange={(val) => onChange({ ...draft, grade: val })}
                options={[...GRADE_OPTIONS]}
              />
            </div>
            <div>
              <label htmlFor="admission-student-section" className="font-semibold block mb-1">
                Section
              </label>
              <input
                id="admission-student-section"
                name="section"
                type="text"
                autoComplete="off"
                placeholder="e.g. A, B, Iqbal, Jinnah, Qasim"
                value={draft.section}
                onChange={(e) => onChange({ ...draft, section: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admission-guardian-name" className="font-semibold block mb-1">
              Guardian Name
            </label>
            <input
              id="admission-guardian-name"
              name="guardianName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Tariq Mahmood"
              value={draft.guardianName}
              onChange={(e) => onChange({ ...draft, guardianName: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="admission-guardian-phone" className="font-semibold block mb-1">
              Guardian Phone Contact
            </label>
            <input
              id="admission-guardian-phone"
              name="guardianPhone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +92 300 1234567"
              value={draft.guardianPhone}
              onChange={(e) => onChange({ ...draft, guardianPhone: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="admission-monthly-fee" className="font-semibold block mb-1">
              Monthly Tuition Fee (PKR)
            </label>
            <input
              id="admission-monthly-fee"
              name="monthlyFee"
              type="number"
              autoComplete="off"
              value={draft.monthlyFee}
              onChange={(e) => onChange({ ...draft, monthlyFee: Number(e.target.value) })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Enrolling..." : "Confirm Admission"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Cleared & Reconciled
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
