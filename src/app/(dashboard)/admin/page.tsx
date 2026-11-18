"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Receipt,
  ReceiptText,
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Copy,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { SubscriptionManager } from "@/components/subscription-manager";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";
import { exportToExcel } from "@/lib/excel-generator";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { AnalyticsTab } from "@/components/admin/analytics-tab";
import { StudentsTab } from "@/components/admin/students-tab";
import { BillingTab } from "@/components/admin/billing-tab";
import { FacultyTab } from "@/components/admin/faculty-tab";
import {
  StudentAdmissionModal,
  RecordBankPaymentModal,
  PaymentAuditModal,
} from "@/components/admin/admin-modals";
import { BankSettingsModal } from "@/components/admin/bank-settings-modal";
import type {
  AdminFee,
  AdminStudent,
  AdminTab,
  AdminTeacher,
  NewStudentDraft,
  RevenuePoint,
} from "@/components/admin/types";

const ADMIN_TABS: readonly AdminTab[] = [
  "students",
  "billing",
  "faculty",
  "overview",
  "subscription",
] as const;

const INITIAL_STUDENT_DRAFT: NewStudentDraft = {
  name: "",
  grade: "Grade 9",
  section: "A",
  guardianName: "",
  guardianPhone: "",
  monthlyFee: 0,
};

export default function AdminPage() {
  const [activeTab, switchTab] = usePortalTab<AdminTab>(ADMIN_TABS, "students");

  const [fees, setFees] = useState<AdminFee[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [savingTeacherId, setSavingTeacherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [institutionName, setInstitutionName] = useState("CampusFlow");
  const [schoolCode, setSchoolCode] = useState("");

  // Modal state
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentDraft>(INITIAL_STUDENT_DRAFT);

  const [payingFee, setPayingFee] = useState<AdminFee | null>(null);
  const [selectedBank, setSelectedBank] = useState("Meezan Bank Ltd");
  const [bankTrxRef, setBankTrxRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const [auditFee, setAuditFee] = useState<AdminFee | null>(null);
  const [showBankSettings, setShowBankSettings] = useState(false);
  const [verifyingFeeId, setVerifyingFeeId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncInstitution = () => {
      const savedInst = localStorage.getItem("campusflow_institution");
      if (savedInst) setInstitutionName(savedInst);
      const savedCode = localStorage.getItem("campusflow_school_code");
      if (savedCode) setSchoolCode(savedCode);
    };
    syncInstitution();
    window.addEventListener("campusflow_institution_updated", syncInstitution);
    return () => window.removeEventListener("campusflow_institution_updated", syncInstitution);
  }, []);

  const fetchLiveDB = async () => {
    try {
      setLoading(true);
      const [feesRes, studentsRes, analyticsRes, teachersRes, banksRes] = await Promise.all([
        fetch("/api/fees", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/students", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/analytics", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/teachers", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/school/bank-accounts", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (banksRes?.success && Array.isArray(banksRes.bankAccounts)) {
        setBankAccounts(banksRes.bankAccounts);
      }

      if (teachersRes?.success && Array.isArray(teachersRes.teachers)) {
        setTeachers(teachersRes.teachers);
      }

      if (feesRes?.success && Array.isArray(feesRes.fees)) {
        setFees(
          feesRes.fees.map((f: any) => ({
            id: f.invoiceNumber || f._id,
            mongoId: f._id,
            studentName: f.studentName,
            rollNumber: f.rollNumber,
            grade: f.grade,
            amount: f.amount,
            month: f.month,
            dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "N/A",
            status: f.status,
            paymentMethod: f.paymentMethod || "",
            transactionRef: f.transactionRef || "",
          }))
        );
      }

      if (studentsRes?.success && Array.isArray(studentsRes.students)) {
        setStudents(
          studentsRes.students.map((s: any) => ({
            id: s._id,
            name: s.name,
            rollNumber: s.rollNumber,
            grade: s.grade,
            section: s.section,
            guardian: s.guardianName,
            phone: s.guardianPhone,
            status: s.status,
            monthlyFee: s.monthlyFee,
            createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "Active",
          }))
        );
      }

      if (analyticsRes?.success && Array.isArray(analyticsRes.revenueTrend)) {
        setRevenueData(analyticsRes.revenueTrend);
      }
    } catch {
      toast.error("Failed to load records from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDB();
  }, []);

  const handleToggleFacultyRole = async (
    teacherId: string,
    targetRole: "teacher" | "coordinator"
  ) => {
    setSavingTeacherId(teacherId);
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, role: targetRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update faculty role.");
        return;
      }
      setTeachers((prev) => prev.map((t) => (t.id === teacherId ? data.teacher : t)));
      toast.success(data.message || "Faculty role updated.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingTeacherId(null);
    }
  };

  const saveTeacherAssignments = async (
    teacherId: string,
    nextAssignments: Array<{ grade: string; section: string }>
  ) => {
    setSavingTeacherId(teacherId);
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, assignedClasses: nextAssignments }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update teacher permissions.");
        return;
      }
      setTeachers((prev) => prev.map((t) => (t.id === teacherId ? data.teacher : t)));
      toast.success(data.message || "Teacher assignments updated.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingTeacherId(null);
    }
  };

  const schoolClassSectionCombos = useMemo(() => {
    const map = new Map<string, { grade: string; section: string; count: number }>();
    for (const s of students) {
      const grade = (s.grade || "").trim();
      const section = (s.section || "A").trim();
      if (!grade || !section) continue;
      const key = `${grade.toLowerCase()}::${section.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { grade, section, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) =>
      `${a.grade} ${a.section}`.localeCompare(`${b.grade} ${b.section}`, undefined, {
        numeric: true,
      })
    );
  }, [students]);

  const totalCollected = fees
    .filter((f) => f.status === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPending = fees
    .filter((f) => f.status !== "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const recoveryRate =
    totalCollected + totalPending > 0
      ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
      : 0;

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      toast.error("Please enter the student's full name.");
      return;
    }

    setSubmittingStudent(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (data.success && data.student) {
        toast.success(
          `Enrolled ${data.student.name} (Roll # ${data.student.rollNumber})! Share School Code & Roll # with student/parent to link their portal.`
        );
        setShowAdmissionModal(false);
        setNewStudent(INITIAL_STUDENT_DRAFT);
        setSearchTerm("");
        setGradeFilter("all");
        await fetchLiveDB();
      } else {
        toast.error(data.error || "Failed to admit student");
      }
    } catch {
      toast.error("Network error while admitting student");
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleConfirmBankPayment = async () => {
    if (!payingFee) return;
    setProcessingPayment(true);
    try {
      const refToSave = bankTrxRef.trim() || "Counter Receipt";
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payingFee.mongoId,
          status: "paid",
          paymentMethod: selectedBank,
          transactionRef: refToSave,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Fee marked paid via ${selectedBank}! Ref: ${refToSave}`);
        setPayingFee(null);
        setBankTrxRef("");
        setSearchTerm("");
        setGradeFilter("all");
        await fetchLiveDB();
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch {
      toast.error("Network error while recording bank payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadPDF = (fee: AdminFee) => {
    try {
      const doc = generateFeeVoucherPDF({
        invoiceNumber: fee.id,
        studentName: fee.studentName,
        rollNumber: fee.rollNumber,
        grade: fee.grade,
        month: fee.month,
        amount: fee.amount,
        dueDate: fee.dueDate,
        status: fee.status,
        institution: institutionName,
        paymentMethod: fee.paymentMethod,
        transactionRef: fee.transactionRef,
        bankAccounts,
      });
      doc.save(`Voucher-${fee.rollNumber}-${fee.id}.pdf`);
      toast.success(`PDF Voucher for ${fee.studentName} downloaded.`);
    } catch {
      toast.error("Failed to generate PDF voucher");
    }
  };

  const handleExportExcel = () => {
    if (fees.length === 0) {
      toast.error("No fee records to export. Enroll students first.");
      return;
    }
    try {
      const data = fees.map((f) => ({
        "Invoice No": f.id,
        "Student Name": f.studentName,
        "Roll No": f.rollNumber,
        Grade: f.grade,
        "Amount (PKR)": f.amount,
        Month: f.month,
        "Due Date": f.dueDate,
        Status: f.status.toUpperCase(),
        "Payment Method": f.paymentMethod || "N/A",
        "Transaction Ref": f.transactionRef || "N/A",
      }));
      exportToExcel(data, `CampusFlow-Billing-${Date.now()}`, "Fees");
      toast.success("Billing spreadsheet exported to Excel.");
    } catch {
      toast.error("Failed to export Excel file");
    }
  };

  const gradeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.grade) counts[s.grade] = (counts[s.grade] || 0) + 1;
    });
    const standardGrades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    const allGrades = Array.from(new Set([...standardGrades, ...Object.keys(counts)]));
    return [
      { value: "all", label: "All Grades", badge: `${students.length} students` },
      ...allGrades.map((g) => ({
        value: g,
        label: g,
        badge: counts[g] ? `${counts[g]}` : "0",
      })),
    ];
  }, [students]);

  const handleVerifyOrRejectFee = async (fee: AdminFee, approve: boolean) => {
    setVerifyingFeeId(fee.mongoId);
    try {
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fee.mongoId,
          status: approve ? "paid" : "pending",
          paymentMethod: fee.paymentMethod,
          transactionRef: fee.transactionRef,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          approve
            ? `Verified & cleared payment for ${fee.studentName}!`
            : `Rejected unverified transfer for ${fee.studentName}. Guardian notified.`
        );
        await fetchLiveDB();
      } else {
        toast.error(data.error || "Failed to update payment status.");
      }
    } catch {
      toast.error("Network error while verifying payment.");
    } finally {
      setVerifyingFeeId(null);
    }
  };

  const feeStatusOptions = useMemo(() => {
    const paidCount = fees.filter((f) => f.status === "paid").length;
    const verifyingCount = fees.filter((f) => f.status === "pending_verification").length;
    const pendingCount = fees.filter((f) => f.status === "pending").length;
    const overdueCount = fees.filter((f) => f.status === "overdue").length;
    return [
      { value: "all", label: "All Vouchers", badge: `${fees.length}` },
      { value: "pending_verification", label: "Verify Proof", badge: `${verifyingCount}` },
      { value: "paid", label: "Paid Only", badge: `${paidCount}` },
      { value: "pending", label: "Pending Only", badge: `${pendingCount}` },
      { value: "overdue", label: "Overdue Only", badge: `${overdueCount}` },
    ];
  }, [fees]);

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.guardian?.toLowerCase().includes(q);
    const matchesGrade =
      gradeFilter === "all" || s.grade?.toLowerCase().includes(gradeFilter.toLowerCase());
    return matchesSearch && matchesGrade;
  });

  const filteredFees = fees.filter((f) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      f.studentName?.toLowerCase().includes(q) ||
      f.rollNumber?.toLowerCase().includes(q) ||
      f.id?.toLowerCase().includes(q);
    const matchesStatus = feeStatusFilter === "all" || f.status === feeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Admin & Micro-Billing Hub
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
            onClick={fetchLiveDB}
            title="Refresh Records"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={fees.length === 0}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button size="sm" onClick={() => setShowAdmissionModal(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* School Join Code Invite Banner */}
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

      {/* Workspace Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onChange={switchTab}
        tabs={[
          {
            id: "students",
            label: "Students Directory",
            shortLabel: "Students",
            icon: Users,
            badge: students.length,
          },
          {
            id: "billing",
            label: "Fee Billing & Vouchers",
            shortLabel: "Fee Billing",
            icon: ReceiptText,
            badge: fees.length,
          },
          {
            id: "faculty",
            label: "Faculty & Sections",
            shortLabel: "Faculty",
            icon: ShieldCheck,
            badge: teachers.length,
          },
          {
            id: "overview",
            label: "Financial Analytics",
            shortLabel: "Analytics",
            icon: LayoutDashboard,
          },
          {
            id: "subscription",
            label: "Subscription & Plan",
            shortLabel: "Plan",
            icon: CreditCard,
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Enrolled Students</span>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight">{students.length}</span>
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
              Verified bank transfers & cash
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

      {/* Active Tab Views */}
      {activeTab === "overview" && (
        <AnalyticsTab
          revenueData={revenueData}
          fees={fees}
          onFocusBilling={() => switchTab("billing")}
        />
      )}

      {(activeTab === "students" || activeTab === "overview") && (
        <StudentsTab
          students={filteredStudents}
          fees={fees}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          gradeFilter={gradeFilter}
          onGradeFilterChange={setGradeFilter}
          gradeOptions={gradeOptions}
          onOpenAdmission={() => setShowAdmissionModal(true)}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {(activeTab === "billing" || activeTab === "overview") && (
        <BillingTab
          fees={filteredFees}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          feeStatusFilter={feeStatusFilter}
          onFeeStatusFilterChange={setFeeStatusFilter}
          feeStatusOptions={feeStatusOptions}
          verifyingFeeId={verifyingFeeId}
          onDownloadPDF={handleDownloadPDF}
          onOpenBankPay={(fee) => {
            setPayingFee(fee);
            setBankTrxRef("");
          }}
          onOpenAudit={(fee) => setAuditFee(fee)}
          onOpenBankSettings={() => setShowBankSettings(true)}
          onVerifyOrRejectFee={handleVerifyOrRejectFee}
        />
      )}

      {activeTab === "faculty" && (
        <FacultyTab
          teachers={teachers}
          schoolClassSectionCombos={schoolClassSectionCombos}
          savingTeacherId={savingTeacherId}
          schoolCode={schoolCode}
          institutionName={institutionName}
          onToggleRole={handleToggleFacultyRole}
          onSaveAssignments={saveTeacherAssignments}
        />
      )}

      {activeTab === "subscription" && (
        <div id="subscription" className="scroll-mt-20">
          <SubscriptionManager />
        </div>
      )}

      {/* Modals */}
      <StudentAdmissionModal
        open={showAdmissionModal}
        institutionName={institutionName}
        draft={newStudent}
        submitting={submittingStudent}
        onChange={setNewStudent}
        onSubmit={handleEnrollStudent}
        onClose={() => setShowAdmissionModal(false)}
      />

      <RecordBankPaymentModal
        fee={payingFee}
        selectedBank={selectedBank}
        bankTrxRef={bankTrxRef}
        processing={processingPayment}
        onBankChange={setSelectedBank}
        onTrxRefChange={setBankTrxRef}
        onConfirm={handleConfirmBankPayment}
        onClose={() => setPayingFee(null)}
      />

      <PaymentAuditModal
        fee={auditFee}
        onClose={() => setAuditFee(null)}
        onDownloadPDF={handleDownloadPDF}
      />

      <BankSettingsModal
        open={showBankSettings}
        onClose={() => {
          setShowBankSettings(false);
          fetchLiveDB();
        }}
      />
    </div>
  );
}
