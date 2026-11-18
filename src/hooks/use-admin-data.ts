"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { toIsoDate } from "@/lib/format";
import type { SchoolBankAccount } from "@/components/parent/types";
import type {
  AdminFee,
  AdminStudent,
  AdminTeacher,
  NewStudentDraft,
  RevenuePoint,
} from "@/components/admin/types";

interface ApiFeeRow {
  _id: string;
  invoiceNumber?: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  amount: number;
  month: string;
  dueDate?: string;
  status: string;
  paymentMethod?: string;
  transactionRef?: string;
}

interface ApiStudentRow {
  _id: string;
  name: string;
  rollNumber: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  status: string;
  monthlyFee: number;
  createdAt?: string;
}

export const INITIAL_STUDENT_DRAFT: NewStudentDraft = {
  name: "",
  grade: "Grade 9",
  section: "A",
  guardianName: "",
  guardianPhone: "",
  monthlyFee: 0,
};

export function useAdminData() {
  const [fees, setFees] = useState<AdminFee[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [bankAccounts, setBankAccounts] = useState<SchoolBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTeacherId, setSavingTeacherId] = useState<string | null>(null);
  const [verifyingFeeId, setVerifyingFeeId] = useState<string | null>(null);

  const fetchLiveDB = useCallback(async () => {
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
          (feesRes.fees as ApiFeeRow[]).map((f) => ({
            id: f.invoiceNumber || f._id,
            mongoId: f._id,
            studentName: f.studentName,
            rollNumber: f.rollNumber,
            grade: f.grade,
            amount: f.amount,
            month: f.month,
            dueDate: f.dueDate ? toIsoDate(f.dueDate) : "N/A",
            status: f.status,
            paymentMethod: f.paymentMethod || "",
            transactionRef: f.transactionRef || "",
          }))
        );
      }
      if (studentsRes?.success && Array.isArray(studentsRes.students)) {
        setStudents(
          (studentsRes.students as ApiStudentRow[]).map((s) => ({
            id: s._id,
            name: s.name,
            rollNumber: s.rollNumber,
            grade: s.grade,
            section: s.section,
            guardian: s.guardianName,
            phone: s.guardianPhone,
            status: s.status,
            monthlyFee: s.monthlyFee,
            createdAt: s.createdAt ? toIsoDate(s.createdAt) : "Active",
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
  }, []);

  useEffect(() => {
    fetchLiveDB();
  }, [fetchLiveDB]);

  const toggleFacultyRole = async (
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

  const verifyOrRejectFee = async (fee: AdminFee, approve: boolean) => {
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

  return {
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
  };
}
