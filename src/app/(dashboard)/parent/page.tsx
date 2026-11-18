"use client";

import {
  GraduationCap,
  Receipt,
  CalendarCheck,
  Award,
  Bell,
  Clock,
  RefreshCw,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { useParentPortal } from "@/hooks/use-parent-portal";
import { ParentOverviewTab } from "@/components/parent/overview-tab";
import { ParentExamResultsTab } from "@/components/parent/exam-results-tab";
import { ParentFeePayTab } from "@/components/parent/fee-pay-tab";
import { ParentRemarksTab } from "@/components/parent/remarks-tab";
import { ParentLeaveTab } from "@/components/parent/leave-tab";
import { ParentBankPaymentModal } from "@/components/parent/bank-payment-modal";
import { LinkChildModal } from "@/components/parent/link-child-modal";
import type { ParentTab } from "@/components/parent/types";

const PARENT_TABS: readonly ParentTab[] = [
  "overview",
  "results",
  "schedules",
  "fees",
  "remarks",
  "leave",
] as const;

export default function ParentPage() {
  const [activeTab, switchTab] = usePortalTab<ParentTab>(PARENT_TABS, "overview");
  const portal = useParentPortal();
  const { activeStudent, feeRecord, students, loading } = portal;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Parent Portal &amp; Student Progress
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {portal.institutionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live academic records, verified bank fee submissions, leave requests, and campus broadcasts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => portal.setShowLinkChildModal(true)}
            className="text-xs font-semibold"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Link Another Child
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={portal.fetchParentData}
            disabled={loading}
            title="Refresh Records"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs">
          <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold">Loading student profile...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Retrieving academic records and verified fee vouchers.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="text-lg font-bold text-foreground">No Linked Children Found</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            Link your child using the Roll Number issued by {portal.institutionName} to view their attendance, fee vouchers, and teacher remarks.
          </p>
          <Button size="sm" onClick={() => portal.setShowLinkChildModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Link Child by Roll Number
          </Button>
        </div>
      )}

      {/* Populated State */}
      {!loading && activeStudent && (
        <>
          {students.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Select Enrolled Child / Ward:
                </span>
              </div>
              <div className="w-full sm:w-80">
                <CustomSelect
                  value={students[portal.selectedIndex]?._id || ""}
                  onChange={(val) => {
                    const idx = students.findIndex((s) => s._id === val);
                    if (idx !== -1) portal.setSelectedIndex(idx);
                  }}
                  options={students.map((st) => ({
                    value: st._id,
                    label: st.name,
                    sublabel: `${st.grade} (${st.section}) • Roll #${st.rollNumber}`,
                    badge: st.grade,
                  }))}
                  size="sm"
                />
              </div>
            </div>
          )}

          <WorkspaceTabs
            activeTab={activeTab}
            onChange={switchTab}
            tabs={[
              { id: "overview", label: "Academic Standing", shortLabel: "Overview", icon: Users },
              {
                id: "results",
                label: "Exam Results",
                shortLabel: "Results",
                icon: Award,
                badge:
                  Array.isArray(activeStudent.academicRecords) &&
                  activeStudent.academicRecords.length > 0
                    ? activeStudent.academicRecords.length
                    : null,
              },
              { id: "schedules", label: "Schedules & Files", shortLabel: "Files", icon: Clock },
              {
                id: "fees",
                label: "Fee Billing",
                shortLabel: "Fees",
                icon: Receipt,
                badge:
                  feeRecord?.status === "pending_verification"
                    ? "Verifying"
                    : feeRecord?.status || null,
                badgeTone: feeRecord?.status === "paid" ? "success" : "warning",
              },
              {
                id: "remarks",
                label: "Teacher Remarks",
                shortLabel: "Remarks",
                icon: Bell,
                badge:
                  Array.isArray(activeStudent.academicRecords) &&
                  activeStudent.academicRecords.length > 0
                    ? activeStudent.academicRecords.length
                    : null,
              },
              { id: "leave", label: "Leave Notice", shortLabel: "Leave", icon: CalendarCheck },
            ]}
          />

          {activeTab === "overview" && (
            <ParentOverviewTab
              student={activeStudent}
              feeRecord={feeRecord}
              attendanceStats={portal.attendanceStats}
              onSwitchTab={switchTab}
            />
          )}

          {activeTab === "results" && <ParentExamResultsTab student={activeStudent} />}

          {activeTab === "fees" && (
            <ParentFeePayTab
              student={activeStudent}
              feeRecord={feeRecord}
              bankAccounts={portal.bankAccounts}
              onDownloadVoucher={portal.handleDownloadVoucher}
              onOpenBankModal={() => portal.setShowBankModal(true)}
            />
          )}

          {activeTab === "remarks" && <ParentRemarksTab student={activeStudent} />}

          {activeTab === "leave" && (
            <ParentLeaveTab studentId={activeStudent._id} studentName={activeStudent.name} />
          )}
        </>
      )}

      {!loading && activeTab === "schedules" && (
        <div id="schedules" className="scroll-mt-20">
          <CampusDocumentsPanel
            portalLabel="Ward Timetable, Term Syllabus & Exam Date Sheets"
            defaultGradeFilter="ALL"
          />
        </div>
      )}

      {/* Modals */}
      <ParentBankPaymentModal
        open={portal.showBankModal}
        feeRecord={feeRecord}
        studentMonthlyFee={activeStudent?.monthlyFee}
        bankAccounts={portal.bankAccounts}
        selectedBankId={portal.selectedBankId}
        customChannel={portal.customChannel}
        depositorName={portal.depositorName}
        trxRef={portal.trxRef}
        submitting={portal.submittingPayment}
        onSelectBank={portal.setSelectedBankId}
        onCustomChannelChange={portal.setCustomChannel}
        onDepositorChange={portal.setDepositorName}
        onTrxRefChange={portal.setTrxRef}
        onSubmit={portal.handleSubmitBankProof}
        onClose={() => portal.setShowBankModal(false)}
      />

      <LinkChildModal
        open={portal.showLinkChildModal}
        institutionName={portal.institutionName}
        childRollInput={portal.childRollInput}
        linking={portal.linkingChild}
        onRollChange={portal.setChildRollInput}
        onSubmit={portal.handleLinkAnotherChild}
        onClose={() => portal.setShowLinkChildModal(false)}
      />
    </div>
  );
}
