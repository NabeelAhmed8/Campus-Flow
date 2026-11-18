export type ParentTab = "overview" | "results" | "schedules" | "fees" | "remarks" | "leave";
export type ExamTermKey = "first_term" | "mid_term" | "final_term" | "all";
export type RemarksTermKey = "first_term" | "mid_term" | "final_term" | "class_test" | "all";

export interface SchoolBankAccount {
  id: string;
  bankName: string;
  badge: string;
  accountTitle: string;
  accountNo: string;
  iban: string;
  branch: string;
}
