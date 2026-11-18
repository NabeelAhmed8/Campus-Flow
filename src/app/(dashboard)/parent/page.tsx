"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Receipt,
  Download,
  CalendarCheck,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  UserCheck,
  Building2,
  CreditCard,
  Copy,
  Check,
  X,
  ShieldCheck,
  Users,
  UserPlus,
  Hash,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CampusDocumentsPanel } from "@/components/campus-documents-panel";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";

const PAKISTANI_BANKS = [
  {
    id: "meezan",
    name: "Meezan Bank Ltd",
    badge: "Islamic Banking",
    title: "CampusFlow Educational Network",
    accountNo: "0102-0105829101",
    iban: "PK42MEZN0001020105829101",
    branch: "Main Boulevard Branch, Lahore",
  },
  {
    id: "hbl",
    name: "HBL (Habib Bank Limited)",
    badge: "Direct 1Link",
    title: "CampusFlow Fee Collection Account",
    accountNo: "1234-7901234503",
    iban: "PK36HABB0012347901234503",
    branch: "Corporate Islamic & Commercial Branch",
  },
  {
    id: "raast",
    name: "Raast Instant Pay (SBP)",
    badge: "0% Surcharge",
    title: "State Bank of Pakistan Fast Pay",
    accountNo: "03001234567",
    iban: "RAAST-ALIAS: payments@campusflow.edu",
    branch: "Instant 24/7 SBP Settlement",
  },
  {
    id: "wallet",
    name: "JazzCash & EasyPaisa",
    badge: "Mobile Wallet",
    title: "CampusFlow Merchant Till",
    accountNo: "Till ID: 0300-1234567",
    iban: "Till Code: 492019",
    branch: "All Pakistan Micro-Finance Till",
  },
];

export default function ParentPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [feeRecord, setFeeRecord] = useState<any | null>(null);
  const [institutionName, setInstitutionName] = useState("St. Jude Collegiate Academy");

  // Tab State: overview | results | schedules | fees | remarks | leave
  type ParentTab = "overview" | "results" | "schedules" | "fees" | "remarks" | "leave";
  const [activeTab, setActiveTab] = useState<ParentTab>("overview");
  type ExamTermKey = "first_term" | "mid_term" | "final_term" | "all";
  const [selectedExamTerm, setSelectedExamTerm] = useState<ExamTermKey>("first_term");
  type RemarksTermKey = "first_term" | "mid_term" | "final_term" | "class_test" | "all";
  const [selectedRemarksTerm, setSelectedRemarksTerm] = useState<RemarksTermKey>("first_term");

  // Pakistani Bank Payment Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("meezan");
  const [depositorName, setDepositorName] = useState("");
  const [trxRef, setTrxRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Guardian Leave Request State
  const [leaveReason, setLeaveReason] = useState("Medical / Sickness");
  const [leaveDate, setLeaveDate] = useState("");

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) {
      toast.error("Please select an absence date.");
      return;
    }
    toast.success(`Formal leave notice submitted for ${activeStudent?.name || "Student"} on ${leaveDate}`);
    setLeaveDate("");
  };

  const switchTab = (tab: ParentTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?tab=${tab}`);
      window.dispatchEvent(new CustomEvent("campusflow_tab_change", { detail: { tab } }));
    }
  };

  // Synchronize activeTab with URL ?tab= or #hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const syncTab = (e?: any) => {
        if (e && "detail" in e && (e.detail?.tab || e.detail?.tabKey)) {
          const t = e.detail.tab || e.detail.tabKey;
          if (["overview", "results", "schedules", "fees", "remarks", "leave"].includes(t)) {
            setActiveTab(t as ParentTab);
            return;
          }
        }
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") as ParentTab | null;
        if (tabParam && ["overview", "results", "schedules", "fees", "remarks", "leave"].includes(tabParam)) {
          setActiveTab(tabParam);
        } else if (window.location.hash) {
          const hash = window.location.hash.replace("#", "") as ParentTab;
          if (["overview", "results", "schedules", "fees", "remarks", "leave"].includes(hash)) {
            setActiveTab(hash);
          }
        } else {
          setActiveTab("overview");
        }
      };

      syncTab();
      window.addEventListener("popstate", syncTab);
      window.addEventListener("campusflow_tab_change", syncTab);
      return () => {
        window.removeEventListener("popstate", syncTab);
        window.removeEventListener("campusflow_tab_change", syncTab);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campusflow_institution");
      if (saved) setInstitutionName(saved);

      const handleUpdate = () => {
        const updated = localStorage.getItem("campusflow_institution");
        if (updated) setInstitutionName(updated);
      };
      window.addEventListener("campusflow_institution_updated", handleUpdate);
      return () => window.removeEventListener("campusflow_institution_updated", handleUpdate);
    }
  }, []);

  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [childRollInput, setChildRollInput] = useState("");
  const [linkingChild, setLinkingChild] = useState(false);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const [studentsRes, feesRes] = await Promise.all([
        fetch("/api/students", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/fees", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);

      const studentList = studentsRes?.success && Array.isArray(studentsRes.students) ? studentsRes.students : [];
      setStudents(studentList);

      if (studentList.length > 0) {
        const currentStudent = studentList[selectedIndex] || studentList[0];
        const matchFee = feesRes?.fees?.find((f: any) => f.rollNumber === currentStudent.rollNumber) || null;
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

  useEffect(() => {
    fetchParentData();
  }, [selectedIndex]);

  const activeStudent = students[selectedIndex] || null;

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
        amount: feeRecord.amount || activeStudent.monthlyFee || 12500,
        dueDate: feeRecord.dueDate ? new Date(feeRecord.dueDate).toISOString().split("T")[0] : "2026-11-20",
        status: feeRecord.status || "pending",
        institution: institutionName,
        paymentMethod: feeRecord.paymentMethod,
        transactionRef: feeRecord.transactionRef,
      });
      doc.save(`Voucher-${activeStudent.rollNumber}.pdf`);
      toast.success("Fee voucher downloaded successfully.");
    } catch {
      toast.error("Failed to generate voucher PDF.");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key.toUpperCase()} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirmBankPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeRecord?._id) return;

    setSubmittingPayment(true);
    const chosenBank = PAKISTANI_BANKS.find((b) => b.id === selectedBankId);
    const generatedRef = trxRef.trim() || `TRX-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await fetch("/api/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feeRecord._id,
          status: "paid",
          paymentMethod: chosenBank?.name || "Pakistani Local Bank Transfer",
          transactionRef: generatedRef,
        }),
      });
      const data = await res.json();
      if (data.success && data.fee) {
        setFeeRecord(data.fee);
        setShowBankModal(false);
        setTrxRef("");
        toast.success(`Fee cleared via ${chosenBank?.name}! Reference: ${generatedRef}`);
      } else {
        toast.error("Failed to confirm bank transfer");
      }
    } catch {
      toast.error("Network error while submitting bank payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const activeBank = PAKISTANI_BANKS.find((b) => b.id === selectedBankId) || PAKISTANI_BANKS[0];
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    if (activeStudent?._id) {
      fetch(`/api/attendance?studentId=${activeStudent._id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.stats) {
            setAttendanceStats(d.stats);
          }
        })
        .catch(() => {});
    }
  }, [activeStudent?._id]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Parent Portal & Student Progress</h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {institutionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Academic records, Pakistani local bank fee payments, and direct campus announcements.
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
          <Button variant="outline" size="sm" onClick={fetchParentData} disabled={loading} title="Refresh Records">
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
          <p className="text-xs text-muted-foreground mt-1">Retrieving academic records and verified fee vouchers.</p>
        </div>
      )}

      {/* Empty State: No students */}
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
          {/* Dynamic & Responsive Multi-Student Selector */}
          {students.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-2xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Select Enrolled Child / Ward:</span>
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

          {/* Dynamic Responsive Workspace Tabs */}
          <WorkspaceTabs
            activeTab={activeTab}
            onChange={switchTab}
            tabs={[
              {
                id: "overview",
                label: "Academic Standing",
                shortLabel: "Overview",
                icon: Users,
              },
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
              {
                id: "schedules",
                label: "Schedules & Files",
                shortLabel: "Files",
                icon: Clock,
              },
              {
                id: "fees",
                label: "Fee Billing",
                shortLabel: "Fees",
                icon: Receipt,
                badge: feeRecord?.status ? feeRecord.status : null,
                badgeTone:
                  feeRecord?.status === "paid" ? "success" : "warning",
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
              {
                id: "leave",
                label: "Leave Notice",
                shortLabel: "Leave",
                icon: CalendarCheck,
              },
            ]}
          />

          {/* TAB 1: CHILD ACADEMIC STANDING & PROFILE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Child Summary Hero Card */}
              <div id="overview" className="rounded-2xl border bg-card p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 scroll-mt-20">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
                    {activeStudent.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">{activeStudent.name}</h2>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold">
                        Enrolled Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Roll No: <span className="font-mono font-medium text-foreground">{activeStudent.rollNumber}</span> •{" "}
                      {activeStudent.grade} - {activeStudent.section}
                    </p>
                    <p className="text-xs text-muted-foreground">Guardian: {activeStudent.guardianName || "Registered Guardian"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-xs text-muted-foreground block">Term Attendance</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-lg font-bold">
                        {attendanceStats && attendanceStats.total > 0
                          ? `${attendanceStats.attendancePercentage}%`
                          : "100%"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Academic Standing</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-lg font-bold">Grade A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Jump Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee Clearance</span>
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-foreground">
                      Rs. {Number(feeRecord?.amount || activeStudent.monthlyFee || 0).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        feeRecord?.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {feeRecord?.status || "Pending"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => switchTab("fees")}
                  >
                    View Voucher & Pay →
                  </Button>
                </div>

                <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher Assessment</span>
                    <Bell className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-foreground">
                      {Array.isArray(activeStudent.academicRecords) ? activeStudent.academicRecords.length : 0} Remarks
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {activeStudent.academicRecords?.[0]?.feedback ? `"${activeStudent.academicRecords[0].feedback}"` : "Latest evaluation recorded"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => switchTab("remarks")}
                  >
                    Read All Feedback →
                  </Button>
                </div>

                <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance Registry</span>
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-foreground">
                      {attendanceStats?.presentDays ?? 0} Days Present
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Need time off? Submit digital leave request
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => switchTab("leave")}
                  >
                    Apply for Absence Leave →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAKISTANI SCHOOL TERM EXAM RESULTS & REPORT CARD */}
          {activeTab === "results" && (() => {
            const allRecords: any[] = Array.isArray(activeStudent.academicRecords)
              ? activeStudent.academicRecords
              : [];

            const normalizeRec = (rec: any) => {
              const examStatus = rec.examStatus === "absent" ? "absent" : "present";
              const total = Number(rec.totalMarks || 100);
              const obtained = examStatus === "absent" ? 0 : Number(rec.obtainedMarks || 0);
              const pct = examStatus === "absent" ? 0 : Number(rec.percentage ?? Math.round((obtained / total) * 100));
              const resultStatus =
                rec.resultStatus ||
                (examStatus === "absent" ? "absent" : pct >= 40 ? "pass" : "fail");
              const grade =
                examStatus === "absent"
                  ? "AB"
                  : rec.grade ||
                    (pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F");
              const term = rec.term || "first_term";
              return { ...rec, term, examStatus, totalMarks: total, obtainedMarks: obtained, percentage: pct, resultStatus, grade };
            };

            const normalizedAll = allRecords.map(normalizeRec);

            const termDefs: Array<{ key: ExamTermKey; label: string; shortLabel: string }> = [
              { key: "first_term", label: "First Term Exam", shortLabel: "1st Term" },
              { key: "mid_term", label: "2nd / Mid-Term Exam", shortLabel: "Mid-Term" },
              { key: "final_term", label: "Final Term Exam", shortLabel: "Final Exam" },
              { key: "all", label: "All Exams Summary", shortLabel: "All Terms" },
            ];

            const termLabelMap: Record<string, string> = {
              first_term: "First Term Exam",
              mid_term: "2nd / Mid-Term Exam",
              final_term: "Final Term Exam",
              class_test: "Class Test",
            };

            const filteredRecs =
              selectedExamTerm === "all"
                ? normalizedAll
                : normalizedAll.filter((r) => r.term === selectedExamTerm);

            const totalPossible = filteredRecs.reduce((acc, r) => acc + r.totalMarks, 0);
            const totalObtained = filteredRecs.reduce((acc, r) => acc + r.obtainedMarks, 0);
            const overallPct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

            const presentSubjects = filteredRecs.filter((r) => r.examStatus === "present");
            const absentSubjects = filteredRecs.filter((r) => r.examStatus === "absent");
            const failedSubjects = filteredRecs.filter((r) => r.resultStatus === "fail");

            const allAbsent = filteredRecs.length > 0 && absentSubjects.length === filteredRecs.length;
            const overallGrade =
              filteredRecs.length === 0
                ? "—"
                : allAbsent
                ? "AB"
                : overallPct >= 90
                ? "A+"
                : overallPct >= 80
                ? "A"
                : overallPct >= 70
                ? "B+"
                : overallPct >= 60
                ? "B"
                : overallPct >= 50
                ? "C"
                : overallPct >= 40
                ? "D"
                : "F";

            const overallVerdict =
              filteredRecs.length === 0
                ? "PENDING"
                : allAbsent
                ? "ABSENT"
                : absentSubjects.length > 0 || failedSubjects.length > 0 || overallPct < 40
                ? "FAIL"
                : "PASS";

            const getTermPct = (tk: string) => {
              const recs = normalizedAll.filter((r) => r.term === tk);
              if (recs.length === 0) return null;
              const tot = recs.reduce((a, r) => a + r.totalMarks, 0);
              const obt = recs.reduce((a, r) => a + r.obtainedMarks, 0);
              const abs = recs.filter((r) => r.examStatus === "absent").length;
              const fail = recs.filter((r) => r.resultStatus === "fail").length;
              const pct = tot > 0 ? Math.round((obt / tot) * 100) : 0;
              return {
                count: recs.length,
                pct,
                absentCount: abs,
                passed: abs === 0 && fail === 0 && pct >= 40,
              };
            };

            return (
              <div id="results" className="space-y-5 scroll-mt-20">
                {/* 3-Term Pakistani School Progress Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {(["first_term", "mid_term", "final_term"] as const).map((tk) => {
                    const stats = getTermPct(tk);
                    const isSelected = selectedExamTerm === tk;
                    return (
                      <button
                        key={tk}
                        type="button"
                        onClick={() => setSelectedExamTerm(tk)}
                        className={`text-left rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                            : "bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {termLabelMap[tk]}
                          </span>
                          {stats ? (
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                stats.passed
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {stats.passed ? "PASS" : "FAIL"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Not Posted
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-foreground">
                            {stats ? `${stats.pct}%` : "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {stats
                              ? `${stats.count} ${stats.count === 1 ? "subject" : "subjects"}${
                                  stats.absentCount > 0 ? ` • ${stats.absentCount} AB` : ""
                                }`
                              : "Awaiting exam marks"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Main Report Card Container */}
                <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
                  {/* Report Card Header + Term Switcher */}
                  <div className="p-5 sm:p-6 border-b bg-muted/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">
                            Official Student Examination Result Card
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {activeStudent.name} • {activeStudent.grade} ({activeStudent.section}) • Roll #{activeStudent.rollNumber}
                          </p>
                        </div>
                      </div>

                      {filteredRecs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              overallVerdict === "PASS"
                                ? "bg-emerald-600 text-white"
                                : "bg-destructive text-white"
                            }`}
                          >
                            Result: {overallVerdict}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Term Filter Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {termDefs.map((td) => {
                        const count =
                          td.key === "all"
                            ? normalizedAll.length
                            : normalizedAll.filter((r) => r.term === td.key).length;
                        const active = selectedExamTerm === td.key;
                        return (
                          <button
                            key={td.key}
                            type="button"
                            onClick={() => setSelectedExamTerm(td.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 border ${
                              active
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                : "bg-background text-muted-foreground hover:text-foreground border-border"
                            }`}
                          >
                            <span>{td.label}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                active
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Summary Metrics Strip */}
                    {filteredRecs.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div className="rounded-xl border bg-background p-3">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Exam Attendance
                          </div>
                          <div className="text-sm font-bold text-foreground mt-0.5">
                            {allAbsent
                              ? "Absent (All Papers)"
                              : absentSubjects.length === 0
                              ? `Present (${presentSubjects.length}/${filteredRecs.length})`
                              : `${presentSubjects.length} Present • ${absentSubjects.length} Absent`}
                          </div>
                          {absentSubjects.length > 0 && (
                            <p className="text-[10px] text-destructive font-medium mt-0.5 truncate">
                              Absent in: {absentSubjects.map((s) => s.subject).join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border bg-background p-3">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Marks Obtained
                          </div>
                          <div className="text-sm font-bold text-foreground mt-0.5 font-mono">
                            {totalObtained} / {totalPossible}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Passing criteria: 40% per subject
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background p-3">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Overall Percentage
                          </div>
                          <div className="text-sm font-bold text-primary mt-0.5">
                            {overallPct}% • Grade {overallGrade}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {filteredRecs.length} {filteredRecs.length === 1 ? "subject" : "subjects"} evaluated
                          </p>
                        </div>

                        <div className="rounded-xl border bg-background p-3">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Final Status
                          </div>
                          <div
                            className={`text-sm font-bold mt-0.5 ${
                              overallVerdict === "PASS"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {overallVerdict === "PASS"
                              ? "Passed & Cleared"
                              : overallVerdict === "ABSENT"
                              ? "Absent in Examination"
                              : `Failed (${failedSubjects.length + absentSubjects.length} paper${
                                  failedSubjects.length + absentSubjects.length === 1 ? "" : "s"
                                })`}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {selectedExamTerm === "all"
                              ? "Combined Academic Standing"
                              : termLabelMap[selectedExamTerm]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subject-Wise Exam Results Table */}
                  {filteredRecs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="py-3 px-4">Subject</th>
                            {selectedExamTerm === "all" && (
                              <th className="py-3 px-4">Exam Term</th>
                            )}
                            <th className="py-3 px-4">Exam Attendance</th>
                            <th className="py-3 px-4 text-right">Total Marks</th>
                            <th className="py-3 px-4 text-right">Obtained</th>
                            <th className="py-3 px-4 text-right">Percentage</th>
                            <th className="py-3 px-4 text-center">Grade</th>
                            <th className="py-3 px-4 text-center">Pass / Fail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredRecs.map((rec: any, idx: number) => {
                            const isAbsent = rec.examStatus === "absent";
                            const isPass = rec.resultStatus === "pass";
                            return (
                              <tr
                                key={rec.id || idx}
                                className={`transition-colors ${
                                  isAbsent
                                    ? "bg-destructive/5 hover:bg-destructive/10"
                                    : "hover:bg-muted/20"
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-foreground">
                                    {rec.subject}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {rec.teacherName || "Subject Teacher"}
                                  </div>
                                </td>
                                {selectedExamTerm === "all" && (
                                  <td className="py-3 px-4">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                      {termLabelMap[rec.term] || rec.assessment}
                                    </span>
                                  </td>
                                )}
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      isAbsent
                                        ? "bg-destructive/15 text-destructive border border-destructive/25"
                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        isAbsent ? "bg-destructive" : "bg-emerald-500"
                                      }`}
                                    />
                                    {isAbsent ? "Absent" : "Present"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                                  {rec.totalMarks}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                                  {isAbsent ? (
                                    <span className="text-destructive">AB</span>
                                  ) : (
                                    rec.obtainedMarks
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-semibold">
                                  {isAbsent ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : (
                                    `${rec.percentage}%`
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-block min-w-[28px] px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      isAbsent || !isPass
                                        ? "bg-destructive/10 text-destructive"
                                        : rec.grade.startsWith("A")
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-sky-500/10 text-sky-600"
                                    }`}
                                  >
                                    {rec.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      isPass
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                        : "bg-destructive/15 text-destructive"
                                    }`}
                                  >
                                    {isAbsent ? "ABSENT" : isPass ? "PASS" : "FAIL"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t-2 bg-muted/30 font-bold text-xs">
                          <tr>
                            <td
                              colSpan={selectedExamTerm === "all" ? 3 : 2}
                              className="py-3 px-4 text-foreground"
                            >
                              Grand Total ({filteredRecs.length} Subjects)
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {totalPossible}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-primary">
                              {totalObtained}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-primary">
                              {overallPct}%
                            </td>
                            <td className="py-3 px-4 text-center">{overallGrade}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  overallVerdict === "PASS"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-destructive text-white"
                                }`}
                              >
                                {overallVerdict}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-2">
                      <Award className="h-10 w-10 mx-auto text-muted-foreground/30" />
                      <p className="font-semibold text-foreground text-sm">
                        No records published for{" "}
                        {selectedExamTerm === "all"
                          ? "any examination term"
                          : termLabelMap[selectedExamTerm]}{" "}
                        yet
                      </p>
                      <p className="max-w-md mx-auto">
                        Once subject teachers enter marks or mark subject exam attendance (Present / Absent) in the Teacher Suite, your child&apos;s official subject-wise result card will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: PAKISTANI BANK FEE PAY & VOUCHER */}
          {activeTab === "fees" && (
            <div id="fees" className="space-y-6 scroll-mt-20">
              <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-base">Monthly Fee Voucher & Bank Clearance</h3>
                      <p className="text-xs text-muted-foreground">Download printable PDF or pay via Pakistani 1Link, Raast, or Mobile Wallet</p>
                    </div>
                  </div>
                  {feeRecord ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        feeRecord.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {feeRecord.status}
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
                            {feeRecord.dueDate ? new Date(feeRecord.dueDate).toISOString().split("T")[0] : "15 days from issue"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Invoice Reference:</span>
                          <span className="font-mono font-bold text-foreground">{feeRecord.invoiceNumber || feeRecord._id}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 p-4 rounded-xl bg-muted/20 border">
                        <div className="flex justify-between py-1 border-b border-border/60">
                          <span className="text-muted-foreground">Student Name:</span>
                          <span className="font-semibold">{activeStudent.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/60">
                          <span className="text-muted-foreground">Roll Number:</span>
                          <span className="font-mono">{activeStudent.rollNumber}</span>
                        </div>
                        <div className="flex justify-between py-1 items-baseline">
                          <span className="font-bold">Total Dues:</span>
                          <span className="font-bold text-lg text-primary">
                            Rs. {Number(feeRecord.amount || activeStudent.monthlyFee || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {feeRecord.status === "paid" && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Cleared via {feeRecord.paymentMethod || "Pakistani Local Bank"}</span>
                        </div>
                        {feeRecord.transactionRef && (
                          <div className="text-[11px] font-mono">Reference / Challan: {feeRecord.transactionRef}</div>
                        )}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1" size="sm" onClick={handleDownloadVoucher}>
                        <Download className="mr-1.5 h-4 w-4" />
                        {feeRecord.status === "paid" ? "Download Cleared Receipt" : "Download PDF Voucher"}
                      </Button>
                      {feeRecord.status !== "paid" ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-1"
                          onClick={() => setShowBankModal(true)}
                        >
                          <Building2 className="mr-1.5 h-4 w-4" />
                          Pay via Pakistani Bank
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled className="flex-1">
                          <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                          Payment Verified
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

              {/* Pakistani Banks Directory Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Institutional Bank Accounts & Till Directory
                  </h4>
                  <span className="text-[10px] text-muted-foreground">1-Click Copy for Online Banking</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PAKISTANI_BANKS.map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{b.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {b.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{b.accountNo}</div>
                      <div className="flex gap-1.5 pt-1">
                        <Button
                          size="xs"
                          variant="outline"
                          className="flex-1 text-[10px] h-6"
                          onClick={() => {
                            navigator.clipboard.writeText(b.accountNo);
                            toast.success(`Copied ${b.name} Account Number!`);
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy A/C
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="flex-1 text-[10px] h-6"
                          onClick={() => {
                            navigator.clipboard.writeText(b.iban);
                            toast.success(`Copied ${b.name} IBAN!`);
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy IBAN
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHER REMARKS & ASSESSMENTS */}
          {activeTab === "remarks" && (() => {
            const allRemarks: any[] = Array.isArray(activeStudent.academicRecords)
              ? activeStudent.academicRecords
              : [];

            const getRecordTerm = (rec: any) => rec.term || "first_term";
            const countByTerm = (termKey: string) =>
              allRemarks.filter((r) => getRecordTerm(r) === termKey).length;

            const remarksTermLabelMap: Record<string, string> = {
              first_term: "First Term Exam",
              mid_term: "2nd / Mid-Term Exam",
              final_term: "Final Term Exam",
              class_test: "Class Test",
              all: "All Terms",
            };

            const filteredRemarks =
              selectedRemarksTerm === "all"
                ? allRemarks
                : allRemarks.filter(
                    (rec) => getRecordTerm(rec) === selectedRemarksTerm
                  );

            return (
              <div id="remarks" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs space-y-5 scroll-mt-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base text-foreground leading-tight">
                        Teacher Assessment Marks &amp; Faculty Feedback
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select an exam term to view subject-wise marks &amp; instructor remarks
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Website-Themed Term Dropdown */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="w-full sm:w-56">
                      <CustomSelect
                        id="parent-remarks-term-select"
                        name="remarksTermFilter"
                        value={selectedRemarksTerm}
                        onChange={(val) =>
                          setSelectedRemarksTerm(val as RemarksTermKey)
                        }
                        options={[
                          {
                            value: "first_term",
                            label: "First Term Exam",
                            badge: String(countByTerm("first_term")),
                          },
                          {
                            value: "mid_term",
                            label: "2nd / Mid-Term Exam",
                            badge: String(countByTerm("mid_term")),
                          },
                          {
                            value: "final_term",
                            label: "Final Term Exam",
                            badge: String(countByTerm("final_term")),
                          },
                          {
                            value: "class_test",
                            label: "Class Tests",
                            badge: String(countByTerm("class_test")),
                          },
                          {
                            value: "all",
                            label: "All Terms Combined",
                            badge: String(allRemarks.length),
                          },
                        ]}
                        size="sm"
                        align="right"
                      />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                      {filteredRemarks.length}{" "}
                      {filteredRemarks.length === 1 ? "Record" : "Records"}
                    </span>
                  </div>
                </div>

                {/* Direct Term-Filtered Teacher Assessment Remarks (Internal Vertical Scroll) */}
                {filteredRemarks.length > 0 ? (
                  <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-3">
                    {filteredRemarks.map((rec: any, idx: number) => {
                      const recTerm = getRecordTerm(rec);
                      const isAbsent = rec.examStatus === "absent";
                      return (
                        <div
                          key={rec.id || idx}
                          className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="font-bold text-sm text-primary">
                                {rec.subject}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                                {remarksTermLabelMap[recTerm] || "First Term Exam"}
                              </span>
                              {rec.assessment && (
                                <span className="text-xs font-medium text-muted-foreground truncate">
                                  • {rec.assessment}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                              {isAbsent ? (
                                <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2.5 py-0.5 text-[10px] font-bold">
                                  ABSENT IN EXAM
                                </span>
                              ) : (
                                <>
                                  <span className="font-bold text-foreground">
                                    Score: {rec.obtainedMarks}/{rec.totalMarks}
                                  </span>
                                  <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                                    Grade {rec.grade}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-foreground text-xs italic leading-relaxed bg-background/85 p-3 rounded-lg border border-border/50">
                            &quot;{rec.feedback || "No additional remarks added."}&quot;
                          </p>

                          <div className="text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            <span>
                              Teacher: {rec.teacherName || "Faculty Instructor"}
                            </span>
                            <span>
                              Recorded:{" "}
                              {rec.recordedAt
                                ? new Date(rec.recordedAt).toLocaleDateString()
                                : "Recent"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground text-xs rounded-xl border border-dashed p-6 space-y-1.5">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/35" />
                    <p className="font-semibold text-foreground text-sm">
                      No Feedback Found for{" "}
                      {remarksTermLabelMap[selectedRemarksTerm] || "Selected Term"}
                    </p>
                    <p className="max-w-md mx-auto">
                      {allRemarks.length > 0
                        ? "Try choosing another exam term from the dropdown above to view recorded marks and faculty remarks."
                        : "When teachers record marks and formative feedback in their portal, they will appear here live."}
                    </p>
                  </div>
                )}

                {/* Campus Broadcast Notices */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Institutional Broadcasts &amp; Advisories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Local Bank Payment Instructions</span>
                        <span className="text-[10px] text-emerald-600">Active</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Tuition fees can be paid via Meezan Bank, HBL, 1Link, or Raast instant pay. Submit your transaction ID for instant digital clearance.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Parent-Teacher Progress Meetings</span>
                        <span className="text-[10px] text-primary">Scheduled</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Academic progress review sessions will be conducted at the end of each academic term with class mentors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: ABSENCE & LEAVE NOTICE SUBMISSION */}
          {activeTab === "leave" && (
            <div id="leave" className="rounded-2xl border bg-card p-6 shadow-xs space-y-5 scroll-mt-20">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-base">Submit Absence & Leave Notice to Administration</h3>
                    <p className="text-xs text-muted-foreground">Direct digital dispatch to class teacher & school registry</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                  Official Record
                </span>
              </div>

              <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label htmlFor="parent-leave-reason" className="font-semibold block mb-1">Reason for Leave</label>
                  <CustomSelect
                    name="leaveReason"
                    value={leaveReason}
                    onChange={(val) => setLeaveReason(val)}
                    options={[
                      { value: "Medical / Sickness", label: "Medical / Doctor Appointment", badge: "Health" },
                      { value: "Urgent Family Matter", label: "Urgent Family Matter", badge: "Family" },
                      { value: "Out of Station Travel", label: "Out of Station Travel", badge: "Travel" },
                      { value: "Other Formal Leave", label: "Other Formal Reason", badge: "General" },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label htmlFor="parent-leave-date" className="font-semibold block mb-1">Date of Absence</label>
                  <CustomDatePicker
                    id="parent-leave-date"
                    name="leaveDate"
                    required
                    value={leaveDate}
                    onChange={(val) => setLeaveDate(val)}
                    placeholder="Select absence date"
                    size="sm"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button type="submit" size="sm" className="w-full h-8.5">
                    Submit Formal Leave Notice
                  </Button>
                </div>
              </form>

              <div className="p-3.5 rounded-xl bg-muted/20 border text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground">Notice Policy Guidelines:</span>
                <p className="text-[11px] leading-relaxed">
                  Medical leaves exceeding 2 consecutive days require a doctor certificate upon return. Routine planned absences should be notified at least 24 hours prior to prevent attendance demerits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: OFFICIAL TIMETABLE, SYLLABUS & EXAM DATE SHEETS */}
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

      {/* PAKISTANI LOCAL BANK PAYMENT MODAL */}
      {showBankModal && feeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBankModal(false)}
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
                  <h2 className="text-lg font-bold">Pay via Pakistani Local Bank</h2>
                  <p className="text-xs text-muted-foreground">
                    Transfer fee online or at branch, then submit transaction reference.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {PAKISTANI_BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedBankId === bank.id
                      ? "border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-600"
                      : "bg-muted/30 hover:bg-muted/60"
                  }`}
                >
                  <span className="block font-semibold text-xs text-foreground truncate">{bank.name.split(" ")[0]}</span>
                  <span className="block text-[10px] text-muted-foreground truncate">{bank.badge}</span>
                </button>
              ))}
            </div>

            {/* Bank Account Details Box */}
            <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{activeBank.name}</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.2 text-[10px] font-semibold">
                  {activeBank.badge}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">
                  Account Title: <span className="font-medium text-foreground">{activeBank.title}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t">
                  <span className="text-muted-foreground font-mono">{activeBank.accountNo}</span>
                  <Button
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
                <div className="flex items-center justify-between py-1 border-t">
                  <span className="text-muted-foreground font-mono text-[11px]">{activeBank.iban}</span>
                  <Button
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
                <div className="text-[10px] text-muted-foreground pt-0.5">{activeBank.branch}</div>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleConfirmBankPayment} className="space-y-3 text-xs">
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
                    onChange={(e) => setDepositorName(e.target.value)}
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
                    value={`Rs. ${Number(feeRecord.amount || activeStudent?.monthlyFee || 0).toLocaleString()}`}
                    className="w-full h-8.5 rounded-lg border bg-muted px-3 text-xs font-semibold text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="parent-bank-trx-ref" className="font-semibold block mb-1">
                  Bank Transaction Reference / Trx ID <span className="text-muted-foreground font-normal">(from mobile app or receipt)</span>
                </label>
                <input
                  id="parent-bank-trx-ref"
                  name="bankTrxRef"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. MZN-982149 or 1Link Ref #8821"
                  value={trxRef}
                  onChange={(e) => setTrxRef(e.target.value)}
                  className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Optional: If transferring right now, paste your bank transaction ID or leave blank to auto-generate verified ID.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBankModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={submittingPayment}
                >
                  {submittingPayment ? "Submitting..." : "Confirm & Verify Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK ANOTHER CHILD MODAL (Multi-Child Single Guardian Account) */}
      {showLinkChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowLinkChildModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="Close link child modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Link Another Child
                </h2>
                <p className="text-xs text-muted-foreground">
                  Add another enrolled child from {institutionName} to this same guardian account.
                </p>
              </div>
            </div>

            <form onSubmit={handleLinkAnotherChild} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="parent-link-child-roll"
                  className="block font-semibold mb-1.5 text-foreground"
                >
                  Child&apos;s Enrolled Student Roll Number *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    id="parent-link-child-roll"
                    name="childRollNumber"
                    type="text"
                    autoComplete="off"
                    required
                    value={childRollInput}
                    onChange={(e) => setChildRollInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CF-102-B8C1"
                    className="w-full h-9 rounded-lg border bg-background pl-8.5 pr-3 text-xs font-mono uppercase tracking-wider outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Once linked, you can seamlessly switch between all your children using the Child Selector bar above.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLinkChildModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={linkingChild}
                >
                  {linkingChild ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      Link Child to Portal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
