"use client";

import { useState } from "react";
import { toast } from "sonner";
import { INITIAL_STUDENT_DRAFT } from "@/hooks/use-admin-data";
import type { AdminFee, NewStudentDraft } from "@/components/admin/types";

interface UseAdminModalsParams {
  onSuccessRefresh: () => Promise<void>;
  onResetFilters: () => void;
}

export function useAdminModals({
  onSuccessRefresh,
  onResetFilters,
}: UseAdminModalsParams) {
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState<NewStudentDraft>(INITIAL_STUDENT_DRAFT);
  const [payingFee, setPayingFee] = useState<AdminFee | null>(null);
  const [selectedBank, setSelectedBank] = useState("Meezan Bank Ltd");
  const [bankTrxRef, setBankTrxRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [auditFee, setAuditFee] = useState<AdminFee | null>(null);
  const [showBankSettings, setShowBankSettings] = useState(false);

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
        onResetFilters();
        await onSuccessRefresh();
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
        onResetFilters();
        await onSuccessRefresh();
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch {
      toast.error("Network error while recording bank payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  return {
    showAdmissionModal,
    setShowAdmissionModal,
    submittingStudent,
    newStudent,
    setNewStudent,
    payingFee,
    setPayingFee,
    selectedBank,
    setSelectedBank,
    bankTrxRef,
    setBankTrxRef,
    processingPayment,
    auditFee,
    setAuditFee,
    showBankSettings,
    setShowBankSettings,
    handleEnrollStudent,
    handleConfirmBankPayment,
  };
}
