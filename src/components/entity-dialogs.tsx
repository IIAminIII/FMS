"use client";

import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFootball } from "@/components/providers/data-provider";
import { getNextSaturday } from "@/lib/calculations";
import { contributionSchema, expenseSchema, matchSchema, playerSchema } from "@/lib/schemas";
import type { Contribution, Expense, Match, Player } from "@/lib/types";

const TURF_OPTIONS = ["Fortune Sports Arena", "Intercity"] as const;

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function SaveButton({ pending, label = "Save" }: { pending: boolean; label?: string }) {
  return <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? "Saving…" : label}</Button>;
}

export function PlayerDialog({ trigger, player }: { trigger: ReactNode; player?: Player }) {
  const { saveEntity } = useFootball();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof playerSchema>, unknown, z.output<typeof playerSchema>>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player?.name ?? "",
      phone: player?.phone ?? "",
      player_type: player?.player_type ?? "Regular",
      default_contribution: player?.default_contribution ?? 200,
      notes: player?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) form.reset({ name: player?.name ?? "", phone: player?.phone ?? "", player_type: player?.player_type ?? "Regular", default_contribution: player?.default_contribution ?? 200, notes: player?.notes ?? "" });
  }, [form, open, player]);

  async function submit(values: z.output<typeof playerSchema>) {
    try {
      await saveEntity("players", {
        ...values,
        id: player?.id,
        created_at: player?.created_at,
        phone: values.phone || null,
        notes: values.notes || null,
        is_active: player?.is_active ?? true,
      });
      toast.success(player ? "Player updated" : "Player added");
      setOpen(false);
    } catch (error) {
      toast.error("Could not save player", { description: error instanceof Error ? error.message : "Try again" });
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{player ? "Edit player" : "Add a player"}</DialogTitle><DialogDescription>Keep the squad list current and set the usual weekly amount.</DialogDescription></DialogHeader><form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2"><Field label="Player name" error={form.formState.errors.name?.message}><Input placeholder="e.g. Mahadi" {...form.register("name")} /></Field><Field label="Phone number"><Input placeholder="01XXX XXXXXX" {...form.register("phone")} /></Field><Field label="Player type"><Select {...form.register("player_type")}><option>Regular</option><option>Occasional</option><option>Boss / Sponsor</option><option>Guest</option></Select></Field><Field label="Default contribution" error={form.formState.errors.default_contribution?.message}><Input type="number" min="0" step="50" {...form.register("default_contribution")} /></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea placeholder="Position, availability, or anything useful…" {...form.register("notes")} /></Field></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><SaveButton pending={form.formState.isSubmitting} label={player ? "Update player" : "Add player"} /></DialogFooter></form></DialogContent></Dialog>;
}

function dateInputValue() { return getNextSaturday().toISOString().slice(0, 10); }

export function MatchDialog({ trigger, match }: { trigger: ReactNode; match?: Match }) {
  const { addMatch, saveEntity, data } = useFootball();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof matchSchema>, unknown, z.output<typeof matchSchema>>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      match_date: match?.match_date ?? dateInputValue(),
      start_time: match?.start_time ?? data.settings.default_start_time,
      end_time: match?.end_time ?? data.settings.default_end_time,
      turf_name: match?.turf_name ?? data.settings.default_turf_name,
      match_cost: match?.match_cost ?? data.settings.default_match_cost,
      status: match?.status ?? "Planned",
      notes: match?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) form.reset({ match_date: match?.match_date ?? dateInputValue(), start_time: match?.start_time ?? data.settings.default_start_time, end_time: match?.end_time ?? data.settings.default_end_time, turf_name: match?.turf_name ?? data.settings.default_turf_name, match_cost: match?.match_cost ?? data.settings.default_match_cost, status: match?.status ?? "Planned", notes: match?.notes ?? "" });
  }, [data.settings, form, match, open]);

  async function submit(values: z.output<typeof matchSchema>) {
    try {
      const payload = { ...values, id: match?.id, created_at: match?.created_at, notes: values.notes || null };
      if (match) await saveEntity("matches", payload); else await addMatch(payload);
      toast.success(match ? "Match updated" : "Saturday match created");
      setOpen(false);
    } catch (error) {
      toast.error("Could not save match", { description: error instanceof Error ? error.message : "Try again" });
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{match ? "Edit match" : "Plan a match"}</DialogTitle><DialogDescription>A turf-fee expense is added automatically for a new match.</DialogDescription></DialogHeader><form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2"><Field label="Match date" error={form.formState.errors.match_date?.message}><Input type="date" {...form.register("match_date")} /></Field><Field label="Status"><Select {...form.register("status")}><option>Planned</option><option>Booked</option><option>Completed</option><option>Cancelled</option></Select></Field><Field label="Start time"><Input type="time" {...form.register("start_time")} /></Field><Field label="End time" error={form.formState.errors.end_time?.message}><Input type="time" {...form.register("end_time")} /></Field><Field label="Turf name" error={form.formState.errors.turf_name?.message}><Select {...form.register("turf_name")}>{Array.from(new Set([match?.turf_name ?? data.settings.default_turf_name, ...TURF_OPTIONS])).map((turf) => <option key={turf} value={turf}>{turf}</option>)}</Select></Field><Field label="Turf fee"><Input type="number" min="0" step="100" {...form.register("match_cost")} /></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea placeholder="Arrival time, booking reference…" {...form.register("notes")} /></Field></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><SaveButton pending={form.formState.isSubmitting} label={match ? "Update match" : "Create match"} /></DialogFooter></form></DialogContent></Dialog>;
}

export function ContributionDialog({ trigger, contribution, presetMatchId, presetPlayerId }: { trigger: ReactNode; contribution?: Contribution; presetMatchId?: string; presetPlayerId?: string }) {
  const { data, addContribution } = useFootball();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof contributionSchema>, unknown, z.output<typeof contributionSchema>>({ resolver: zodResolver(contributionSchema), defaultValues: { match_id: contribution?.match_id ?? presetMatchId ?? "", player_id: contribution?.player_id ?? presetPlayerId ?? "", amount: contribution?.amount ?? 200, contribution_type: contribution?.contribution_type ?? "Regular Player Fee", payment_method: contribution?.payment_method ?? "Cash", payment_date: contribution?.payment_date ?? new Date().toISOString().slice(0, 10), notes: contribution?.notes ?? "" } });

  useEffect(() => { if (open) form.reset({ match_id: contribution?.match_id ?? presetMatchId ?? "", player_id: contribution?.player_id ?? presetPlayerId ?? "", amount: contribution?.amount ?? 200, contribution_type: contribution?.contribution_type ?? "Regular Player Fee", payment_method: contribution?.payment_method ?? "Cash", payment_date: contribution?.payment_date ?? new Date().toISOString().slice(0, 10), notes: contribution?.notes ?? "" }); }, [contribution, form, open, presetMatchId, presetPlayerId]);

  async function submit(values: z.output<typeof contributionSchema>) {
    try {
      const payload = { ...values, id: contribution?.id, created_at: contribution?.created_at, match_id: values.match_id || null, notes: values.notes || null };
      await addContribution(payload);
      toast.success(contribution ? "Contribution updated" : "Money received — recorded");
      setOpen(false);
    } catch (error) { toast.error("Could not save contribution", { description: error instanceof Error ? error.message : "Try again" }); }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{contribution ? "Edit contribution" : "Record money in"}</DialogTitle><DialogDescription>Contributions are money received. Expenses stay separate.</DialogDescription></DialogHeader><form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2"><Field label="Player" error={form.formState.errors.player_id?.message}><Select {...form.register("player_id")}><option value="">Choose player</option>{data.players.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Match (optional)"><Select {...form.register("match_id")}><option value="">Club fund / no match</option>{data.matches.map((m) => <option key={m.id} value={m.id}>{m.match_date} · {m.turf_name}</option>)}</Select></Field><Field label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min="1" step="50" {...form.register("amount")} /></Field><Field label="Payment date"><Input type="date" {...form.register("payment_date")} /></Field><Field label="Contribution type"><Select {...form.register("contribution_type")}><option>Regular Player Fee</option><option>Extra Support</option><option>Advance Fund</option><option>Adjustment</option></Select></Field><Field label="Payment method"><Select {...form.register("payment_method")}><option>Cash</option><option>bKash</option><option>Nagad</option><option>Bank</option><option>Other</option></Select></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea placeholder="Optional payment note…" {...form.register("notes")} /></Field></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><SaveButton pending={form.formState.isSubmitting} label="Record contribution" /></DialogFooter></form></DialogContent></Dialog>;
}

export function ExpenseDialog({ trigger, expense, presetMatchId }: { trigger: ReactNode; expense?: Expense; presetMatchId?: string }) {
  const { data, addExpense, saveEntity } = useFootball();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof expenseSchema>, unknown, z.output<typeof expenseSchema>>({ resolver: zodResolver(expenseSchema), defaultValues: { match_id: expense?.match_id ?? presetMatchId ?? "", expense_type: expense?.expense_type ?? "Turf Fee", amount: expense?.amount ?? 1000, paid_by: expense?.paid_by ?? "", expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10), notes: expense?.notes ?? "" } });

  useEffect(() => { if (open) form.reset({ match_id: expense?.match_id ?? presetMatchId ?? "", expense_type: expense?.expense_type ?? "Turf Fee", amount: expense?.amount ?? 1000, paid_by: expense?.paid_by ?? "", expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10), notes: expense?.notes ?? "" }); }, [expense, form, open, presetMatchId]);

  async function submit(values: z.output<typeof expenseSchema>) {
    try {
      const payload = { ...values, id: expense?.id, created_at: expense?.created_at, match_id: values.match_id || null, paid_by: values.paid_by || null, notes: values.notes || null };
      if (expense) await saveEntity("expenses", payload); else await addExpense(payload);
      toast.success(expense ? "Expense updated" : "Expense recorded"); setOpen(false);
    } catch (error) { toast.error("Could not save expense", { description: error instanceof Error ? error.message : "Try again" }); }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{expense ? "Edit expense" : "Record money out"}</DialogTitle><DialogDescription>Keep every turf and match cost separate from contributions.</DialogDescription></DialogHeader><form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2"><Field label="Match (optional)"><Select {...form.register("match_id")}><option value="">General club expense</option>{data.matches.map((m) => <option key={m.id} value={m.id}>{m.match_date} · {m.turf_name}</option>)}</Select></Field><Field label="Expense type"><Select {...form.register("expense_type")}><option>Turf Fee</option><option>Ball</option><option>Water</option><option>Transport</option><option>Other</option></Select></Field><Field label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min="1" step="10" {...form.register("amount")} /></Field><Field label="Expense date"><Input type="date" {...form.register("expense_date")} /></Field><Field label="Paid by"><Select {...form.register("paid_by")}><option value="">Club fund</option>{data.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea placeholder="Optional expense note…" {...form.register("notes")} /></Field></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><SaveButton pending={form.formState.isSubmitting} label="Record expense" /></DialogFooter></form></DialogContent></Dialog>;
}

export function AttendanceDialog({ trigger, matchId }: { trigger: ReactNode; matchId: string }) {
  const { data, addAttendance } = useFootball();
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [pending, setPending] = useState(false);
  const existing = new Set(data.attendance.filter((row) => row.match_id === matchId).map((row) => row.player_id));
  const available = data.players.filter((player) => player.is_active && !existing.has(player.id));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!playerId) return; setPending(true);
    try { await addAttendance(matchId, playerId); toast.success("Player added to the match"); setPlayerId(""); setOpen(false); }
    catch (error) { toast.error("Could not add player", { description: error instanceof Error ? error.message : "Try again" }); }
    finally { setPending(false); }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Who joined?</DialogTitle><DialogDescription>Add a player with their normal expected contribution.</DialogDescription></DialogHeader>{available.length ? <form onSubmit={submit} className="space-y-4"><Field label="Player"><Select value={playerId} onChange={(event) => setPlayerId(event.target.value)} required><option value="">Choose from active players</option>{available.map((player) => <option key={player.id} value={player.id}>{player.name} · ৳{player.default_contribution}</option>)}</Select></Field><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><SaveButton pending={pending} label="Add to match" /></DialogFooter></form> : <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Every active player is already on this match.</div>}</DialogContent></Dialog>;
}
