"use client";

import {
  Users,
  Receipt,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  UserPlus,
  Copy,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AdminHeaderKpisProps {
  institutionName: string;
  schoolCode: string;
  loading: boolean;
  studentCount: number;
  feeCount: number;
  totalCollected: number;
  totalPending: number;
  recoveryRate: number;
  onRefresh: () => void;
  onExportExcel: () => void;
  onOpenAdmission: () => void;
}

export function AdminHeaderBanner({
  institutionName,
  schoolCode,
  loading,
  feeCount,
  onRefresh,
  onExportExcel,
  onOpenAdmission,
}: Pick<
  AdminHeaderKpisProps,
  | "institutionName"
  | "schoolCode"
  | "loading"
  | "feeCount"
  | "onRefresh"
  | "onExportExcel"
  | "onOpenAdmission"
>) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Admin &amp; Micro-Billing Hub
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {institutionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Student roster directory, Pakistani local bank payment reconciliation, and automated fee vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Refresh Records"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={feeCount === 0}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button size="sm" onClick={onOpenAdmission}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      </div>

      {schoolCode && (
        <div className="rounded-2xl border bg-primary/5 border-primary/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-foreground">Official School Join Code</span>
                <code className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-background border border-primary/30 text-primary tracking-wider">
                  {schoolCode}
                </code>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Share this Join Code with your Teachers, Students &amp; Parents during signup (along with each student&apos;s Roll #) to connect them exclusively to {institutionName}.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs shrink-0 bg-background"
            onClick={() => {
              navigator.clipboard?.writeText(schoolCode);
              toast.success(`Copied School Join Code: ${schoolCode}`);
            }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Code
          </Button>
        </div>
      )}
    </>
  );
}

export function AdminKpiCards({
  studentCount,
  totalCollected,
  totalPending,
  recoveryRate,
}: Pick<
  AdminHeaderKpisProps,
  "studentCount" | "totalCollected" | "totalPending" | "recoveryRate"
>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total Enrolled Students</span>
          <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight">{studentCount}</span>
          <span className="block text-xs text-muted-foreground mt-1">
            Active student master roster
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total Cleared Collection</span>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight">
            Rs. {totalCollected.toLocaleString()}
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            Verified bank transfers &amp; cash
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Pending Tuition Dues</span>
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight">
            Rs. {totalPending.toLocaleString()}
          </span>
          <span className="block text-xs text-amber-600 mt-1 font-medium">
            {totalPending > 0 ? "Requires payment collection" : "Zero pending dues"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Fee Recovery Rate</span>
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight">{recoveryRate}%</span>
          <span className="block text-xs text-muted-foreground mt-1">Current term recovery</span>
        </div>
      </div>
    </div>
  );
}
