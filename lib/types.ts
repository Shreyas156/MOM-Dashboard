export interface QA {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatarColor?: string;
}

export interface ModuleItem {
  id: string;
  name: string;
}

export interface QATaskEntry {
  qaId: string;
  qaName: string;
  isOnLeave: boolean;
  isSubmitted?: boolean;
  submittedAt?: string;
  status: string; // e.g. "Working on Launches."
  tasks: string[]; // List of bullet points
}

export interface SmokeExecutionRow {
  id: string;
  module: string;
  qa: string;
  // Desktop Metrics
  desktopTotal: number | null;
  desktopPass: number | null;
  desktopFail: number | null;
  desktopReport: string; // e.g. "Link", "Automation report sent", "NA"
  desktopReportUrl?: string;
  desktopBugTicketId: string; // e.g. "Link", "-", "680379"
  desktopBugTicketUrl?: string;
  // Msite Metrics
  msiteTotal: number | null;
  msitePass: number | null;
  msiteFail: number | null;
  msiteReport: string;
  msiteReportUrl?: string;
  msiteBugTicketId: string;
  msiteBugTicketUrl?: string;
}

export interface DailyMOM {
  id: string; // Date string e.g. "2026-08-05"
  dateFormatted: string; // e.g. "05-August-2026"
  attendees: string[];
  qaTasks: QATaskEntry[];
  smokeRows: SmokeExecutionRow[];
  senderName: string;
  senderTitle: string;
  createdAt: string;
  updatedAt: string;
}
