export const GRADE_OPTIONS = [
  { value: "Grade 7", label: "Grade 7" },
  { value: "Grade 8", label: "Grade 8" },
  { value: "Grade 9", label: "Grade 9" },
  { value: "Grade 10", label: "Grade 10" },
  { value: "Grade 11", label: "Grade 11" },
  { value: "Grade 12", label: "Grade 12" },
] as const;

export const GRADE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Classes" },
  ...GRADE_OPTIONS,
];

export const ALL_CLASSES_GRADE_OPTIONS = [
  { value: "All Classes", label: "All Classes" },
  ...GRADE_OPTIONS,
];

export const TERM_OPTIONS = [
  { value: "first_term", label: "First Term" },
  { value: "mid_term", label: "2nd / Mid-Term" },
  { value: "final_term", label: "Final Term" },
] as const;

export const TERM_LABELS: Record<string, string> = {
  first_term: "First Term",
  mid_term: "2nd / Mid-Term",
  final_term: "Final Term",
  class_test: "Class Test",
  all: "All Terms",
};

export const EXAM_TERM_LABELS: Record<string, string> = {
  first_term: "First Term Exam",
  mid_term: "2nd / Mid-Term Exam",
  final_term: "Final Term Exam",
  class_test: "Class Test",
  all: "All Terms",
};

export const EXAM_TERM_OPTIONS = [
  { value: "first_term", label: "First Term Exam", shortLabel: "1st Term", badge: "1st Term" },
  { value: "mid_term", label: "2nd / Mid-Term Exam", shortLabel: "Mid-Term", badge: "Mid-Term" },
  { value: "final_term", label: "Final Term Exam", shortLabel: "Final Exam", badge: "Final" },
  { value: "class_test", label: "Class Test / Unit Quiz", shortLabel: "Quiz", badge: "Quiz" },
];

export const AUDIENCE_LABELS: Record<string, string> = {
  all: "All Campus",
  admin: "Admin Only",
  parents_students: "Parents & Students",
  parents: "Parents",
  students: "Students",
  teachers: "Teachers",
};

export const BROADCAST_AUDIENCE_OPTIONS = [
  {
    value: "parents_students",
    label: "Parents & Students",
    sublabel: "Visible to Parents, Students & Admin",
  },
  {
    value: "all",
    label: "All Campus (Everyone)",
    sublabel: "Parents, Students, Teachers & Admin",
  },
  {
    value: "parents",
    label: "Parents Only",
    sublabel: "Guardians & Admin oversight",
  },
  {
    value: "students",
    label: "Students Only",
    sublabel: "Students & Admin oversight",
  },
  {
    value: "teachers",
    label: "Teachers & Faculty",
    sublabel: "Faculty & Admin oversight",
  },
];

export const BROADCAST_CATEGORY_OPTIONS = [
  { value: "announcement", label: "General Announcement" },
  { value: "urgent", label: "Urgent Alert / Holiday Notice" },
  { value: "circular", label: "Official Campus Circular" },
  { value: "datesheet", label: "Exam / Assessment Update" },
  { value: "timetable", label: "Timetable Notice" },
  { value: "syllabus", label: "Syllabus Update" },
];

export const PAKISTANI_BANK_OPTIONS = [
  { value: "Meezan Bank Ltd", label: "Meezan Bank Ltd", sublabel: "Direct Deposit / IBAN", badge: "Islamic Bank" },
  { value: "HBL (Habib Bank Limited)", label: "HBL (Habib Bank Limited)", sublabel: "Branch Challan / Mobile App", badge: "Commercial" },
  { value: "UBL (United Bank Limited)", label: "UBL (United Bank Limited)", sublabel: "Net Banking / Omni Voucher", badge: "Commercial" },
  { value: "Bank Alfalah", label: "Bank Alfalah", sublabel: "Online & OTC Transfer", badge: "Commercial" },
  { value: "Raast Instant Pay (SBP)", label: "Raast Instant Pay", sublabel: "State Bank of Pakistan (0% fee)", badge: "Instant" },
  { value: "JazzCash / EasyPaisa", label: "JazzCash / EasyPaisa", sublabel: "Mobile Microfinance Wallet", badge: "Mobile" },
  { value: "Cash Counter Challan", label: "School Cash Counter Challan", sublabel: "Physical receipt at campus", badge: "Manual" },
];

export const SUBJECT_OPTIONS = [
  { value: "Mathematics", label: "Mathematics", badge: "STEM" },
  { value: "Computer Science", label: "Computer Science", badge: "STEM" },
  { value: "Physics", label: "Physics", badge: "STEM" },
  { value: "Chemistry", label: "Chemistry", badge: "STEM" },
  { value: "Biology", label: "Biology", badge: "STEM" },
  { value: "English Literature", label: "English Literature", badge: "Humanities" },
  { value: "Urdu", label: "Urdu", badge: "Language" },
  { value: "Pakistan Studies", label: "Pakistan Studies", badge: "Social Studies" },
  { value: "Islamiat / Ethics", label: "Islamiat / Ethics", badge: "Studies" },
];
