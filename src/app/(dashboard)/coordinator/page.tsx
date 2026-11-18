"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  CalendarCheck,
  Clock,
  BookOpen,
  Bell,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CoordinatorFileUpload } from "@/components/coordinator-file-upload";
import { FacultyAttendanceTab } from "@/components/coordinator/faculty-attendance-tab";
import { SyllabusPlannerTab } from "@/components/coordinator/syllabus-planner-tab";
import {
  CoordinatorTab,
  FacultyMember,
  SyllabusRecord,
} from "@/components/coordinator/types";
import { usePortalTab } from "@/hooks/use-portal-tab";

const COORDINATOR_TABS: readonly CoordinatorTab[] = [
  "teacher-attendance",
  "timetable",
  "syllabus",
  "notices",
];

export default function CoordinatorDashboard() {
  const [activeTab, switchTab] = usePortalTab<CoordinatorTab>(
    COORDINATOR_TABS,
    "teacher-attendance"
  );
  const [coordinatorName, setCoordinatorName] = useState(
    "Academic Coordinator"
  );
  const [institutionName, setInstitutionName] = useState(
    "CampusFlow Institution"
  );

  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusRecord[]>([]);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("campusflow_user_name");
    const savedInst = localStorage.getItem("campusflow_institution");
    if (savedName) setCoordinatorName(savedName);
    if (savedInst) setInstitutionName(savedInst);
  }, []);

  const fetchFaculty = useCallback(async () => {
    setIsLoadingFaculty(true);
    try {
      const res = await fetch("/api/teachers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.teachers)) setFaculty(data.teachers);
    } catch {
      toast.error("Unable to load faculty roster.");
    } finally {
      setIsLoadingFaculty(false);
    }
  }, []);

  const fetchSyllabus = useCallback(async () => {
    setIsLoadingSyllabus(true);
    try {
      const res = await fetch("/api/coordinator/syllabus", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) setSyllabusItems(data.items);
    } catch {
      toast.error("Could not load syllabus tracker.");
    } finally {
      setIsLoadingSyllabus(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
    fetchSyllabus();
  }, [fetchFaculty, fetchSyllabus]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 border border-violet-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Academic Coordinator Desk • {institutionName}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome, {coordinatorName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Manage daily teacher attendance &amp; substitutions, class timetables, term syllabus coverage, and exam date sheets from one centralized desk.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              fetchFaculty();
              fetchSyllabus();
              toast.success("Coordinator desk synchronized.");
            }}
            className="h-9 text-xs shrink-0 self-start lg:self-center"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh Desk
          </Button>
        </div>

        <WorkspaceTabs
          activeTab={activeTab}
          onChange={switchTab}
          className="mt-5 border-border/60 bg-muted/20"
          tabs={[
            {
              id: "teacher-attendance",
              label: "Faculty Attendance",
              shortLabel: "Attendance",
              icon: CalendarCheck,
              badge: faculty.length > 0 ? faculty.length : null,
            },
            {
              id: "timetable",
              label: "Class Timetable",
              shortLabel: "Timetable",
              icon: Clock,
            },
            {
              id: "syllabus",
              label: "Syllabus Planner",
              shortLabel: "Syllabus",
              icon: BookOpen,
              badge: syllabusItems.length > 0 ? syllabusItems.length : null,
            },
            {
              id: "notices",
              label: "Exam Date Sheet",
              shortLabel: "Date Sheet",
              icon: Bell,
            },
          ]}
        />
      </div>

      {activeTab === "teacher-attendance" && (
        <FacultyAttendanceTab
          faculty={faculty}
          isLoadingFaculty={isLoadingFaculty}
        />
      )}

      {activeTab === "timetable" && (
        <CoordinatorFileUpload category="timetable" />
      )}

      {activeTab === "syllabus" && (
        <SyllabusPlannerTab
          faculty={faculty}
          syllabusItems={syllabusItems}
          isLoading={isLoadingSyllabus}
          onRefresh={fetchSyllabus}
          onUpdateLocal={setSyllabusItems}
        />
      )}

      {activeTab === "notices" && (
        <CoordinatorFileUpload category="datesheet" />
      )}
    </div>
  );
}
