"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useFootball } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT, formatMatchDate } from "@/lib/calculations";
import type { PaymentMethod } from "@/lib/types";

const ELECTRONIC_METHODS: PaymentMethod[] = ["bKash", "Nagad", "Bank"];

export function PaymentClaimDialog({ trigger, presetMatchId }: { trigger: ReactNode; presetMatchId?: string }) {
  const { data, profiles, currentUserId, submitPaymentClaim } = useFootball();
  const [open, setOpen] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bKash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const playerId = profiles.find((item) => item.id === currentUserId)?.player_id;

  const dues = useMemo(() => data.attendance.flatMap((attendance) => {
    if (attendance.player_id !== playerId || attendance.attendance_status !== "Joined") return [];
    const pendingAmount = data.paymentClaims
      .filter((claim) => claim.player_id === playerId && claim.match_id === attendance.match_id && claim.status === "Pending")
      .reduce((sum, claim) => sum + claim.amount, 0);
    const available = Math.max(attendance.expected_contribution - attendance.paid_amount - pendingAmount, 0);
    const match = data.matches.find((item) => item.id === attendance.match_id);
    return match && available > 0 ? [{ match, available }] : [];
  }).sort((a, b) => b.match.match_date.localeCompare(a.match.match_date)), [data.attendance, data.matches, data.paymentClaims, playerId]);

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;
    const selected = dues.find((item) => item.match.id === presetMatchId) ?? dues[0];
    setMatchId(selected?.match.id ?? "");
    setAmount(selected ? String(selected.available) : "");
    setPaymentMethod("bKash");
    setReference("");
    setNotes("");
  }

  function changeMatch(nextMatchId: string) {
    setMatchId(nextMatchId);
    const selected = dues.find((item) => item.match.id === nextMatchId);
    setAmount(selected ? String(selected.available) : "");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    const selected = dues.find((item) => item.match.id === matchId);
    if (!selected || !numericAmount || numericAmount > selected.available) return;
    setPending(true);
    try {
      await submitPaymentClaim({ matchId, amount: numericAmount, paymentMethod, reference, notes });
      toast.success("Payment submitted for verification", { description: "An Admin or Treasurer can now approve it." });
      setOpen(false);
    } catch (error) {
      toast.error("Could not submit payment", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setPending(false);
    }
  }

  const selectedDue = dues.find((item) => item.match.id === matchId);
  const needsReference = ELECTRONIC_METHODS.includes(paymentMethod);

  return <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Submit a payment</DialogTitle><DialogDescription>This does not change the fund yet. An Admin or Treasurer must verify it first.</DialogDescription></DialogHeader>{dues.length ? <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="claim-match">Match due</Label><Select id="claim-match" value={matchId} onChange={(event) => changeMatch(event.target.value)}>{dues.map(({ match, available }) => <option key={match.id} value={match.id}>{formatMatchDate(match.match_date)} · {match.turf_name} · {formatBDT(available)} available</option>)}</Select></div><div className="space-y-2"><Label htmlFor="claim-amount">Amount</Label><Input id="claim-amount" type="number" min="1" max={selectedDue?.available} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /><p className="text-xs text-muted-foreground">Maximum {formatBDT(selectedDue?.available ?? 0)}</p></div><div className="space-y-2"><Label htmlFor="claim-method">Payment method</Label><Select id="claim-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}><option>Cash</option><option>bKash</option><option>Nagad</option><option>Bank</option><option>Other</option></Select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="claim-reference">Transaction reference{needsReference ? " (required)" : " (optional)"}</Label><Input id="claim-reference" maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} placeholder={needsReference ? "Enter transaction ID or bank reference" : "Receipt or handover reference"} required={needsReference} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="claim-notes">Note (optional)</Label><Textarea id="claim-notes" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the reviewer should know…" /></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending || !selectedDue}>{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? "Submitting…" : "Submit for verification"}</Button></DialogFooter></form> : <div className="rounded-xl bg-muted p-5 text-sm leading-6 text-muted-foreground">You have no unclaimed match dues. Pending claims already reserve their amounts until reviewed.</div>}</DialogContent></Dialog>;
}