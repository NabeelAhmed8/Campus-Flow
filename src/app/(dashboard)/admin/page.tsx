"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, ReceiptText, LayoutDashboard, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { SubscriptionManager } from "@/components/subscription-manager";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";
import { exportToExcel } from "@/lib/excel-generator";
import { GRADE_OPTIONS } from "@/lib/constants";
import { readClientAuthStorage } from "@/lib/client-auth";
import { usePortalTab } from "@/hooks/use-portal-tab";
import { useAdminData } from "@/hooks/use-admin-data";
import { useAdminModals } from "@/hooks/use-admin-modals";
import { AdminHeaderBanner, AdminKpiCards } from "@/components/admin/admin-header-kpis";
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
import type { AdminFee, AdminTab } from "@/components/admin/types";

const ADMIN_TABS: readonly AdminTab[] = [
  "students",
  "billing",
  "faculty",
  "overview",
  "subscription",
] as const;

export default function AdminPage() {
  const [activeTab, switchTab] = usePortalTab<AdminTab>(ADMIN_TABS, "students");
  const {
    fees,
    students,
    teachers,
    revenueData,
    bankAccounts,
    loading,
    savingTeacherId,
    verifyingFeeId,
    fetchLiveDB,
    toggleFacultyRole,
    saveTeacherAssignments,
    verifyOrRejectFee,
  } = useAdminData();

  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [institutionName, setInstitutionName] = useState("CampusFlow");
  const [schoolCode, setSchoolCode] = useState("");

  const modals = useAdminModals({
    onSuccessRefresh: fetchLiveDB,
    onResetFilters: () => {
      setSearchTerm("");
      setGradeFilter("all");
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncInstitution = () => {
      const auth = readClientAuthStorage();
      if (auth.institution) setInstitutionName(auth.institution);
      if (auth.schoolCode) setSchoolCode(auth.schoolCode);
    };
    syncInstitution();
    window.addEventListener("campusflow_institution_updated", syncInstitution);
    return () => window.removeEventListener("campusflow_institution_updated", syncInstitution);
  }, []);

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
    const allGrades = Array.from(
      new Set([...GRADE_OPTIONS.map((g) => g.value), ...Object.keys(counts)])
    );
    return [
      { value: "all", label: "All Grades", badge: `${students.length} students` },
      ...allGrades.map((g) => ({ value: g, label: g, badge: counts[g] ? `${counts[g]}` : "0" })),
    ];
  }, [students]);

  const feeStatusOptions = useMemo(() => {
    const countBy = (st: string) => fees.filter((f) => f.status === st).length;
    return [
      { value: "all", label: "All Vouchers", badge: `${fees.length}` },
      { value: "pending_verification", label: "Verify Proof", badge: `${countBy("pending_verification")}` },
      { value: "paid", label: "Paid Only", badge: `${countBy("paid")}` },
      { value: "pending", label: "Pending Only", badge: `${countBy("pending")}` },
      { value: "overdue", label: "Overdue Only", badge: `${countBy("overdue")}` },
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
      <AdminHeaderBanner
        institutionName={institutionName}
        schoolCode={schoolCode}
        loading={loading}
        feeCount={fees.length}
        onRefresh={fetchLiveDB}
        onExportExcel={handleExportExcel}
        onOpenAdmission={() => modals.setShowAdmissionModal(true)}
      />

      <WorkspaceTabs
        activeTab={activeTab}
        onChange={switchTab}
        tabs={[
          { id: "students", label: "Students Directory", shortLabel: "Students", icon: Users, badge: students.length },
          { id: "billing", label: "Fee Billing & Vouchers", shortLabel: "Fee Billing", icon: ReceiptText, badge: fees.length },
          { id: "faculty", label: "Faculty & Sections", shortLabel: "Faculty", icon: ShieldCheck, badge: teachers.length },
          { id: "overview", label: "Financial Analytics", shortLabel: "Analytics", icon: LayoutDashboard },
          { id: "subscription", label: "Subscription & Plan", shortLabel: "Plan", icon: CreditCard },
        ]}
      />

      <AdminKpiCards
        studentCount={students.length}
        totalCollected={totalCollected}
        totalPending={totalPending}
        recoveryRate={recoveryRate}
      />

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
          onOpenAdmission={() => modals.setShowAdmissionModal(true)}
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
            modals.setPayingFee(fee);
            modals.setBankTrxRef("");
          }}
          onOpenAudit={(fee) => modals.setAuditFee(fee)}
          onOpenBankSettings={() => modals.setShowBankSettings(true)}
          onVerifyOrRejectFee={verifyOrRejectFee}
        />
      )}

      {activeTab === "faculty" && (
        <FacultyTab
          teachers={teachers}
          schoolClassSectionCombos={schoolClassSectionCombos}
          savingTeacherId={savingTeacherId}
          schoolCode={schoolCode}
          institutionName={institutionName}
          onToggleRole={toggleFacultyRole}
          onSaveAssignments={saveTeacherAssignments}
        />
      )}

      {activeTab === "subscription" && (
        <div id="subscription" className="scroll-mt-20">
          <SubscriptionManager />
        </div>
      )}

      <StudentAdmissionModal
        open={modals.showAdmissionModal}
        institutionName={institutionName}
        draft={modals.newStudent}
        submitting={modals.submittingStudent}
        onChange={modals.setNewStudent}
        onSubmit={modals.handleEnrollStudent}
        onClose={() => modals.setShowAdmissionModal(false)}
      />

      <RecordBankPaymentModal
        fee={modals.payingFee}
        selectedBank={modals.selectedBank}
        bankTrxRef={modals.bankTrxRef}
        processing={modals.processingPayment}
        onBankChange={modals.setSelectedBank}
        onTrxRefChange={modals.setBankTrxRef}
        onConfirm={modals.handleConfirmBankPayment}
        onClose={() => modals.setPayingFee(null)}
      />

      <PaymentAuditModal
        fee={modals.auditFee}
        onClose={() => modals.setAuditFee(null)}
        onDownloadPDF={handleDownloadPDF}
      />

      <BankSettingsModal
        open={modals.showBankSettings}
        onClose={() => {
          modals.setShowBankSettings(false);
          fetchLiveDB();
        }}
      />
    </div>
  );
}
