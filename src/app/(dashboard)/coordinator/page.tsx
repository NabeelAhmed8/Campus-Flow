"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  CalendarCheck,
  Clock,
  BookOpen,
  Bell,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  UserCheck,
  FileText,
  Sparkles,
  Check,
  MapPin,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { CoordinatorFileUpload } from "@/components/coordinator-file-upload";

type CoordinatorTab = "teacher-attendance" | "timetable" | "syllabus" | "notices";
type FacultyStatus = "present" | "absent" | "late" | "leave";
type SyllabusStatus = "pending" | "in_progress" | "completed";
type SyllabusTerm = "first_term" | "mid_term" | "final_term";
type NoticeType = "datesheet" | "circular" | "substitution" | "ptm";
type NoticeAudience = "all" | "teachers" | "parents" | "students";

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "coordinator";
  subject: string;
  assignedClasses: Array<{ grade: string; section: string }>;
}

interface AttendanceDraft {
  status: FacultyStatus;
  substituteTeacher: string;
  remarks: string;
  saved?: boolean;
}

interface TimetableRecord {
  _id: string;
  grade: string;
  section: string;
  day: string;
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  room: string;
}

interface SyllabusRecord {
  _id: string;
  grade: string;
  term: SyllabusTerm;
  subject: string;
  chapterTitle: string;
  topics: string;
  targetDate: string;
  status: SyllabusStatus;
  assignedTeacher: string;
}

interface NoticeRecord {
  _id: string;
  type: NoticeType;
  title: string;
  audience: NoticeAudience;
  grade: string;
  eventDate: string;
  details: string;
  postedBy: string;
  createdAt?: string;
}

const VALID_TABS: CoordinatorTab[] = [
  "teacher-attendance",
  "timetable",
  "syllabus",
  "notices",
];

const GRADE_OPTIONS = [
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
];

const DAY_OPTIONS = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
];

const PERIOD_OPTIONS = [
  { value: "Assembly", label: "Morning Assembly" },
  { value: "Period 1", label: "Period 1" },
  { value: "Period 2", label: "Period 2" },
  { value: "Period 3", label: "Period 3" },
  { value: "Period 4", label: "Period 4" },
  { value: "Break", label: "Recess / Break" },
  { value: "Period 5", label: "Period 5" },
  { value: "Period 6", label: "Period 6" },
  { value: "Period 7", label: "Period 7" },
  { value: "Period 8", label: "Period 8" },
];

const TERM_OPTIONS = [
  { value: "first_term", label: "First Term" },
  { value: "mid_term", label: "2nd / Mid-Term" },
  { value: "final_term", label: "Final Term" },
];

const TERM_LABELS: Record<SyllabusTerm, string> = {
  first_term: "First Term",
  mid_term: "2nd / Mid-Term",
  final_term: "Final Term",
};

const NOTICE_TYPE_OPTIONS = [
  { value: "datesheet", label: "Exam Date Sheet" },
  { value: "ptm", label: "Parent-Teacher Meeting (PTM)" },
  { value: "substitution", label: "Substitution / Duty Roster" },
  { value: "circular", label: "General Campus Circular" },
];

const NOTICE_TYPE_META: Record<
  NoticeType,
  { label: string; badgeClass: string }
> = {
  datesheet: {
    label: "Exam Date Sheet",
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  ptm: {
    label: "PTM Notice",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  substitution: {
    label: "Substitution",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  circular: {
    label: "Campus Circular",
    badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",
  },
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Campus" },
  { value: "teachers", label: "Teachers & Faculty" },
  { value: "parents", label: "Parents & Guardians" },
  { value: "students", label: "Students" },
];

const AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  all: "All Campus",
  teachers: "Faculty Only",
  parents: "Parents",
  students: "Students",
};

export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState<CoordinatorTab>("teacher-attendance");
  const [coordinatorName, setCoordinatorName] = useState("Academic Coordinator");
  const [institutionName, setInstitutionName] = useState("CampusFlow Institution");

  // Faculty Roster & Daily Attendance State
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceDraft>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Timetable State
  const [timetable, setTimetable] = useState<TimetableRecord[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [ttDayFilter, setTtDayFilter] = useState("ALL");
  const [ttGradeFilter, setTtGradeFilter] = useState("ALL");
  const [ttGrade, setTtGrade] = useState("Grade 10");
  const [ttSection, setTtSection] = useState("A");
  const [ttDay, setTtDay] = useState("Monday");
  const [ttPeriod, setTtPeriod] = useState("Period 1");
  const [ttStartTime, setTtStartTime] = useState("08:00 AM");
  const [ttEndTime, setTtEndTime] = useState("08:45 AM");
  const [ttSubject, setTtSubject] = useState("");
  const [ttTeacher, setTtTeacher] = useState("");
  const [ttRoom, setTtRoom] = useState("Room 101");
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);

  // Syllabus State
  const [syllabusItems, setSyllabusItems] = useState<SyllabusRecord[]>([]);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [sylTermFilter, setSylTermFilter] = useState("ALL");
  const [sylGradeFilter, setSylGradeFilter] = useState("ALL");
  const [sylGrade, setSylGrade] = useState("Grade 10");
  const [sylTerm, setSylTerm] = useState<SyllabusTerm>("first_term");
  const [sylSubject, setSylSubject] = useState("");
  const [sylChapter, setSylChapter] = useState("");
  const [sylTopics, setSylTopics] = useState("");
  const [sylTargetDate, setSylTargetDate] = useState("");
  const [sylTeacher, setSylTeacher] = useState("");
  const [isSavingSyllabus, setIsSavingSyllabus] = useState(false);
  const [updatingSyllabusId, setUpdatingSyllabusId] = useState<string | null>(null);
  const [editingSyllabusId, setEditingSyllabusId] = useState<string | null>(null);

  // Notices / Exam Date Sheet State
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState("ALL");
  const [noticeType, setNoticeType] = useState<NoticeType>("datesheet");
  const [noticeAudience, setNoticeAudience] = useState<NoticeAudience>("all");
  const [noticeGrade, setNoticeGrade] = useState("All Classes");
  const [noticeEventDate, setNoticeEventDate] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDetails, setNoticeDetails] = useState("");
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // Initialize today's date on client mount (Next.js 16 cacheComponents safe)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAttendanceDate(today);
    setSylTargetDate(today);
    setNoticeEventDate(today);

    const savedName = localStorage.getItem("campusflow_user_name");
    const savedInst = localStorage.getItem("campusflow_institution");
    if (savedName) setCoordinatorName(savedName);
    if (savedInst) setInstitutionName(savedInst);
  }, []);

  // Two-way sidebar tab synchronization
  useEffect(() => {
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as CoordinatorTab | null;
      if (tab && VALID_TABS.includes(tab)) {
        setActiveTab(tab);
      } else {
        setActiveTab("teacher-attendance");
      }
    };

    const handleTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ tabKey?: string }>;
      const tab = customEvent.detail?.tabKey as CoordinatorTab | undefined;
      if (tab && VALID_TABS.includes(tab)) {
        setActiveTab(tab);
      }
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("campusflow_tab_change", handleTabEvent);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("campusflow_tab_change", handleTabEvent);
    };
  }, []);

  const switchTab = (tab: CoordinatorTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(
      new CustomEvent("campusflow_tab_change", { detail: { tabKey: tab } })
    );
  };

  // Load faculty roster
  const fetchFaculty = useCallback(async () => {
    setIsLoadingFaculty(true);
    try {
      const res = await fetch("/api/teachers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.teachers)) {
        setFaculty(data.teachers);
      }
    } catch {
      toast.error("Unable to load faculty roster.");
    } finally {
      setIsLoadingFaculty(false);
    }
  }, []);

  // Load faculty attendance for selected date
  const fetchAttendanceForDate = useCallback(
    async (dateStr: string, staffList: FacultyMember[]) => {
      if (!dateStr) return;
      try {
        const res = await fetch(
          `/api/coordinator/teacher-attendance?date=${encodeURIComponent(dateStr)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        const savedByTeacherId = new Map<
          string,
          { status: FacultyStatus; substituteTeacher: string; remarks: string }
        >();

        if (res.ok && Array.isArray(data.records)) {
          for (const rec of data.records) {
            if (rec.teacherId) {
              savedByTeacherId.set(String(rec.teacherId), {
                status: (rec.status as FacultyStatus) || "present",
                substituteTeacher: rec.substituteTeacher || "",
                remarks: rec.remarks || "",
              });
            }
          }
        }

        const nextMap: Record<string, AttendanceDraft> = {};
        for (const member of staffList) {
          const existing = savedByTeacherId.get(member.id);
          if (existing) {
            nextMap[member.id] = { ...existing, saved: true };
          } else {
            nextMap[member.id] = {
              status: "present",
              substituteTeacher: "",
              remarks: "",
              saved: false,
            };
          }
        }
        setAttendanceMap(nextMap);
      } catch {
        toast.error("Could not load faculty attendance records.");
      }
    },
    []
  );

  // Load Timetable
  const fetchTimetable = useCallback(async () => {
    setIsLoadingTimetable(true);
    try {
      const res = await fetch("/api/coordinator/timetable", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.entries)) {
        setTimetable(data.entries);
      }
    } catch {
      toast.error("Could not load timetable schedule.");
    } finally {
      setIsLoadingTimetable(false);
    }
  }, []);

  // Load Syllabus
  const fetchSyllabus = useCallback(async () => {
    setIsLoadingSyllabus(true);
    try {
      const res = await fetch("/api/coordinator/syllabus", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setSyllabusItems(data.items);
      }
    } catch {
      toast.error("Could not load syllabus tracker.");
    } finally {
      setIsLoadingSyllabus(false);
    }
  }, []);

  // Load Notices
  const fetchNotices = useCallback(async () => {
    setIsLoadingNotices(true);
    try {
      const res = await fetch("/api/coordinator/notices", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.notices)) {
        setNotices(data.notices);
      }
    } catch {
      toast.error("Could not load campus circulars.");
    } finally {
      setIsLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
    fetchTimetable();
    fetchSyllabus();
    fetchNotices();
  }, [fetchFaculty, fetchTimetable, fetchSyllabus, fetchNotices]);

  useEffect(() => {
    if (attendanceDate && faculty.length > 0) {
      fetchAttendanceForDate(attendanceDate, faculty);
    }
  }, [attendanceDate, faculty, fetchAttendanceForDate]);

  // Themed dropdown options for selecting registered faculty across Timetable, Syllabus & Substitutions
  const facultySelectOptions = useMemo(
    () =>
      faculty.map((t) => ({
        value: t.name,
        label: t.name,
        sublabel: t.subject,
        badge: t.role === "coordinator" ? "Coordinator" : "Teacher",
      })),
    [faculty]
  );

  // KPI metrics for Faculty Attendance
  const attendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let substitutes = 0;
    for (const member of faculty) {
      const rec = attendanceMap[member.id];
      const status = rec?.status || "present";
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
      else if (status === "leave") leave++;
      if (rec?.substituteTeacher?.trim()) substitutes++;
    }
    return {
      total: faculty.length,
      present,
      absent,
      late,
      leave,
      substitutes,
    };
  }, [faculty, attendanceMap]);

  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const next: Record<string, AttendanceDraft> = {};
      for (const member of faculty) {
        next[member.id] = {
          ...(prev[member.id] || { substituteTeacher: "", remarks: "" }),
          status: "present",
          substituteTeacher: "",
        };
      }
      return next;
    });
    toast.info("All faculty members marked Present. Click Save to record.");
  };

  const handleSaveFacultyAttendance = async () => {
    if (!attendanceDate || faculty.length === 0) return;
    setIsSavingAttendance(true);
    try {
      const records = faculty.map((member) => {
        const draft = attendanceMap[member.id] || {
          status: "present" as FacultyStatus,
          substituteTeacher: "",
          remarks: "",
        };
        return {
          teacherId: member.id,
          status: draft.status,
          substituteTeacher: draft.substituteTeacher,
          remarks: draft.remarks,
        };
      });

      const res = await fetch("/api/coordinator/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: attendanceDate, records }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save faculty attendance.");
        return;
      }

      toast.success(data.message || "Daily faculty attendance saved.");
      await fetchAttendanceForDate(attendanceDate, faculty);
    } catch {
      toast.error("Network error while saving faculty attendance.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Timetable Handlers
  const handleStartEditTimetable = (slot: TimetableRecord) => {
    setEditingTimetableId(slot._id);
    setTtGrade(slot.grade);
    setTtSection(slot.section);
    setTtDay(slot.day);
    setTtPeriod(slot.period);
    setTtStartTime(slot.startTime);
    setTtEndTime(slot.endTime);
    setTtSubject(slot.subject);
    setTtTeacher(slot.teacherName);
    setTtRoom(slot.room);
  };

  const handleCancelEditTimetable = () => {
    setEditingTimetableId(null);
    setTtSubject("");
  };

  const handleAddTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttSubject.trim() || !ttTeacher.trim()) {
      toast.error("Please enter both Subject and Assigned Teacher.");
      return;
    }
    setIsSavingTimetable(true);
    try {
      const isEditing = Boolean(editingTimetableId);
      const res = await fetch("/api/coordinator/timetable", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingTimetableId } : {}),
          grade: ttGrade,
          section: ttSection.trim() || "A",
          day: ttDay,
          period: ttPeriod,
          startTime: ttStartTime,
          endTime: ttEndTime,
          subject: ttSubject.trim(),
          teacherName: ttTeacher.trim(),
          room: ttRoom.trim() || "Room 101",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data.error ||
            (isEditing ? "Could not update period." : "Could not schedule period.")
        );
        return;
      }
      toast.success(
        isEditing ? "Timetable period updated." : "Timetable period scheduled."
      );
      setEditingTimetableId(null);
      setTtSubject("");
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await fetchTimetable();
    } catch {
      toast.error("Unable to save timetable slot.");
    } finally {
      setIsSavingTimetable(false);
    }
  };

  const handleDeleteTimetable = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/timetable?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to remove timetable slot.");
        return;
      }
      setTimetable((prev) => prev.filter((item) => item._id !== id));
      if (editingTimetableId === id) {
        setEditingTimetableId(null);
        setTtSubject("");
      }
      toast.success("Timetable slot removed.");
    } catch {
      toast.error("Unable to delete slot.");
    }
  };

  const filteredTimetable = useMemo(() => {
    const dayOrder: Record<string, number> = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return timetable
      .filter((entry) => {
        const matchDay = ttDayFilter === "ALL" || entry.day === ttDayFilter;
        const matchGrade = ttGradeFilter === "ALL" || entry.grade === ttGradeFilter;
        return matchDay && matchGrade;
      })
      .sort((a, b) => {
        const dayDiff = (dayOrder[a.day] || 9) - (dayOrder[b.day] || 9);
        if (dayDiff !== 0) return dayDiff;
        return a.period.localeCompare(b.period);
      });
  }, [timetable, ttDayFilter, ttGradeFilter]);

  // Syllabus Handlers
  const handleStartEditSyllabus = (item: SyllabusRecord) => {
    setEditingSyllabusId(item._id);
    setSylGrade(item.grade);
    setSylTerm(item.term);
    setSylSubject(item.subject);
    setSylChapter(item.chapterTitle);
    setSylTopics(item.topics || "");
    setSylTargetDate(item.targetDate || "");
    setSylTeacher(
      item.assignedTeacher && item.assignedTeacher !== "Subject Teacher"
        ? item.assignedTeacher
        : ""
    );
  };

  const handleCancelEditSyllabus = () => {
    setEditingSyllabusId(null);
    setSylChapter("");
    setSylTopics("");
  };

  const handleAddSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sylSubject.trim() || !sylChapter.trim()) {
      toast.error("Please enter Subject and Chapter / Unit Title.");
      return;
    }
    setIsSavingSyllabus(true);
    try {
      const isEditing = Boolean(editingSyllabusId);
      const res = await fetch("/api/coordinator/syllabus", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingSyllabusId } : {}),
          grade: sylGrade,
          term: sylTerm,
          subject: sylSubject.trim(),
          chapterTitle: sylChapter.trim(),
          topics: sylTopics.trim(),
          targetDate: sylTargetDate,
          assignedTeacher: sylTeacher.trim() || "Subject Teacher",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data.error ||
            (isEditing
              ? "Could not update syllabus unit."
              : "Could not schedule syllabus unit.")
        );
        return;
      }
      toast.success(
        isEditing
          ? "Syllabus unit updated."
          : "Syllabus unit added to term plan."
      );
      setEditingSyllabusId(null);
      setSylChapter("");
      setSylTopics("");
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await fetchSyllabus();
    } catch {
      toast.error("Unable to save syllabus unit.");
    } finally {
      setIsSavingSyllabus(false);
    }
  };

  const handleUpdateSyllabusStatus = async (id: string, status: SyllabusStatus) => {
    setUpdatingSyllabusId(id);
    try {
      const res = await fetch("/api/coordinator/syllabus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        toast.error("Could not update progress status.");
        return;
      }
      setSyllabusItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status } : item))
      );
      toast.success("Syllabus progress updated.");
    } catch {
      toast.error("Unable to update status.");
    } finally {
      setUpdatingSyllabusId(null);
    }
  };

  const handleDeleteSyllabus = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/syllabus?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Could not remove syllabus item.");
        return;
      }
      setSyllabusItems((prev) => prev.filter((item) => item._id !== id));
      if (editingSyllabusId === id) {
        setEditingSyllabusId(null);
        setSylChapter("");
        setSylTopics("");
      }
      toast.success("Syllabus unit removed.");
    } catch {
      toast.error("Unable to delete syllabus item.");
    }
  };

  const filteredSyllabus = useMemo(() => {
    return syllabusItems.filter((item) => {
      const matchTerm = sylTermFilter === "ALL" || item.term === sylTermFilter;
      const matchGrade = sylGradeFilter === "ALL" || item.grade === sylGradeFilter;
      return matchTerm && matchGrade;
    });
  }, [syllabusItems, sylTermFilter, sylGradeFilter]);

  const syllabusProgress = useMemo(() => {
    const total = filteredSyllabus.length;
    const completed = filteredSyllabus.filter((i) => i.status === "completed").length;
    const inProgress = filteredSyllabus.filter((i) => i.status === "in_progress").length;
    const pending = total - completed - inProgress;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, percent };
  }, [filteredSyllabus]);

  // Notice Handlers
  const handleStartEditNotice = (notice: NoticeRecord) => {
    setEditingNoticeId(notice._id);
    setNoticeType(notice.type);
    setNoticeAudience(notice.audience);
    setNoticeGrade(notice.grade || "All Classes");
    setNoticeEventDate(notice.eventDate || "");
    setNoticeTitle(notice.title);
    setNoticeDetails(notice.details);
  };

  const handleCancelEditNotice = () => {
    setEditingNoticeId(null);
    setNoticeTitle("");
    setNoticeDetails("");
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDetails.trim()) {
      toast.error("Please enter a notice title and complete details.");
      return;
    }
    setIsSavingNotice(true);
    try {
      const isEditing = Boolean(editingNoticeId);
      const res = await fetch("/api/coordinator/notices", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingNoticeId } : {}),
          type: noticeType,
          audience: noticeAudience,
          grade: noticeGrade,
          eventDate: noticeEventDate,
          title: noticeTitle.trim(),
          details: noticeDetails.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data.error ||
            (isEditing
              ? "Could not update circular."
              : "Could not publish circular.")
        );
        return;
      }
      toast.success(
        isEditing
          ? "Date sheet / circular updated."
          : "Notice published for campus."
      );
      setEditingNoticeId(null);
      setNoticeTitle("");
      setNoticeDetails("");
      window.dispatchEvent(new Event("campusflow_notifications_refresh"));
      await fetchNotices();
    } catch {
      toast.error("Unable to save circular.");
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/notices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Could not delete notice.");
        return;
      }
      setNotices((prev) => prev.filter((n) => n._id !== id));
      if (editingNoticeId === id) {
        setEditingNoticeId(null);
        setNoticeTitle("");
        setNoticeDetails("");
      }
      toast.success("Circular deleted.");
    } catch {
      toast.error("Unable to delete circular.");
    }
  };

  const filteredNotices = useMemo(() => {
    if (noticeFilter === "ALL") return notices;
    return notices.filter((n) => n.type === noticeFilter);
  }, [notices, noticeFilter]);

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
              Manage daily teacher attendance &amp; substitutions, master class timetables, term syllabus coverage, and exam date sheets from one centralized desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                fetchFaculty();
                fetchTimetable();
                fetchSyllabus();
                fetchNotices();
                toast.success("Coordinator desk synchronized.");
              }}
              className="h-9 text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh Desk
            </Button>
          </div>
        </div>

        {/* Unified Responsive Workspace Tabs (Zero Horizontal Scrollbar) */}
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

      {/* ================================================================= */}
      {/* TAB 1: FACULTY ATTENDANCE & SUBSTITUTION MANAGER                  */}
      {/* ================================================================= */}
      {activeTab === "teacher-attendance" && (
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Faculty</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold mt-1.5">{attendanceStats.total}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Registered teaching staff
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Present Today</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-1.5 text-emerald-600 dark:text-emerald-400">
                {attendanceStats.present}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                On duty in campus
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Absent / Leave / Late</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-1.5 text-amber-600 dark:text-amber-400">
                {attendanceStats.absent + attendanceStats.leave + attendanceStats.late}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {attendanceStats.absent} absent • {attendanceStats.leave} leave • {attendanceStats.late} late
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Substitutions Set</span>
                <UserCheck className="h-4 w-4 text-violet-500" />
              </div>
              <p className="text-2xl font-bold mt-1.5 text-violet-600 dark:text-violet-400">
                {attendanceStats.substitutes}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Arrangement teachers assigned
              </p>
            </div>
          </div>

          {/* Faculty Attendance Register Card */}
          <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  Daily Faculty Attendance &amp; Arrangement Register
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mark daily teacher attendance and immediately assign a substitute (arrangement) teacher if anyone is absent or on leave.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="faculty-attendance-date"
                    className="text-xs font-semibold text-muted-foreground shrink-0"
                  >
                    Date:
                  </label>
                  <div className="w-40">
                    <CustomDatePicker
                      id="faculty-attendance-date"
                      name="attendanceDate"
                      value={attendanceDate}
                      onChange={setAttendanceDate}
                      placeholder="Select date"
                      size="default"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  disabled={faculty.length === 0}
                  className="h-9 text-xs"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Mark All Present
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveFacultyAttendance}
                  disabled={isSavingAttendance || faculty.length === 0 || !attendanceDate}
                  className="h-9 text-xs"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {isSavingAttendance ? "Saving..." : "Save Daily Attendance"}
                </Button>
              </div>
            </div>

            {isLoadingFaculty ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading campus faculty roster...
              </div>
            ) : faculty.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1.5">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground text-sm">
                  No Faculty Members Registered Yet
                </p>
                <p>
                  Once teachers sign up with your school join code, they will appear here automatically for daily attendance tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {faculty.map((member) => {
                  const draft = attendanceMap[member.id] || {
                    status: "present" as FacultyStatus,
                    substituteTeacher: "",
                    remarks: "",
                    saved: false,
                  };
                  const needsSub =
                    draft.status === "absent" ||
                    draft.status === "leave" ||
                    draft.status === "late";

                  const otherTeachers = faculty.filter((f) => f.id !== member.id);

                  return (
                    <div
                      key={member.id}
                      className="rounded-xl border bg-muted/15 p-4 space-y-3 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-sm text-foreground truncate">
                              {member.name}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                member.role === "coordinator"
                                  ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              {member.role === "coordinator" ? "Coordinator" : "Teacher"}
                            </span>
                            {draft.saved && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                Recorded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {member.subject} • {member.email}
                          </p>
                        </div>

                        {/* Status Toggle Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                          {(
                            [
                              {
                                key: "present",
                                label: "Present",
                                active:
                                  "bg-emerald-600 text-white border-emerald-600",
                              },
                              {
                                key: "absent",
                                label: "Absent",
                                active: "bg-rose-600 text-white border-rose-600",
                              },
                              {
                                key: "late",
                                label: "Late",
                                active: "bg-amber-500 text-white border-amber-500",
                              },
                              {
                                key: "leave",
                                label: "On Leave",
                                active: "bg-sky-600 text-white border-sky-600",
                              },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [member.id]: {
                                    ...draft,
                                    status: opt.key,
                                    substituteTeacher:
                                      opt.key === "present"
                                        ? ""
                                        : draft.substituteTeacher,
                                  },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                draft.status === opt.key
                                  ? opt.active
                                  : "bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Substitute Teacher & Remarks Row (Appears when Absent / Late / On Leave) */}
                      {needsSub && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed">
                          <div>
                            <label
                              htmlFor={`sub-teacher-${member.id}`}
                              className="block text-[11px] font-semibold text-foreground mb-1"
                            >
                              Substitute / Arrangement Teacher
                            </label>
                            <CustomSelect
                              id={`sub-teacher-${member.id}`}
                              name={`substituteTeacher_${member.id}`}
                              value={draft.substituteTeacher}
                              onChange={(val) =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [member.id]: {
                                    ...draft,
                                    substituteTeacher: val,
                                  },
                                }))
                              }
                              options={[
                                { value: "", label: "No Substitute Assigned" },
                                ...otherTeachers.map((t) => ({
                                  value: t.name,
                                  label: t.name,
                                  sublabel: t.subject,
                                  badge:
                                    t.role === "coordinator"
                                      ? "Coordinator"
                                      : "Teacher",
                                })),
                              ]}
                              placeholder="Select arrangement teacher..."
                              searchable={otherTeachers.length > 4}
                              size="sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`remarks-${member.id}`}
                              className="block text-[11px] font-semibold text-foreground mb-1"
                            >
                              Coordinator Remarks / Reason
                            </label>
                            <input
                              id={`remarks-${member.id}`}
                              name={`remarks_${member.id}`}
                              type="text"
                              autoComplete="off"
                              value={draft.remarks}
                              onChange={(e) =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [member.id]: {
                                    ...draft,
                                    remarks: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g. Medical leave, arrived 15 mins late..."
                              className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: MASTER CLASS & SECTION TIMETABLE SCHEDULER                 */}
      {/* ================================================================= */}
      {activeTab === "timetable" && (
        <div className="space-y-5">
          <CoordinatorFileUpload category="timetable" />
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: TERM SYLLABUS PLANNER & COVERAGE TRACKER                   */}
      {/* ================================================================= */}
      {activeTab === "syllabus" && (
        <div className="space-y-5">
          <CoordinatorFileUpload category="syllabus" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Form */}
          <form
            onSubmit={handleAddSyllabus}
            className={`lg:col-span-5 rounded-2xl border bg-card p-5 shadow-xs space-y-4 transition-colors ${
              editingSyllabusId ? "border-primary/60 ring-1 ring-primary/20" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  {editingSyllabusId ? (
                    <Pencil className="h-4 w-4 text-primary" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-primary" />
                  )}
                  {editingSyllabusId
                    ? "Edit Syllabus Unit / Chapter"
                    : "Add Syllabus Unit / Chapter"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingSyllabusId
                    ? "Modify chapter details, target date, or teacher and save your changes."
                    : "Plan First Term, Mid-Term, and Final Term syllabus targets and track teacher completion progress."}
                </p>
              </div>
              {editingSyllabusId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEditSyllabus}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label
                  htmlFor="syl-grade"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Class / Grade
                </label>
                <CustomSelect
                  value={sylGrade}
                  onChange={setSylGrade}
                  options={GRADE_OPTIONS}
                  size="sm"
                />
              </div>

              <div>
                <label
                  htmlFor="syl-term"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Academic Term
                </label>
                <CustomSelect
                  value={sylTerm}
                  onChange={(v) => setSylTerm(v as SyllabusTerm)}
                  options={TERM_OPTIONS}
                  size="sm"
                />
              </div>

              <div>
                <label
                  htmlFor="syl-subject"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Subject
                </label>
                <input
                  id="syl-subject"
                  name="subject"
                  type="text"
                  autoComplete="off"
                  required
                  value={sylSubject}
                  onChange={(e) => setSylSubject(e.target.value)}
                  placeholder="e.g. Biology, Chemistry, English"
                  className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="syl-target-date"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Target Completion Date
                </label>
                <CustomDatePicker
                  id="syl-target-date"
                  name="targetDate"
                  value={sylTargetDate}
                  onChange={setSylTargetDate}
                  placeholder="Select target date"
                  size="sm"
                  align="right"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="syl-chapter"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Chapter / Unit Title
                </label>
                <input
                  id="syl-chapter"
                  name="chapterTitle"
                  type="text"
                  autoComplete="off"
                  required
                  value={sylChapter}
                  onChange={(e) => setSylChapter(e.target.value)}
                  placeholder="e.g. Chapter 3: Quadratic Equations & Factorization"
                  className="w-full h-8.5 rounded-lg border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="syl-teacher"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Responsible Teacher
                </label>
                <CustomSelect
                  id="syl-teacher"
                  name="assignedTeacher"
                  value={sylTeacher}
                  onChange={setSylTeacher}
                  options={
                    sylTeacher &&
                    !facultySelectOptions.some((o) => o.value === sylTeacher)
                      ? [
                          {
                            value: sylTeacher,
                            label: sylTeacher,
                            sublabel: "Current Assignment",
                          },
                          ...facultySelectOptions,
                        ]
                      : facultySelectOptions
                  }
                  placeholder={
                    facultySelectOptions.length > 0
                      ? "Select responsible teacher..."
                      : "No teachers registered yet"
                  }
                  searchable={facultySelectOptions.length > 4}
                  size="sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="syl-topics"
                  className="block text-[11px] font-semibold mb-1"
                >
                  Key Topics / Exercises (Optional)
                </label>
                <textarea
                  id="syl-topics"
                  name="topics"
                  rows={3}
                  value={sylTopics}
                  onChange={(e) => setSylTopics(e.target.value)}
                  placeholder="e.g. Exercise 3.1 to 3.4, board past paper MCQs, weekly test..."
                  className="w-full rounded-lg border bg-background p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSavingSyllabus}
                className="flex-1 h-9 text-xs"
              >
                {editingSyllabusId ? (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isSavingSyllabus
                  ? editingSyllabusId
                    ? "Updating Unit..."
                    : "Saving Unit..."
                  : editingSyllabusId
                  ? "Update Syllabus Unit"
                  : "Schedule Syllabus Unit"}
              </Button>
              {editingSyllabusId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEditSyllabus}
                  className="h-9 text-xs px-3"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Right Coverage Tracker */}
          <div className="lg:col-span-7 rounded-2xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h2 className="text-base font-bold">
                  Syllabus Coverage Tracker ({filteredSyllabus.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Update chapter completion status in real time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[270px]">
                <CustomSelect
                  value={sylTermFilter}
                  onChange={setSylTermFilter}
                  options={[{ value: "ALL", label: "All Terms" }, ...TERM_OPTIONS]}
                  size="sm"
                />
                <CustomSelect
                  value={sylGradeFilter}
                  onChange={setSylGradeFilter}
                  options={[{ value: "ALL", label: "All Classes" }, ...GRADE_OPTIONS]}
                  size="sm"
                />
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  Overall Completion Rate
                </span>
                <span className="font-bold text-primary">
                  {syllabusProgress.percent}% Completed ({syllabusProgress.completed}/{syllabusProgress.total} units)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${syllabusProgress.percent}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <span>Completed: {syllabusProgress.completed}</span>
                <span>In Progress: {syllabusProgress.inProgress}</span>
                <span>Pending: {syllabusProgress.pending}</span>
              </div>
            </div>

            {isLoadingSyllabus ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Loading term syllabus units...
              </div>
            ) : filteredSyllabus.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed text-xs text-muted-foreground space-y-1.5">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground text-sm">
                  No Syllabus Units Planned Yet
                </p>
                <p>
                  Add chapters for First Term, Mid-Term, or Final Term to track coverage across all subjects.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSyllabus.map((item) => {
                  const isUpdating = updatingSyllabusId === item._id;
                  const isBeingEdited = editingSyllabusId === item._id;
                  return (
                    <div
                      key={item._id}
                      className={`rounded-xl border p-4 space-y-2.5 transition-colors ${
                        isBeingEdited
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "bg-muted/15"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                              {item.grade}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300">
                              {TERM_LABELS[item.term] || item.term}
                            </span>
                            <span className="text-[11px] font-semibold text-foreground">
                              {item.subject}
                            </span>
                            {isBeingEdited && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                Editing
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm text-foreground">
                            {item.chapterTitle}
                          </p>
                          {item.topics && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.topics}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                            <span>Teacher: {item.assignedTeacher}</span>
                            {item.targetDate && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Target: {item.targetDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-start shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditSyllabus(item)}
                            className={`h-8 w-8 p-0 ${
                              isBeingEdited
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                            title="Edit syllabus unit"
                            aria-label={`Edit ${item.chapterTitle}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSyllabus(item._id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete syllabus unit"
                            aria-label={`Delete ${item.chapterTitle}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Status Selector Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-dashed">
                        {(
                          [
                            {
                              key: "pending",
                              label: "Pending",
                              active: "bg-slate-600 text-white border-slate-600",
                            },
                            {
                              key: "in_progress",
                              label: "In Progress",
                              active: "bg-amber-500 text-white border-amber-500",
                            },
                            {
                              key: "completed",
                              label: "Completed",
                              active:
                                "bg-emerald-600 text-white border-emerald-600",
                            },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateSyllabusStatus(item._id, st.key)
                            }
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                              item.status === st.key
                                ? st.active
                                : "bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: EXAM DATE SHEET, PTM & CAMPUS CIRCULARS                    */}
      {/* ================================================================= */}
      {activeTab === "notices" && (
        <div className="space-y-5">
          <CoordinatorFileUpload category="datesheet" />
        </div>
      )}
    </div>
  );
}
