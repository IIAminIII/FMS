import { calculatePaymentStatus, getNextSaturday } from "@/lib/calculations";
import type { AppData, Attendance, Contribution, Expense, Match, Player } from "@/lib/types";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const isoNow = "2026-09-02T00:00:00.000Z";

export function createSeedData(): AppData {
  const nextSaturday = getNextSaturday();
  const lastSaturday = new Date(nextSaturday);
  lastSaturday.setDate(lastSaturday.getDate() - 7);
  const twoWeeksAgo = new Date(nextSaturday);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const players: Player[] = [
    { id: "p-mahadi", name: "Mahadi", phone: "01712 345678", player_type: "Regular", default_contribution: 200, is_active: true, notes: "Midfield engine", created_at: isoNow },
    { id: "p-rakib", name: "Rakib", phone: "01812 345678", player_type: "Regular", default_contribution: 200, is_active: true, notes: "Usually confirms early", created_at: isoNow },
    { id: "p-hasan", name: "Hasan", phone: "01912 345678", player_type: "Regular", default_contribution: 200, is_active: true, notes: "Goalkeeper", created_at: isoNow },
    { id: "p-boss", name: "Emranul Hasan", phone: "01612 345678", player_type: "Boss / Sponsor", default_contribution: 3000, is_active: true, notes: "Main sponsor", created_at: isoNow },
    { id: "p-guest", name: "Guest Player", phone: null, player_type: "Guest", default_contribution: 200, is_active: true, notes: null, created_at: isoNow },
    { id: "p-fahim", name: "Fahim", phone: "01312 345678", player_type: "Occasional", default_contribution: 200, is_active: true, notes: null, created_at: isoNow },
  ];

  const matches: Match[] = [
    { id: "m-next", match_date: isoDate(nextSaturday), start_time: "07:00", end_time: "08:00", turf_name: "Green Field Arena", match_cost: 1000, status: "Booked", notes: "Arrive 15 minutes early", created_at: isoNow },
    { id: "m-last", match_date: isoDate(lastSaturday), start_time: "07:00", end_time: "08:00", turf_name: "Green Field Arena", match_cost: 1000, status: "Completed", notes: "Great game — 6-a-side", created_at: isoNow },
    { id: "m-old", match_date: isoDate(twoWeeksAgo), start_time: "06:00", end_time: "07:00", turf_name: "Kickoff Turf", match_cost: 1000, status: "Completed", notes: null, created_at: isoNow },
  ];

  const makeAttendance = (id: string, matchId: string, playerId: string, expected: number, paid: number): Attendance => ({
    id,
    match_id: matchId,
    player_id: playerId,
    attendance_status: "Joined",
    expected_contribution: expected,
    paid_amount: paid,
    payment_status: calculatePaymentStatus(expected, paid),
    notes: null,
    created_at: isoNow,
  });

  const attendance: Attendance[] = [
    makeAttendance("a-1", "m-last", "p-mahadi", 200, 200),
    makeAttendance("a-2", "m-last", "p-rakib", 200, 200),
    makeAttendance("a-3", "m-last", "p-hasan", 200, 0),
    makeAttendance("a-4", "m-last", "p-boss", 200, 3000),
    makeAttendance("a-5", "m-last", "p-fahim", 200, 100),
    makeAttendance("a-6", "m-old", "p-mahadi", 200, 200),
    makeAttendance("a-7", "m-old", "p-hasan", 200, 200),
    makeAttendance("a-8", "m-old", "p-guest", 200, 200),
  ];

  const contributions: Contribution[] = [
    { id: "c-1", match_id: "m-last", player_id: "p-mahadi", amount: 200, contribution_type: "Regular Player Fee", payment_method: "bKash", payment_date: isoDate(lastSaturday), notes: null, created_at: isoNow },
    { id: "c-2", match_id: "m-last", player_id: "p-rakib", amount: 200, contribution_type: "Regular Player Fee", payment_method: "Cash", payment_date: isoDate(lastSaturday), notes: null, created_at: isoNow },
    { id: "c-3", match_id: "m-last", player_id: "p-boss", amount: 3000, contribution_type: "Extra Support", payment_method: "Bank", payment_date: isoDate(lastSaturday), notes: "Emranul Hasan support for the month", created_at: isoNow },
    { id: "c-4", match_id: "m-last", player_id: "p-fahim", amount: 100, contribution_type: "Regular Player Fee", payment_method: "Cash", payment_date: isoDate(lastSaturday), notes: "Remaining ৳100 due", created_at: isoNow },
    { id: "c-5", match_id: "m-old", player_id: "p-mahadi", amount: 200, contribution_type: "Regular Player Fee", payment_method: "Cash", payment_date: isoDate(twoWeeksAgo), notes: null, created_at: isoNow },
    { id: "c-6", match_id: "m-old", player_id: "p-hasan", amount: 200, contribution_type: "Regular Player Fee", payment_method: "Nagad", payment_date: isoDate(twoWeeksAgo), notes: null, created_at: isoNow },
    { id: "c-7", match_id: "m-old", player_id: "p-guest", amount: 200, contribution_type: "Regular Player Fee", payment_method: "Cash", payment_date: isoDate(twoWeeksAgo), notes: null, created_at: isoNow },
  ];

  const expenses: Expense[] = [
    { id: "e-1", match_id: "m-next", expense_type: "Turf Fee", amount: 1000, paid_by: null, expense_date: isoDate(nextSaturday), notes: "Auto-added turf fee", created_at: isoNow },
    { id: "e-2", match_id: "m-last", expense_type: "Turf Fee", amount: 1000, paid_by: "p-mahadi", expense_date: isoDate(lastSaturday), notes: null, created_at: isoNow },
    { id: "e-3", match_id: "m-last", expense_type: "Water", amount: 120, paid_by: "p-rakib", expense_date: isoDate(lastSaturday), notes: "Two cases", created_at: isoNow },
    { id: "e-4", match_id: "m-old", expense_type: "Turf Fee", amount: 1000, paid_by: "p-boss", expense_date: isoDate(twoWeeksAgo), notes: null, created_at: isoNow },
  ];

  return {
    players,
    matches,
    attendance,
    contributions,
    expenses,
    settings: {
      id: "settings-default",
      default_match_cost: 1000,
      default_player_contribution: 200,
      default_turf_name: "Green Field Arena",
      default_start_time: "07:00",
      default_end_time: "08:00",
      currency: "BDT",
    },
  };
}
