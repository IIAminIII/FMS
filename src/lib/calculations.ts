import type { AppData, MatchSummary, PaymentStatus } from "@/lib/types";

export function calculatePaymentStatus(expectedAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return "Due";
  if (paidAmount < expectedAmount) return "Partial";
  if (paidAmount === expectedAmount) return "Paid";
  return "Extra Paid";
}

export function calculateMatchSummary(data: AppData, matchId: string): MatchSummary {
  const rows = data.attendance.filter((row) => row.match_id === matchId && row.attendance_status === "Joined");
  const collected = data.contributions
    .filter((item) => item.match_id === matchId)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = data.expenses
    .filter((item) => item.match_id === matchId)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expected = rows.reduce((sum, row) => sum + Number(row.expected_contribution), 0);
  const paidAgainstAttendance = rows.reduce((sum, row) => sum + Number(row.paid_amount), 0);

  return {
    joined: rows.length,
    expected,
    collected,
    due: Math.max(expected - paidAgainstAttendance, 0),
    expenses,
    balance: collected - expenses,
  };
}

export function calculatePlayerDue(data: AppData, playerId: string) {
  return data.attendance
    .filter((row) => row.player_id === playerId && row.attendance_status === "Joined")
    .reduce((sum, row) => sum + Math.max(Number(row.expected_contribution) - Number(row.paid_amount), 0), 0);
}

export function calculateOverallBalance(data: AppData) {
  const collected = data.contributions.reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  return { collected, expenses, balance: collected - expenses };
}

export function getNextSaturday(from = new Date()) {
  const result = new Date(from);
  result.setHours(12, 0, 0, 0);
  const days = (6 - result.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + days);
  return result;
}

export function formatBDT(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("BDT", "৳");
}

export function formatMatchDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-BD", options ?? { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2026, 0, 1, hours, minutes),
  );
}

export function isSameMonth(date: string, reference = new Date()) {
  const value = new Date(`${date}T12:00:00`);
  return value.getMonth() === reference.getMonth() && value.getFullYear() === reference.getFullYear();
}

export function isSameWeek(date: string, reference = new Date()) {
  const value = new Date(`${date}T12:00:00`);
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return value >= start && value < end;
}
