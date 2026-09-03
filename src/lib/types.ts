export type PlayerType = "Regular" | "Occasional" | "Boss / Sponsor" | "Guest";
export type MatchStatus = "Planned" | "Booked" | "Completed" | "Cancelled";
export type AttendanceStatus = "Joined" | "Not Joined" | "Maybe";
export type PaymentStatus = "Paid" | "Partial" | "Due" | "Extra Paid";
export type ContributionType = "Regular Player Fee" | "Extra Support" | "Advance Fund" | "Adjustment";
export type PaymentMethod = "Cash" | "bKash" | "Nagad" | "Bank" | "Other";
export type ExpenseType = "Turf Fee" | "Ball" | "Water" | "Transport" | "Other";
export type AppRole = "admin" | "treasurer" | "player";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  role: AppRole;
  player_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  name: string;
  phone: string | null;
  player_type: PlayerType;
  default_contribution: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  match_date: string;
  start_time: string;
  end_time: string;
  turf_name: string;
  match_cost: number;
  status: MatchStatus;
  notes: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  match_id: string;
  player_id: string;
  attendance_status: AttendanceStatus;
  expected_contribution: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface Contribution {
  id: string;
  match_id: string | null;
  player_id: string;
  amount: number;
  contribution_type: ContributionType;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  match_id: string | null;
  expense_type: ExpenseType;
  amount: number;
  paid_by: string | null;
  expense_date: string;
  notes: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  default_match_cost: number;
  default_player_contribution: number;
  default_turf_name: string;
  default_start_time: string;
  default_end_time: string;
  currency: string;
}

export interface AppData {
  players: Player[];
  matches: Match[];
  attendance: Attendance[];
  contributions: Contribution[];
  expenses: Expense[];
  settings: Settings;
}

export interface MatchSummary {
  joined: number;
  expected: number;
  collected: number;
  due: number;
  expenses: number;
  balance: number;
}

export type EntityMap = {
  players: Player;
  matches: Match;
  attendance: Attendance;
  contributions: Contribution;
  expenses: Expense;
};
