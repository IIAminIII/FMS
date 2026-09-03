"use client";

import { useState } from "react";
import { CalendarCheck2, CircleDollarSign, Clock3, MapPin, ReceiptText, UserRoundCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge, PaymentBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePlayerDue, formatBDT, formatMatchDate, formatTime } from "@/lib/calculations";
import type { AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const RSVP_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "Joined", label: "I'm in", activeClass: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" },
  { value: "Maybe", label: "Maybe", activeClass: "border-amber-500 bg-amber-500 text-white hover:bg-amber-600" },
  { value: "Not Joined", label: "Can't join", activeClass: "border-red-600 bg-red-600 text-white hover:bg-red-700" },
];

function PersonalStat({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: typeof WalletCards; tone: string }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="number-tabular mt-2 text-2xl font-bold tracking-[-0.04em]">{value}</p></div><div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone)}><Icon className="size-[18px]" /></div></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}

export default function MyAccountPage() {
  const { data, loading, profiles, currentUserId, respondToMatch } = useFootball();
  const [pendingMatchId, setPendingMatchId] = useState<string>();
  const profile = profiles.find((item) => item.id === currentUserId);
  const player = data.players.find((item) => item.id === profile?.player_id);

  if (loading) {
    return <><PageHeader eyebrow="Personal clubhouse" title="My account" description="Loading your player record…" /><Card className="h-64 animate-pulse bg-muted/40" /></>;
  }

  if (!player) {
    return <>
      <PageHeader eyebrow="Personal clubhouse" title="My account" description="Your private player summary, payments, dues, and match responses." />
      <Card className="max-w-2xl"><CardContent className="flex items-start gap-4 p-6"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><UserRoundCheck className="size-5" /></div><div><p className="font-semibold">Your player record is not linked yet</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Ask an Admin to open Settings, find your login under Member roles, and choose your player name. Your account page will activate immediately after the link is saved.</p></div></CardContent></Card>
    </>;
  }

  const playerAttendance = data.attendance.filter((item) => item.player_id === player.id);
  const payments = data.contributions.filter((item) => item.player_id === player.id).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
  const totalDue = calculatePlayerDue(data, player.id);
  const joinedMatches = playerAttendance.filter((item) => item.attendance_status === "Joined").length;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingMatches = data.matches
    .filter((match) => match.match_date >= today && (match.status === "Planned" || match.status === "Booked"))
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  async function respond(matchId: string, status: AttendanceStatus) {
    setPendingMatchId(matchId);
    try {
      await respondToMatch(matchId, status);
      toast.success("Match response saved", { description: status === "Joined" ? "See you on the turf!" : `Your response is now ${status}.` });
    } catch (error) {
      toast.error("Could not save response", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setPendingMatchId(undefined);
    }
  }

  return <>
    <PageHeader eyebrow="Personal clubhouse" title={`Welcome, ${player.name.split(" ")[0]}`} description="See your matches and money clearly, then confirm Saturday in one tap." actions={<Badge variant={player.is_active ? "success" : "secondary"}>{player.is_active ? "Active player" : "Inactive player"}</Badge>} />

    <section className="grid gap-4 sm:grid-cols-3">
      <PersonalStat label="Total paid" value={formatBDT(totalPaid)} helper={`${payments.length} recorded payment${payments.length === 1 ? "" : "s"}`} icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
      <PersonalStat label="Current due" value={formatBDT(totalDue)} helper={totalDue ? "Outstanding joined-match fees" : "You're fully settled"} icon={CircleDollarSign} tone={totalDue ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"} />
      <PersonalStat label="Matches joined" value={String(joinedMatches)} helper={`${playerAttendance.length} total response${playerAttendance.length === 1 ? "" : "s"}`} icon={CalendarCheck2} tone="bg-sky-50 text-sky-700" />
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <CardHeader><CardTitle>Upcoming matches</CardTitle><CardDescription>Choose your availability. You can change it while the match is still open.</CardDescription></CardHeader>
        <CardContent>
          {upcomingMatches.length ? <div className="space-y-3">{upcomingMatches.map((match) => {
            const response = playerAttendance.find((item) => item.match_id === match.id)?.attendance_status;
            return <article key={match.id} className="rounded-xl border p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{formatMatchDate(match.match_date, { weekday: "long", day: "numeric", month: "long" })}</p><MatchBadge status={match.status} /></div><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{formatTime(match.start_time)} – {formatTime(match.end_time)}</span><span className="flex items-center gap-1.5"><MapPin className="size-4" />{match.turf_name}</span></div></div>{response ? <Badge variant={response === "Joined" ? "success" : response === "Maybe" ? "warning" : "danger"}>{response}</Badge> : <Badge variant="outline">No response</Badge>}</div><div className="mt-4 grid gap-2 sm:grid-cols-3">{RSVP_OPTIONS.map((option) => <Button key={option.value} variant="outline" className={cn(response === option.value && option.activeClass)} disabled={pendingMatchId === match.id || !player.is_active} onClick={() => void respond(match.id, option.value)}>{pendingMatchId === match.id && response !== option.value ? "Saving…" : option.label}</Button>)}</div></article>;
          })}</div> : <EmptyState icon={CalendarCheck2} title="No upcoming match yet" description="Your next Planned or Booked match will appear here for RSVP." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Player details</CardTitle><CardDescription>The club record linked to your login</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Full name</p><p className="mt-1 font-semibold">{player.name}</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Player type</p><p className="mt-1"><Badge variant="secondary">{player.player_type}</Badge></p></div><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Phone</p><p className="mt-1 text-sm">{player.phone ?? "Not added"}</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Default match fee</p><p className="number-tabular mt-1 font-semibold">{formatBDT(player.default_contribution)}</p></div></CardContent>
      </Card>
    </section>

    <Card className="mt-5">
      <CardHeader><CardTitle>My payment history</CardTitle><CardDescription>Every contribution recorded against your player account</CardDescription></CardHeader>
      <CardContent>
        {payments.length ? <div className="divide-y">{payments.map((payment) => {
          const match = data.matches.find((item) => item.id === payment.match_id);
          return <div key={payment.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ReceiptText className="size-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{payment.contribution_type}</p><p className="text-sm text-muted-foreground">{formatMatchDate(payment.payment_date, { day: "numeric", month: "short", year: "numeric" })} · {payment.payment_method}{match ? ` · ${match.turf_name}` : ""}</p></div><div className="flex items-center justify-between gap-3 sm:block sm:text-right"><Badge variant="success">Received</Badge><p className="number-tabular mt-1 font-bold text-emerald-700">+{formatBDT(payment.amount)}</p></div></div>;
        })}</div> : <EmptyState icon={ReceiptText} title="No payments recorded" description="Payments recorded by the club Treasurer will appear here." />}
      </CardContent>
    </Card>

    {totalDue > 0 ? <Card className="mt-5 border-red-200 bg-red-50/45"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700"><CircleDollarSign className="size-5" /></div><div className="flex-1"><p className="font-semibold">You have {formatBDT(totalDue)} outstanding</p><p className="mt-1 text-sm text-muted-foreground">Pay your Treasurer, then ask them to record the contribution. Payment self-verification comes in the next upgrade.</p></div><PaymentBadge status="Due" /></CardContent></Card> : null}
  </>;
}