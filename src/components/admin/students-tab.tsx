"use client";

import { Users, Search, UserPlus, CheckCircle2, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import type { AdminFee, AdminStudent } from "./types";

interface StudentsTabProps {
  students: AdminStudent[];
  fees: AdminFee[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (val: string) => void;
  gradeOptions: Array<{ value: string; label: string; badge?: string }>;
  onOpenAdmission: () => void;
  onDownloadPDF: (fee: AdminFee) => void;
}

export function StudentsTab({
  students,
  fees,
  searchTerm,
  onSearchChange,
  gradeFilter,
  onGradeFilterChange,
  gradeOptions,
  onOpenAdmission,
  onDownloadPDF,
}: StudentsTabProps) {
  return (
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8.5 w-52 rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="w-44 min-w-[150px]">
            <CustomSelect
              value={gradeFilter}
              onChange={onGradeFilterChange}
              options={gradeOptions}
              size="sm"
            />
          </div>

          <Button size="sm" onClick={onOpenAdmission}>
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
            {students.length > 0 ? (
              students.map((st) => {
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
                      Rs. {Number(st.monthlyFee ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {studentFee ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isPaid
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
                          onClick={() => onDownloadPDF(studentFee)}
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
  );
}
