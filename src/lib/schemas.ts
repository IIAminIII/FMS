import { z } from "zod";

const money = z.coerce.number().min(0, "Amount cannot be negative");

export const playerSchema = z.object({
  name: z.string().trim().min(2, "Enter a player name"),
  phone: z.string().trim().optional(),
  player_type: z.enum(["Regular", "Occasional", "Boss / Sponsor", "Guest"]),
  default_contribution: money,
  notes: z.string().trim().optional(),
});

export const matchSchema = z
  .object({
    match_date: z.string().min(1, "Choose a date"),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    turf_name: z.string().trim().min(2, "Enter a turf name"),
    match_cost: money,
    status: z.enum(["Planned", "Booked", "Completed", "Cancelled"]),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.end_time > data.start_time, { message: "End time must be after start time", path: ["end_time"] });

export const contributionSchema = z.object({
  match_id: z.string().optional(),
  player_id: z.string().min(1, "Choose a player"),
  amount: money.refine((value) => value > 0, "Amount must be greater than zero"),
  contribution_type: z.enum(["Regular Player Fee", "Extra Support", "Advance Fund", "Adjustment"]),
  payment_method: z.enum(["Cash", "bKash", "Nagad", "Bank", "Other"]),
  payment_date: z.string().min(1),
  notes: z.string().trim().optional(),
});

export const expenseSchema = z.object({
  match_id: z.string().optional(),
  expense_type: z.enum(["Turf Fee", "Ball", "Water", "Transport", "Other"]),
  amount: money.refine((value) => value > 0, "Amount must be greater than zero"),
  paid_by: z.string().optional(),
  expense_date: z.string().min(1),
  notes: z.string().trim().optional(),
});
