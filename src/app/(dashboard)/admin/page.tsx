"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Receipt,
  ReceiptText,
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  X,
  UserPlus,
  Building2,
  CreditCard,
  Filter,
  GraduationCap,
  ShieldCheck,
  Lock,
  Copy,
  KeyRound,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { SubscriptionManager } from "@/components/subscription-manager";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";
import { exportToExcel } from "@/lib/excel-generator";

const PAKISTANI_BANK_OPTIONS = [
  { value: "Meezan Bank Ltd", label: "Meezan Bank Ltd", sublabel: "Direct Deposit / IBAN", badge: "Islamic Bank" },
  { value: "HBL (Habib Bank Limited)", label: "HBL (Habib Bank Limited)", sublabel: "Branch Challan / Mobile App", badge: "Commercial" },
  { value: "UBL (United Bank Limited)", label: "UBL (United Bank Limited)", sublabel: "Net Banking / Omni Voucher", badge: "Commercial" },
  { value: "Bank Alfalah", label: "Bank Alfalah", sublabel: "Online & OTC Transfer", badge: "Commercial" },
  { value: "Raast Instant Pay (SBP)", label: "Raast Instant Pay", sublabel: "State Bank of Pakistan (0% fee)", badge: "Instant" },
  { value: "JazzCash / EasyPaisa", label: "JazzCash / EasyPaisa", sublabel: "Mobile Microfinance Wallet", badge: "Mobile" },
  { value: "Cash Counter Challan", label: "School Cash Counter Challan", sublabel: "Physical receipt at campus", badge: "Manual" },
];

export default function AdminPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "students" | "billing" | "faculty" | "overview" | "subscription"
  >("students");
  const [teacherAssignDraft, setTeacherAssignDraft] = useState<
    Record<string, { grade: string; section: string }>
  >({});
  const [savingTeacherId, setSavingTeacherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Institution Name & School Join Code from Session / LocalStorage
  const [institutionName, setInstitutionName] = useState("St. Jude Collegiate Academy");
  const [schoolCode, setSchoolCode] = useState("");

  // Admission Modal State
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    grade: "Grade 9",
    section: "A",
    guardianName: "",
    guardianPhone: "",
    monthlyFee: 12500,
  });

  // Pakistani Bank Payment Recording Modal (Admin side)
  const [payingFee, setPayingFee] = useState<any | null>(null);
  const [selectedBank, setSelectedBank] = useState("Meezan Bank Ltd");
  const [bankTrxRef, setBankTrxRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Immutable Payment Audit Certificate Modal State (Anti-Corruption Protection)
  const [auditFee, setAuditFee] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedInst = localStorage.getItem("campusflow_institution");
      if (savedInst) setInstitutionName(savedInst);
      const savedCode = localStorage.getItem("campusflow_school_code");
      if (savedCode) setSchoolCode(savedCode);

      const handleUpdate = () => {
        const updated = localStorage.getItem("campusflow_institution");
        if (updated) setInstitutionName(updated);
        const updatedCode = localStorage.getItem("campusflow_school_code");
        if (updatedCode) setSchoolCode(updatedCode);
      };
      window.addEventListener("campusflow_institution_updated", handleUpdate);

      // Listen for tab sync
      const handleTabSync = (e?: any) => {
        if (e && "detail" in e && (e.detail?.tab || e.detail?.tabKey)) {
          const t = e.detail.tab || e.detail.tabKey;
          if (
            t === "students" ||
            t === "billing" ||
            t === "faculty" ||
            t === "overview" ||
            t === "subscription"
          ) {
            setActiveTab(t);
            return;
          }
        }
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (
          tab === "students" ||
          tab === "billing" ||
          tab === "faculty" ||
          tab === "overview" ||
          tab === "subscription"
        ) {
          setActiveTab(tab);
        } else {
          setActiveTab("students");
        }
      };
      handleTabSync();
      window.addEventListener("popstate", handleTabSync);
      window.addEventListener("campusflow_tab_change", handleTabSync);

      return () => {
        window.removeEventListener("campusflow_institution_updated", handleUpdate);
        window.removeEventListener("popstate", handleTabSync);
        window.removeEventListener("campusflow_tab_change", handleTabSync);
      };
    }
  }, []);

  const switchTab = (
    tab: "students" | "billing" | "faculty" | "overview" | "subscription"
  ) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tab=${tab}`);
      window.dispatchEvent(new CustomEvent("campusflow_tab_change", { detail: { tab } }));
    }
  };

  // Fetch live records
  const fetchLiveDB = async () => {
    try {
      setLoading(true);
      const [feesRes, studentsRes, analyticsRes, teachersRes] = await Promise.all([
        fetch("/api/fees", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/students", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/analytics", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/teachers", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);

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

  // Promote Teacher -> Coordinator or Demote Coordinator -> Teacher
  const handleToggleFacultyRole = async (
    teacherId: string,
    targetRole: "teacher" | "coordinator"
  ) => {
    setSavingTeacherId(teacherId);
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          role: targetRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update faculty role.");
        return;
      }
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? data.teacher : t))
      );
      toast.success(data.message || "Faculty role updated.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingTeacherId(null);
    }
  };

  // Update Teacher Class & Section Assignments
  const saveTeacherAssignments = async (
    teacherId: string,
    nextAssignments: Array<{ grade: string; section: string }>
  ) => {
    setSavingTeacherId(teacherId);
    try {
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          assignedClasses: nextAssignments,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update teacher permissions.");
        return;
      }
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? data.teacher : t))
      );
      toast.success(data.message || "Teacher assignments updated.");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSavingTeacherId(null);
    }
  };

  // Available unique Class + Section combos already enrolled in this school
  const schoolClassSectionCombos = useMemo(() => {
    const map = new Map<string, { grade: string; section: string; count: number }>();
    for (const s of students) {
      const grade = (s.grade || "").trim();
      const section = (s.section || "A").trim();
      if (!grade || !section) continue;
      const key = `${grade.toLowerCase()}::${section.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { grade, section, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      `${a.grade} ${a.section}`.localeCompare(`${b.grade} ${b.section}`, undefined, {
        numeric: true,
      })
    );
  }, [students]);

  // Quick stats calculation
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

  // Student Admission submission
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
        setNewStudent({
          name: "",
          grade: "Grade 9",
          section: "A",
          guardianName: "",
          guardianPhone: "",
          monthlyFee: 12500,
        });
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

  // Record Pakistani Local Bank Payment
  const handleConfirmBankPayment = async () => {
    if (!payingFee) return;
    setProcessingPayment(true);
    try {
      const refToSave = bankTrxRef.trim() || `PK-TRX-${Math.floor(100000 + Math.random() * 900000)}`;
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

  // Download PDF voucher
  const handleDownloadPDF = (fee: any) => {
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
      });
      doc.save(`Voucher-${fee.rollNumber}-${fee.id}.pdf`);
      toast.success(`PDF Voucher for ${fee.studentName} downloaded.`);
    } catch {
      toast.error("Failed to generate PDF voucher");
    }
  };

  // Export to Excel
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

  // Dynamic grade options with student count badges
  const gradeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.grade) {
        counts[s.grade] = (counts[s.grade] || 0) + 1;
      }
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

  // Dynamic fee status options with invoice count badges
  const feeStatusOptions = useMemo(() => {
    const paidCount = fees.filter((f) => f.status === "paid").length;
    const pendingCount = fees.filter((f) => f.status === "pending").length;
    const overdueCount = fees.filter((f) => f.status === "overdue").length;
    return [
      { value: "all", label: "All Vouchers", badge: `${fees.length}` },
      { value: "paid", label: "Paid Only", badge: `${paidCount}` },
      { value: "pending", label: "Pending Only", badge: `${pendingCount}` },
      { value: "overdue", label: "Overdue Only", badge: `${overdueCount}` },
    ];
  }, [fees]);

  // Filtered Students list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardian?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || s.grade?.toLowerCase().includes(gradeFilter.toLowerCase());
    return matchesSearch && matchesGrade;
  });

  // Filtered Fees list with dynamic status filter
  const filteredFees = fees.filter((f) => {
    const matchesSearch =
      f.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = feeStatusFilter === "all" || f.status === feeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin & Micro-Billing Hub</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {institutionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Student roster directory, Pakistani local bank payment reconciliation, and automated fee vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLiveDB} title="Refresh Records" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={fees.length === 0}>
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
                <span className="text-xs font-bold text-foreground">
                  Official School Join Code
                </span>
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

      {/* Dynamic Responsive Workspace Tabs */}
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
            <span className="block text-xs text-muted-foreground mt-1">Active student master roster</span>
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
            <span className="text-2xl font-bold tracking-tight">Rs. {totalCollected.toLocaleString()}</span>
            <span className="block text-xs text-muted-foreground mt-1">Verified bank transfers & cash</span>
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
            <span className="text-2xl font-bold tracking-tight">Rs. {totalPending.toLocaleString()}</span>
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

      {/* SECTION 3: FINANCIAL ANALYTICS & VELOCITY */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Financial Influx & Target Velocity</h3>
                <p className="text-xs text-muted-foreground">Monthly billing recovery trend vs institutional budget target</p>
              </div>
            </div>
            {revenueData.length > 0 && revenueData.some((d) => d.collected > 0 || d.target > 0) ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1, #b45309)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--chart-1, #b45309)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `Rs.${v / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, "Amount"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      stroke="var(--chart-1, #b45309)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCollected)"
                      name="Collected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border border-dashed rounded-xl">
                <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-semibold text-foreground">No Revenue Recorded Yet</p>
                <p className="text-xs max-w-sm mt-1">
                  Once payments are confirmed via Pakistani local bank transfers or cash, financial trends will automatically display here.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Billing Distribution</h3>
              <p className="text-xs text-muted-foreground mb-4">Current billing cycle breakdown</p>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Paid & Cleared</span>
                  </div>
                  <span className="font-semibold">{fees.filter((f) => f.status === "paid").length} invoices</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Pending Due</span>
                  </div>
                  <span className="font-semibold">{fees.filter((f) => f.status === "pending").length} invoices</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span>Overdue</span>
                  </div>
                  <span className="font-semibold">{fees.filter((f) => f.status === "overdue").length} invoices</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => switchTab("billing")}
              >
                Focus Fee Vouchers ({fees.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: ALL ENROLLED STUDENTS DIRECTORY */}
      {(activeTab === "students" || activeTab === "overview") && (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Enrolled Students Roster
              </h2>
              <p className="text-xs text-muted-foreground">
                Master data of all enrolled students, class sections, guardian emergency contacts, and monthly tuition fee.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  id="admin-search-student"
                  name="studentSearch"
                  type="text"
                  autoComplete="off"
                  aria-label="Search student by name or roll number"
                  placeholder="Search student or roll #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8.5 w-52 rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="w-44 min-w-[150px]">
                <CustomSelect
                  value={gradeFilter}
                  onChange={(val) => setGradeFilter(val)}
                  options={gradeOptions}
                  size="sm"
                />
              </div>

              <Button size="sm" onClick={() => setShowAdmissionModal(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                New Admission
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class / Section</th>
                  <th className="py-3 px-4">Guardian Details</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Monthly Tuition</th>
                  <th className="py-3 px-4">Fee Status</th>
                  <th className="py-3 px-4">Enrollment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => {
                    const studentFee = fees.find((f) => f.rollNumber === st.rollNumber);
                    const isPaid = studentFee?.status === "paid";
                    return (
                      <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-foreground">{st.rollNumber}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] uppercase">
                              {st.name.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-foreground">{st.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {st.grade} - Section {st.section}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{st.guardian}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">{st.phone}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          Rs. {Number(st.monthlyFee || 12500).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {studentFee ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                isPaid
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {studentFee.status}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No Invoice</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                            {st.status?.toUpperCase() || "ACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {studentFee ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleDownloadPDF(studentFee)}
                              title="Download PDF Fee Voucher"
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Voucher
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-10 w-10 text-muted-foreground/30" />
                        <p className="font-medium text-foreground text-sm">No Enrolled Students Found</p>
                        <p className="text-xs max-w-sm">
                          Use the &quot;New Admission&quot; button above to enroll your first student with their class assignment and tuition fee.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: FEE BILLING & PAKISTANI LOCAL BANK VOUCHERS */}
      {(activeTab === "billing" || activeTab === "overview") && (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
            <div>
              <h2 className="font-semibold tracking-tight text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Fee Records & Pakistani Local Bank Billing
              </h2>
              <p className="text-xs text-muted-foreground">
                Collect dues via Meezan Bank, HBL, Raast, or JazzCash and issue cleared PDF vouchers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44 min-w-[150px]">
                <CustomSelect
                  value={feeStatusFilter}
                  onChange={(val) => setFeeStatusFilter(val)}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8.5 w-52 rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
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
                {filteredFees.length > 0 ? (
                  filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">{fee.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{fee.studentName}</div>
                        <div className="text-[11px] text-muted-foreground">{fee.rollNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{fee.grade}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">Rs. {Number(fee.amount).toLocaleString()}</td>
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
                          <div className="text-[10px] font-mono text-muted-foreground">Ref: {fee.transactionRef}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            fee.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600"
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
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDownloadPDF(fee)}
                          title={fee.status === "paid" ? "Download Cleared Receipt PDF" : "Download PDF Fee Voucher"}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {fee.status === "paid" ? "Receipt" : "Voucher"}
                        </Button>
                        {fee.status !== "paid" ? (
                          <Button
                            size="xs"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            onClick={() => {
                              setPayingFee(fee);
                              setBankTrxRef("");
                            }}
                          >
                            <CreditCard className="mr-1 h-3 w-3" />
                            Record Bank Pay
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-[11px] gap-1 shadow-2xs"
                            onClick={() => setAuditFee(fee)}
                            title="Tamper-proof verified payment. Click to inspect audit trail."
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Paid & Verified</span>
                            <Lock className="h-2.5 w-2.5 opacity-60 text-emerald-600 ml-0.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
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
      )}

      {/* TAB: FACULTY & SECTION PERMISSION ASSIGNMENTS */}
      {activeTab === "faculty" && (
        <div id="faculty" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Faculty Class &amp; Section Permissions
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign specific classes and sections to each teacher. Teachers can only view, grade, and mark attendance for their assigned sections.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
              {teachers.length} Registered {teachers.length === 1 ? "Teacher" : "Teachers"}
            </span>
          </div>

          {teachers.length > 0 ? (
            <div className="space-y-4">
              {teachers.map((teacher) => {
                const draft = teacherAssignDraft[teacher.id] || {
                  grade: schoolClassSectionCombos[0]?.grade || "Grade 9",
                  section: schoolClassSectionCombos[0]?.section || "A",
                };
                const assigned: Array<{ grade: string; section: string }> =
                  Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
                const isSaving = savingTeacherId === teacher.id;

                return (
                  <div
                    key={teacher.id}
                    className="rounded-xl border bg-muted/15 p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {teacher.name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              teacher.role === "coordinator"
                                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {teacher.role === "coordinator"
                              ? "Academic Coordinator"
                              : "Faculty Teacher"}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {teacher.subject}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {teacher.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                        {teacher.role === "coordinator" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={isSaving}
                            onClick={() =>
                              handleToggleFacultyRole(teacher.id, "teacher")
                            }
                            className="h-7 text-[11px] border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                          >
                            Demote to Teacher
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={isSaving}
                            onClick={() =>
                              handleToggleFacultyRole(teacher.id, "coordinator")
                            }
                            className="h-7 text-[11px] border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Promote to Coordinator
                          </Button>
                        )}

                        {teacher.role !== "coordinator" && (
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                              assigned.length > 0
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {assigned.length > 0
                              ? `${assigned.length} ${assigned.length === 1 ? "Section" : "Sections"} Assigned`
                              : "No Sections Assigned"}
                          </span>
                        )}
                      </div>
                    </div>

                    {teacher.role === "coordinator" ? (
                      <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3.5 py-2.5 text-xs text-muted-foreground flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">
                            Dedicated Coordinator Portal Active (coordinator)
                          </span>
                          <p className="text-[11px] mt-0.5">
                            Authorized to record daily faculty attendance &amp; substitutions, schedule class timetables, manage term syllabus tracking, and publish exam date sheets &amp; campus circulars.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>

                    {/* Current Assigned Class + Section Chips */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-foreground block">
                        Authorized Classes &amp; Sections:
                      </span>
                      {assigned.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {assigned.map((item) => (
                            <span
                              key={`${item.grade}-${item.section}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-background text-xs font-semibold text-foreground shadow-2xs"
                            >
                              <span>
                                {item.grade} • Section {item.section}
                              </span>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  const filtered = assigned.filter(
                                    (a) =>
                                      !(
                                        a.grade.toLowerCase() === item.grade.toLowerCase() &&
                                        a.section.toLowerCase() === item.section.toLowerCase()
                                      )
                                  );
                                  saveTeacherAssignments(teacher.id, filtered);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                                title="Remove section permission"
                                aria-label={`Remove ${item.grade} Section ${item.section}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          This teacher currently has no access to student records. Assign at least one class &amp; section below.
                        </p>
                      )}
                    </div>

                    {/* One-Click Quick Assign from School's Existing Enrolled Sections */}
                    {schoolClassSectionCombos.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Quick Assign From Enrolled Sections:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {schoolClassSectionCombos.map((combo) => {
                            const alreadyAssigned = assigned.some(
                              (a) =>
                                a.grade.toLowerCase() === combo.grade.toLowerCase() &&
                                a.section.toLowerCase() === combo.section.toLowerCase()
                            );
                            return (
                              <button
                                key={`${combo.grade}-${combo.section}`}
                                type="button"
                                disabled={isSaving || alreadyAssigned}
                                onClick={() =>
                                  saveTeacherAssignments(teacher.id, [
                                    ...assigned,
                                    { grade: combo.grade, section: combo.section },
                                  ])
                                }
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                  alreadyAssigned
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 cursor-default"
                                    : "bg-background hover:border-primary hover:text-primary"
                                }`}
                              >
                                {alreadyAssigned ? "✓ " : "+ "}
                                {combo.grade} - Sec {combo.section} ({combo.count})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manual Custom Class + Section Assignment Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 items-end text-xs">
                      <div className="sm:col-span-5">
                        <label
                          htmlFor={`assign-grade-${teacher.id}`}
                          className="block text-[11px] font-semibold mb-1 text-foreground"
                        >
                          Class / Grade
                        </label>
                        <CustomSelect
                          value={draft.grade}
                          onChange={(val) =>
                            setTeacherAssignDraft((prev) => ({
                              ...prev,
                              [teacher.id]: { ...draft, grade: val },
                            }))
                          }
                          options={[
                            { value: "Grade 7", label: "Grade 7" },
                            { value: "Grade 8", label: "Grade 8" },
                            { value: "Grade 9", label: "Grade 9" },
                            { value: "Grade 10", label: "Grade 10" },
                            { value: "Grade 11", label: "Grade 11" },
                            { value: "Grade 12", label: "Grade 12" },
                          ]}
                          size="sm"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`assign-section-${teacher.id}`}
                          className="block text-[11px] font-semibold mb-1 text-foreground"
                        >
                          Section Name
                        </label>
                        <input
                          id={`assign-section-${teacher.id}`}
                          name={`assignSection_${teacher.id}`}
                          type="text"
                          autoComplete="off"
                          value={draft.section}
                          onChange={(e) =>
                            setTeacherAssignDraft((prev) => ({
                              ...prev,
                              [teacher.id]: { ...draft, section: e.target.value },
                            }))
                          }
                          placeholder="e.g. A, B, Iqbal, Jinnah"
                          className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSaving || !draft.section.trim()}
                          onClick={() => {
                            const sec = draft.section.trim();
                            if (!sec) return;
                            saveTeacherAssignments(teacher.id, [
                              ...assigned,
                              { grade: draft.grade, section: sec },
                            ]);
                          }}
                          className="w-full h-8.5 text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          {isSaving ? "Saving..." : "Assign Section"}
                        </Button>
                      </div>
                    </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-2">
              <Users className="h-9 w-9 mx-auto text-muted-foreground/30" />
              <p className="font-semibold text-foreground text-sm">
                No Teachers Registered Yet
              </p>
              <p className="max-w-md mx-auto">
                Share your School Join Code{" "}
                {schoolCode ? (
                  <code className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                    {schoolCode}
                  </code>
                ) : null}{" "}
                with your teachers so they can sign up under {institutionName}. Once registered, you can assign specific classes &amp; sections to each teacher here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SAAS SUBSCRIPTION, 14-DAY TRIAL, AUTO-RENEW & BILLING */}
      {activeTab === "subscription" && (
        <div id="subscription" className="scroll-mt-20">
          <SubscriptionManager />
        </div>
      )}

      {/* MODAL 1: STUDENT ADMISSION */}
      {showAdmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAdmissionModal(false)}
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

            <form onSubmit={handleEnrollStudent} className="space-y-3.5 text-xs">
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
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admission-grade" className="font-semibold block mb-1">Grade Level</label>
                  <CustomSelect
                    name="studentGrade"
                    value={newStudent.grade}
                    onChange={(val) => setNewStudent({ ...newStudent, grade: val })}
                    options={[
                      { value: "Grade 7", label: "Grade 7" },
                      { value: "Grade 8", label: "Grade 8" },
                      { value: "Grade 9", label: "Grade 9" },
                      { value: "Grade 10", label: "Grade 10" },
                      { value: "Grade 11", label: "Grade 11" },
                      { value: "Grade 12", label: "Grade 12" },
                    ]}
                  />
                </div>
                <div>
                  <label htmlFor="admission-student-section" className="font-semibold block mb-1">Section</label>
                  <input
                    id="admission-student-section"
                    name="section"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. A, B, Iqbal, Jinnah, Qasim"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admission-guardian-name" className="font-semibold block mb-1">Guardian Name</label>
                <input
                  id="admission-guardian-name"
                  name="guardianName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Tariq Mahmood"
                  value={newStudent.guardianName}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="admission-guardian-phone" className="font-semibold block mb-1">Guardian Phone Contact</label>
                <input
                  id="admission-guardian-phone"
                  name="guardianPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. +92 300 1234567"
                  value={newStudent.guardianPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="admission-monthly-fee" className="font-semibold block mb-1">Monthly Tuition Fee (PKR)</label>
                <input
                  id="admission-monthly-fee"
                  name="monthlyFee"
                  type="number"
                  autoComplete="off"
                  value={newStudent.monthlyFee}
                  onChange={(e) => setNewStudent({ ...newStudent, monthlyFee: Number(e.target.value) })}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAdmissionModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submittingStudent}>
                  {submittingStudent ? "Enrolling..." : "Confirm Admission"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAKISTANI LOCAL BANK PAYMENT */}
      {payingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPayingFee(null)}
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
                Invoice {payingFee.id} • {payingFee.studentName} ({payingFee.rollNumber})
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due:</span>
                  <span className="font-bold text-sm text-foreground">Rs. {Number(payingFee.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Month:</span>
                  <span className="font-medium">{payingFee.month}</span>
                </div>
              </div>

              <div>
                <label htmlFor="admin-bank-channel" className="font-semibold block mb-1.5">Select Pakistani Payment Channel / Bank</label>
                <CustomSelect
                  name="selectedBank"
                  value={selectedBank}
                  onChange={(val) => setSelectedBank(val)}
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
                  onChange={(e) => setBankTrxRef(e.target.value)}
                  className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Optional: If left blank, a verified transaction receipt ID will be auto-generated.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPayingFee(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleConfirmBankPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? "Recording..." : "Confirm & Clear Payment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMMUTABLE AUDIT CERTIFICATE MODAL (ANTI-CORRUPTION & FRAUD PREVENTION) */}
      {auditFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuditFee(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Verified Payment Audit Record</h3>
                <p className="text-xs text-muted-foreground">Immutable financial clearance log</p>
              </div>
            </div>

            {/* Anti-Corruption Security Notice */}
            <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Lock className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-relaxed">
                <span className="font-semibold block">Tamper-Proof Protected:</span>
                This payment has been cleared and verified in institutional accounts. Reverting or downgrading cleared funds to pending is restricted to prevent institutional financial discrepancies.
              </div>
            </div>

            {/* Transaction Record Details */}
            <div className="space-y-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Student Name:</span>
                <span className="font-semibold text-foreground">{auditFee.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Roll Number / Class:</span>
                <span className="font-mono">{auditFee.rollNumber} • {auditFee.grade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Billing Month:</span>
                <span className="font-semibold">{auditFee.month}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Amount Cleared:</span>
                <span className="font-bold text-sm text-emerald-600">Rs. {Number(auditFee.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Payment Channel:</span>
                <span className="font-semibold text-foreground">{auditFee.paymentMethod || "Pakistani Local Bank"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Challan / Trx Ref:</span>
                <span className="font-mono font-bold text-foreground">{auditFee.transactionRef || "TXN-VERIFIED"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Audit Status:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Cleared & Reconciled
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => setAuditFee(null)}
              >
                Close Audit
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                size="sm"
                onClick={() => {
                  handleDownloadPDF(auditFee);
                  setAuditFee(null);
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download Receipt PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
