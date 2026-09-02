"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BanknoteArrowDown,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { ContributionDialog, MatchDialog } from "@/components/entity-dialogs";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge, PaymentBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMatchSummary, calculateOverallBalance, calculatePlayerDue, formatBDT, formatMatchDate, formatTime, isSameMonth, isSameWeek } from "@/lib/calculations";
import { cn, initials } from "@/lib/utils";

function StatCard({ label, value, helper, icon: Icon, tone = "green" }: { label: string; value: string; helper: string; icon: typeof WalletCards; tone?: "green" | "red" | "blue" | "amber" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700" };
  return <Card className="relative overflow-hidden"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="number-tabular mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-[1.7rem]">{value}</p></div><div className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}><Icon className="size-[18px]" /></div></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></CardContent></Card>;
}

export default function DashboardPage() {
  const { data, demoMode } = useFootball();
  const overall = calculateOverallBalance(data);
  const now = new Date();
  const activePlayers = data.players.filter((player) => player.is_active);
  const nextMatch = [...data.matches].filter((match) => match.match_date >= now.toISOString().slice(0, 10) && match.status !== "Cancelled").sort((a, b) => a.match_date.localeCompare(b.match_date))[0];
  const lastMatch = [...data.matches].filter((match) => match.status === "Completed").sort((a, b) => b.match_date.localeCompare(a.match_date))[0];
  const monthCollected = data.contributions.filter((item) => isSameMonth(item.payment_date, now)).reduce((sum, item) => sum + item.amount, 0);
  const monthExpense = data.expenses.filter((item) => isSameMonth(item.expense_date, now)).reduce((sum, item) => sum + item.amount, 0);
  const weekCollected = data.contributions.filter((item) => isSameWeek(item.payment_date, now)).reduce((sum, item) => sum + item.amount, 0);
  const duePlayers = activePlayers.map((player) => ({ player, due: calculatePlayerDue(data, player.id) })).filter((item) => item.due > 0).sort((a, b) => b.due - a.due);
  const totalDue = duePlayers.reduce((sum, item) => sum + item.due, 0);
  const bossSupport = data.contributions.filter((item) => item.contribution_type === "Extra Support" || data.players.find((p) => p.id === item.player_id)?.player_type === "Boss / Sponsor").reduce((sum, item) => sum + item.amount, 0);
  const lastSummary = lastMatch ? calculateMatchSummary(data, lastMatch.id) : null;
  const recentContributions = [...data.contributions].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, 4);

  return (
    <>
      <PageHeader eyebrow="Good morning, manager" title="Ready for Saturday?" description="Everything your football group needs—from who joined to where every taka went." actions={<><ContributionDialog trigger={<Button variant="outline"><CircleDollarSign />Money in</Button>} /><MatchDialog trigger={<Button><Plus />Plan match</Button>} /></>} />
      {demoMode ? <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800"><Sparkles className="mt-0.5 size-4 shrink-0" /><p><strong>Product tour mode.</strong> Try every action—changes are saved in this browser. Connect Supabase when you are ready to invite the group.</p></div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Current balance" value={formatBDT(overall.balance)} helper={`${formatBDT(overall.collected)} collected overall`} icon={WalletCards} />
        <StatCard label="Next match" value={nextMatch ? formatMatchDate(nextMatch.match_date, { day: "numeric", month: "short" }) : "Not planned"} helper={nextMatch ? `${formatTime(nextMatch.start_time)} · ${nextMatch.turf_name}` : "Add the next Saturday slot"} icon={CalendarDays} tone="blue" />
        <StatCard label="Total due" value={formatBDT(totalDue)} helper={`${duePlayers.length} player${duePlayers.length === 1 ? "" : "s"} still to pay`} icon={CircleDollarSign} tone="red" />
        <StatCard label="Month collection" value={formatBDT(monthCollected)} helper={`${data.contributions.filter((i) => isSameMonth(i.payment_date, now)).length} payments received`} icon={TrendingUp} />
        <StatCard label="Month expense" value={formatBDT(monthExpense)} helper="Turf and match costs" icon={BanknoteArrowDown} tone="amber" />
        <StatCard label="Active players" value={String(activePlayers.length)} helper={`${data.players.filter((p) => p.player_type === "Regular").length} regular squad members`} icon={Users} tone="blue" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <Card className="overflow-hidden border-0 bg-sidebar text-white shadow-[0_16px_50px_oklch(0.18_0.04_155/0.18)]">
          <div className="pitch-pattern relative h-full min-h-[310px] p-6 sm:p-7">
            <div className="absolute -end-20 -top-32 size-80 rounded-full border border-white/10" />
            <div className="absolute -end-3 -top-10 size-44 rounded-full border border-white/10" />
            <div className="relative flex items-start justify-between"><div><Badge className="bg-emerald-300/15 text-emerald-200 ring-emerald-300/25">This Saturday</Badge><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{nextMatch ? formatMatchDate(nextMatch.match_date, { weekday: "long", day: "numeric", month: "long" }) : "No match planned"}</h2></div>{nextMatch ? <MatchBadge status={nextMatch.status} /> : null}</div>
            {nextMatch ? <><div className="relative mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/70"><span className="flex items-center gap-2"><Clock3 className="size-4 text-emerald-300" />{formatTime(nextMatch.start_time)} – {formatTime(nextMatch.end_time)}</span><span className="flex items-center gap-2"><MapPin className="size-4 text-emerald-300" />{nextMatch.turf_name}</span><span className="flex items-center gap-2"><CircleDollarSign className="size-4 text-emerald-300" />{formatBDT(nextMatch.match_cost)} turf fee</span></div><div className="relative mt-9 flex flex-wrap gap-3"><Link href={`/matches/${nextMatch.id}`} className={cn(buttonVariants({ variant: "default" }), "bg-emerald-400 text-sidebar hover:bg-emerald-300")}>Open match <ArrowRight /></Link><span className="self-center text-xs text-white/45">Who joined? Who paid? Add them here.</span></div></> : <div className="relative mt-8"><MatchDialog trigger={<Button>Plan this Saturday</Button>} /></div>}
          </div>
        </Card>

        <Card>
          <CardHeader><div className="flex items-start justify-between"><div><CardTitle>Boss support</CardTitle><CardDescription>Extra help that keeps us playing</CardDescription></div><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><ShieldCheck className="size-5" /></div></div></CardHeader>
          <CardContent><p className="number-tabular text-3xl font-bold tracking-[-0.04em]">{formatBDT(bossSupport)}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[78%] rounded-full bg-amber-400" /></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Total sponsor contribution</span><span>Thank you, Boss!</span></div><div className="mt-6 rounded-xl bg-secondary p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">This week</p><div className="mt-2 flex items-end justify-between"><p className="text-xl font-bold">{formatBDT(weekCollected)}</p><span className="flex items-center text-xs font-semibold text-emerald-700"><ArrowUpRight className="size-3.5" /> collected</span></div></div></CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Recent money in</CardTitle><CardDescription>Latest contributions from the squad</CardDescription></div><Link href="/contributions" className={buttonVariants({ variant: "ghost", size: "sm" })}>View all <ArrowRight /></Link></CardHeader><CardContent className="space-y-1">{recentContributions.map((item) => { const player = data.players.find((p) => p.id === item.player_id); return <div key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-muted/55"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(player?.name ?? "?")}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{player?.name ?? "Unknown player"}</p><p className="truncate text-xs text-muted-foreground">{item.contribution_type} · {item.payment_method}</p></div><div className="text-right"><p className="number-tabular text-sm font-bold text-emerald-700">+{formatBDT(item.amount)}</p><p className="text-xs text-muted-foreground">{formatMatchDate(item.payment_date, { day: "numeric", month: "short" })}</p></div></div>;})}</CardContent></Card>

        <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Due players</CardTitle><CardDescription>Friendly reminders needed</CardDescription></div><Link href="/due-list" className={buttonVariants({ variant: "ghost", size: "sm" })}>View all</Link></CardHeader><CardContent>{duePlayers.length ? <div className="space-y-2">{duePlayers.slice(0, 4).map(({ player, due }) => <div key={player.id} className="flex items-center gap-3 rounded-xl border bg-background p-3"><div className="grid size-9 place-items-center rounded-full bg-red-50 text-xs font-bold text-red-700">{initials(player.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{player.name}</p><PaymentBadge status={data.attendance.find((a) => a.player_id === player.id && a.payment_status !== "Paid")?.payment_status ?? "Due"} /></div><p className="number-tabular text-sm font-bold text-red-700">{formatBDT(due)}</p></div>)}</div> : <div className="grid min-h-44 place-items-center text-center"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" /></div><p className="text-sm font-semibold">All clear!</p><p className="text-xs text-muted-foreground">Nobody has a due payment.</p></div></div>}</CardContent></Card>
      </section>

      {lastMatch && lastSummary ? <Card className="mt-5"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Last match, at a glance</CardTitle><CardDescription>{formatMatchDate(lastMatch.match_date, { weekday: "long", day: "numeric", month: "long" })} · {lastMatch.turf_name}</CardDescription></div><Link href={`/matches/${lastMatch.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Match details <ArrowRight /></Link></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[{ label: "Joined", value: `${lastSummary.joined} players` }, { label: "Collected", value: formatBDT(lastSummary.collected), good: true }, { label: "Expense", value: formatBDT(lastSummary.expenses) }, { label: "Due", value: formatBDT(lastSummary.due), bad: lastSummary.due > 0 }, { label: "Match balance", value: formatBDT(lastSummary.balance), good: lastSummary.balance >= 0 }].map((item) => <div key={item.label} className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className={cn("number-tabular mt-1 text-lg font-bold", item.good && "text-emerald-700", item.bad && "text-red-700")}>{item.value}</p></div>)}</div></CardContent></Card> : null}
    </>
  );
}
