"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, ReceiptText, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBDT, formatMatchDate } from "@/lib/calculations";
import type { PaymentClaim } from "@/lib/types";

export function PaymentClaimReview() {
  const { data, canManage, reviewPaymentClaim } = useFootball();
  const [pendingId, setPendingId] = useState<string>();
  const [rejecting, setRejecting] = useState<PaymentClaim>();
  const [reviewNote, setReviewNote] = useState("");
  const pendingClaims = data.paymentClaims.filter((claim) => claim.status === "Pending").sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (!canManage) return null;

  async function review(claim: PaymentClaim, status: "Approved" | "Rejected", note?: string) {
    setPendingId(claim.id);
    try {
      await reviewPaymentClaim(claim.id, status, note);
      toast.success(status === "Approved" ? "Payment approved and recorded" : "Payment claim rejected", { description: status === "Approved" ? "The contribution ledger and player due are updated." : "The player can see your review result." });
      setRejecting(undefined);
      setReviewNote("");
    } catch (error) {
      toast.error("Could not review payment", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setPendingId(undefined);
    }
  }

  function reject(event: FormEvent) {
    event.preventDefault();
    if (rejecting) void review(rejecting, "Rejected", reviewNote);
  }

  return <><Card className="mb-5 border-amber-200 bg-amber-50/30"><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Payment verification</CardTitle><CardDescription>Approve only after checking cash or the transaction reference.</CardDescription></div><Badge variant={pendingClaims.length ? "warning" : "success"}>{pendingClaims.length} pending</Badge></CardHeader><CardContent>{pendingClaims.length ? <div className="space-y-3">{pendingClaims.map((claim) => {
    const player = data.players.find((item) => item.id === claim.player_id);
    const match = data.matches.find((item) => item.id === claim.match_id);
    const busy = pendingId === claim.id;
    return <article key={claim.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><ReceiptText className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{player?.name ?? "Unknown player"}</p><Badge variant="outline">{claim.payment_method}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{match ? `${formatMatchDate(match.match_date)} · ${match.turf_name}` : "Unknown match"}{claim.reference ? ` · Ref: ${claim.reference}` : ""}</p>{claim.notes ? <p className="mt-1 text-xs text-muted-foreground">{claim.notes}</p> : null}</div><p className="number-tabular text-lg font-bold">{formatBDT(claim.amount)}</p><div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void review(claim, "Approved")}>{busy ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}Approve</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(claim)}><XCircle />Reject</Button></div></article>;
  })}</div> : <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck className="size-5" /><span>All submitted payments have been reviewed.</span></div>}</CardContent></Card><Dialog open={Boolean(rejecting)} onOpenChange={(open) => { if (!open) { setRejecting(undefined); setReviewNote(""); } }}><DialogContent><DialogHeader><DialogTitle>Reject payment claim?</DialogTitle><DialogDescription>Add a short reason so the player knows what to correct.</DialogDescription></DialogHeader><form onSubmit={reject} className="space-y-4"><div className="space-y-2"><Label htmlFor="review-note">Reason</Label><Textarea id="review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={500} required placeholder="Reference not found, incorrect amount…" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setRejecting(undefined)}>Cancel</Button><Button type="submit" variant="destructive" disabled={!reviewNote.trim() || Boolean(pendingId)}>{pendingId ? <LoaderCircle className="animate-spin" /> : null}Reject claim</Button></DialogFooter></form></DialogContent></Dialog></>;
}