"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { ParentOverviewTab } from "@/components/parent/overview-tab";
import { ParentExamResultsTab } from "@/components/parent/exam-results-tab";
import { ParentFeePayTab } from "@/components/parent/fee-pay-tab";
import { ParentRemarksTab } from "@/components/parent/remarks-tab";
import { ParentLeaveTab } from "@/components/parent/leave-tab";
import { ParentBankPaymentModal, LinkChildModal } from "@/components/parent/parent-modals";
import type { ParentTab, SchoolBankAccount } from "@/components/parent/types";

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

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [feeRecord, setFeeRecord] = useState<any | null>(null);
  const [bankAccounts, setBankAccounts] = useState<SchoolBankAccount[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [institutionName, setInstitutionName] = useState("CampusFlow");

  // Bank Transfer Proof Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [customChannel, setCustomChannel] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [trxRef, setTrxRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Link Another Child Modal State
  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [childRollInput, setChildRollInput] = useState("");
  const [linkingChild, setLinkingChild] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncInst = () => {
      const saved = localStorage.getItem("campusflow_institution");
      if (saved) setInstitutionName(saved);
    };
    syncInst();
    window.addEventListener("campusflow_institution_updated", syncInst);
    return () => window.removeEventListener("campusflow_institution_updated", syncInst);
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const [studentsRes, feesRes, banksRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/fees", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/school/bank-accounts", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (banksRes?.success && Array.isArray(banksRes.bankAccounts)) {
        setBankAccounts(banksRes.bankAccounts);
        if (banksRes.bankAccounts.length > 0 && !selectedBankId) {
          setSelectedBankId(banksRes.bankAccounts[0].id);
        }
      }

      const studentList =
        studentsRes?.success && Array.isArray(studentsRes.students) ? studentsRes.students : [];
      setStudents(studentList);

      if (studentList.length > 0) {
        const currentStudent = studentList[selectedIndex] || studentList[0];
        const matchFee =
          feesRes?.fees?.find((f: any) => f.rollNumber === currentStudent.rollNumber) || null;
        setFeeRecord(matchFee);
        if (currentStudent.guardianName || currentStudent.guardian) {
          setDepositorName(currentStudent.guardianName || currentStudent.guardian);
        }
      } else {
        setFeeRecord(null);
      }
    } catch {
      toast.error("Failed to load student records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [selectedIndex]);

  const activeStudent = students[selectedIndex] || null;

  useEffect(() => {
    if (activeStudent?._id) {
      fetch(`/api/attendance?studentId=${activeStudent._id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.stats) setAttendanceStats(d.stats);
        })
        .catch(() => { });
    }
  }, [activeStudent?._id]);

  const handleLinkAnotherChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childRollInput.trim()) {
      toast.error("Please enter your child's Roll Number.");
      return;
    }

    setLinkingChild(true);
    try {
      const res = await fetch("/api/parent/link-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: childRollInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Unable to link child.");
        return;
      }

      toast.success(data.message || "Child linked successfully!");
      setShowLinkChildModal(false);
      setChildRollInput("");
      const nextIdx = students.length;
      await fetchParentData();
      setSelectedIndex(nextIdx);
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setLinkingChild(false);
    }
  };

  const handleDownloadVoucher = () => {
    if (!activeStudent || !feeRecord) {
      toast.error("No active fee voucher available for download.");
      return;
    }

    try {
      const doc = generateFeeVoucherPDF({
        invoiceNumber: feeRecord.invoiceNumber || `INV-${activeStudent.rollNumber}`,
        studentName: activeStudent.name,
        rollNumber: activeStudent.rollNumber,
        grade: `${activeStudent.grade} - ${activeStudent.section}`,
        month: feeRecord.month || "Current Term",
        amount: feeRecord.amount ?? activeStudent.monthlyFee ?? 0,
        dueDate: feeRecord.dueDate
          ? new Date(feeRecord.dueDate).toISOString().split("T")[0]
          : "N/A",
        status: feeRecord.status || "pending",
        institution: institutionName,
        paymentMethod: feeRecord.paymentMethod,
        transactionRef: feeRecord.transactionRef,
        bankAccounts,
      });
      doc.save(`Voucher-${activeStudent.rollNumber}.pdf`);
      toast.success("Fee voucher downloaded successfully.");
    } catch {
      toast.error("Failed to generate voucher PDF.");
    }
  };

  const handleSubmitBankProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeRecord?._id) return;

    if (trxRef.trim().length < 4) {
      toast.error("Please enter your real Bank Transaction Reference / Deposit Slip ID.");
      return;
    }

    const chosenBank =
      bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0] || null;
    const channelName = chosenBank?.bankName || customChannel.trim() || "Bank Transfer";

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feeRecord._id,
          paymentMethod: channelName,
          transactionRef: trxRef.trim(),
          depositorName: depositorName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.fee) {
        setFeeRecord(data.fee);
        setShowBankModal(false);
        setTrxRef("");
        toast.success(
          data.message ||
          "Transfer proof submitted! Fee will clear once School Administration verifies it."
        );
      } else {
        toast.error(data.error || "Failed to submit transfer proof.");
      }
    } catch {
      toast.error("Network error while submitting bank transfer proof.");
    } finally {
      setSubmittingPayment(false);
    }
  };

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
              {institutionName}
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
            onClick={() => setShowLinkChildModal(true)}
            className="text-xs font-semibold"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Link Another Child
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchParentData}
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
            Link your child using the Roll Number issued by {institutionName} to view their attendance, fee vouchers, and teacher remarks.
          </p>
          <Button size="sm" onClick={() => setShowLinkChildModal(true)}>
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
                  value={students[selectedIndex]?._id || ""}
                  onChange={(val) => {
                    const idx = students.findIndex((s) => s._id === val);
                    if (idx !== -1) setSelectedIndex(idx);
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
                  Array.isArray(activeStudent?.academicRecords) &&
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
                  Array.isArray(activeStudent?.academicRecords) &&
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
              attendanceStats={attendanceStats}
              onSwitchTab={switchTab}
            />
          )}

          {activeTab === "results" && <ParentExamResultsTab student={activeStudent} />}

          {activeTab === "fees" && (
            <ParentFeePayTab
              student={activeStudent}
              feeRecord={feeRecord}
              bankAccounts={bankAccounts}
              onDownloadVoucher={handleDownloadVoucher}
              onOpenBankModal={() => setShowBankModal(true)}
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
        open={showBankModal}
        feeRecord={feeRecord}
        studentMonthlyFee={activeStudent?.monthlyFee}
        bankAccounts={bankAccounts}
        selectedBankId={selectedBankId}
        customChannel={customChannel}
        depositorName={depositorName}
        trxRef={trxRef}
        submitting={submittingPayment}
        onSelectBank={setSelectedBankId}
        onCustomChannelChange={setCustomChannel}
        onDepositorChange={setDepositorName}
        onTrxRefChange={setTrxRef}
        onSubmit={handleSubmitBankProof}
        onClose={() => setShowBankModal(false)}
      />

      <LinkChildModal
        open={showLinkChildModal}
        institutionName={institutionName}
        childRollInput={childRollInput}
        linking={linkingChild}
        onRollChange={setChildRollInput}
        onSubmit={handleLinkAnotherChild}
        onClose={() => setShowLinkChildModal(false)}
      />
    </div>
  );
}
