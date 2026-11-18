"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { GRADE_OPTIONS } from "@/lib/constants";
import type { NewStudentDraft } from "./types";

interface AdmissionModalProps {
  open: boolean;
  institutionName: string;
  draft: NewStudentDraft;
  submitting: boolean;
  onChange: (next: NewStudentDraft) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function StudentAdmissionModal({
  open,
  institutionName,
  draft,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: AdmissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
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

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
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
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="admission-grade" className="font-semibold block mb-1">
                Grade Level
              </label>
              <CustomSelect
                name="studentGrade"
                value={draft.grade}
                onChange={(val) => onChange({ ...draft, grade: val })}
                options={[...GRADE_OPTIONS]}
              />
            </div>
            <div>
              <label htmlFor="admission-student-section" className="font-semibold block mb-1">
                Section
              </label>
              <input
                id="admission-student-section"
                name="section"
                type="text"
                autoComplete="off"
                placeholder="e.g. A, B, Iqbal, Jinnah, Qasim"
                value={draft.section}
                onChange={(e) => onChange({ ...draft, section: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admission-guardian-name" className="font-semibold block mb-1">
              Guardian Name
            </label>
            <input
              id="admission-guardian-name"
              name="guardianName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Tariq Mahmood"
              value={draft.guardianName}
              onChange={(e) => onChange({ ...draft, guardianName: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="admission-guardian-phone" className="font-semibold block mb-1">
              Guardian Phone Contact
            </label>
            <input
              id="admission-guardian-phone"
              name="guardianPhone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +92 300 1234567"
              value={draft.guardianPhone}
              onChange={(e) => onChange({ ...draft, guardianPhone: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="admission-monthly-fee" className="font-semibold block mb-1">
              Monthly Tuition Fee (PKR)
            </label>
            <input
              id="admission-monthly-fee"
              name="monthlyFee"
              type="number"
              autoComplete="off"
              value={draft.monthlyFee}
              onChange={(e) => onChange({ ...draft, monthlyFee: Number(e.target.value) })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Enrolling..." : "Confirm Admission"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
