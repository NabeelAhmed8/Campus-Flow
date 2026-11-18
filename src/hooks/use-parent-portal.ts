"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { generateFeeVoucherPDF } from "@/lib/pdf-generator";
import { useClientAuth } from "@/hooks/use-client-auth";
import { toIsoDate } from "@/lib/format";
import type { SchoolBankAccount } from "@/components/parent/types";
import type {
  AttendanceStatsRecord,
  FeeDomainRecord,
  StudentDomainRecord,
} from "@/lib/domain-types";

export function useParentPortal() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentDomainRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [feeRecord, setFeeRecord] = useState<FeeDomainRecord | null>(null);
  const [bankAccounts, setBankAccounts] = useState<SchoolBankAccount[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatsRecord | null>(null);
  const { institution: institutionName } = useClientAuth();

  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [customChannel, setCustomChannel] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [trxRef, setTrxRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [childRollInput, setChildRollInput] = useState("");
  const [linkingChild, setLinkingChild] = useState(false);

  const fetchParentData = useCallback(async () => {
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

      const studentList: StudentDomainRecord[] =
        studentsRes?.success && Array.isArray(studentsRes.students) ? studentsRes.students : [];
      setStudents(studentList);

      if (studentList.length > 0) {
        const currentStudent = studentList[selectedIndex] || studentList[0];
        const feeList: FeeDomainRecord[] = Array.isArray(feesRes?.fees) ? feesRes.fees : [];
        const matchFee =
          feeList.find((f) => f.rollNumber === currentStudent.rollNumber) || null;
        setFeeRecord(matchFee);
        if (currentStudent.guardianName || currentStudent.guardian) {
          setDepositorName(currentStudent.guardianName || currentStudent.guardian || "");
        }
      } else {
        setFeeRecord(null);
      }
    } catch {
      toast.error("Failed to load student records");
    } finally {
      setLoading(false);
    }
  }, [selectedBankId, selectedIndex]);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  const activeStudent = students[selectedIndex] || null;

  useEffect(() => {
    if (!activeStudent?._id) return;
    fetch(`/api/attendance?studentId=${activeStudent._id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.stats) setAttendanceStats(d.stats);
      })
      .catch(() => {});
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
        dueDate: feeRecord.dueDate ? toIsoDate(feeRecord.dueDate) : "N/A",
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

  return {
    loading,
    students,
    selectedIndex,
    setSelectedIndex,
    activeStudent,
    feeRecord,
    bankAccounts,
    attendanceStats,
    institutionName,
    fetchParentData,
    showBankModal,
    setShowBankModal,
    selectedBankId,
    setSelectedBankId,
    customChannel,
    setCustomChannel,
    depositorName,
    setDepositorName,
    trxRef,
    setTrxRef,
    submittingPayment,
    showLinkChildModal,
    setShowLinkChildModal,
    childRollInput,
    setChildRollInput,
    linkingChild,
    handleLinkAnotherChild,
    handleDownloadVoucher,
    handleSubmitBankProof,
  };
}
