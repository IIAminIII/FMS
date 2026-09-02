"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BanknoteArrowDown, BanknoteArrowUp, CheckCircle2, CircleDollarSign, Clock3, MapPin, Printer, Trash2, UserPlus, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { AttendanceDialog, ContributionDialog, ExpenseDialog } from "@/components/entity-dialogs";
import { EmptyState } from "@/components/empty-state";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge, PaymentBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateMatchSummary, formatBDT, formatMatchDate, formatTime } from "@/lib/calculations";
import { cn, initials } from "@/lib/utils";

const tabs = ["Attendance", "Contributions", "Expenses"] as const;

export function MatchDetailClient({ matchId }: { matchId: string }) {
  const { data, saveEntity, removeEntity } = useFootball();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Attendance");
  const match = data.matches.find((item) => item.id === matchId);
  if (!match) return <Card><EmptyState icon={Clock3} title="Match not found" description="This match may have been removed or the link is no longer valid." action={<Link href="/matches" className={buttonVariants()}>Back to matches</Link>} /></Card>;
  const summary = calculateMatchSummary(data, matchId);
  const attendance = data.attendance.filter((item) => item.match_id === matchId);
  const contributions = data.contributions.filter((item) => item.match_id === matchId);
  const expenses = data.expenses.filter((item) => item.match_id === matchId);

  async function complete() { await saveEntity("matches", { ...match!, status: "Completed" }); toast.success("Match marked completed"); }
  async function removeAttendance(id: string) { await removeEntity("attendance", id); toast.success("Player removed from match"); }

  return <div>
    <div className="no-print mb-5"><Link href="/matches" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ms-3 text-muted-foreground")}><ArrowLeft />All matches</Link></div>
    <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 flex items-center gap-2"><Badge variant="secondary">Saturday match</Badge><MatchBadge status={match.status} /></div><h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{formatMatchDate(match.match_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />{formatTime(match.start_time)} – {formatTime(match.end_time)}</span><span className="flex items-center gap-2"><MapPin className="size-4 text-primary" />{match.turf_name}</span></div></div><div className="no-print flex flex-wrap gap-2"><Button variant="outline" onClick={() => window.print()}><Printer />Print summary</Button>{match.status !== "Completed" && match.status !== "Cancelled" ? <Button onClick={() => void complete()}><CheckCircle2 />Mark completed</Button> : null}</div></header>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{[
      { label: "Joined players", value: String(summary.joined), icon: Users },
      { label: "Expected", value: formatBDT(summary.expected), icon: CircleDollarSign },
      { label: "Collected", value: formatBDT(summary.collected), icon: BanknoteArrowUp, tone: "text-emerald-700" },
      { label: "Due", value: formatBDT(summary.due), icon: WalletCards, tone: summary.due > 0 ? "text-red-700" : "text-emerald-700" },
      { label: "Expenses", value: formatBDT(summary.expenses), icon: BanknoteArrowDown },
      { label: "Match balance", value: formatBDT(summary.balance), icon: WalletCards, tone: summary.balance < 0 ? "text-red-700" : "text-emerald-700" },
    ].map(({ label, value, icon: Icon, tone }) => <Card key={label}><CardContent className="p-4"><div className="mb-3 grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></div><p className="text-xs text-muted-foreground">{label}</p><p className={cn("number-tabular mt-1 text-xl font-bold", tone)}>{value}</p></CardContent></Card>)}</section>

    <Card className="mt-5 overflow-hidden"><CardHeader className="border-b"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Match book</CardTitle><CardDescription>Who joined? Who paid? What did we spend?</CardDescription></div><div className="no-print flex flex-wrap gap-2"><AttendanceDialog matchId={matchId} trigger={<Button variant="outline" size="sm"><UserPlus />Add player</Button>} /><ContributionDialog presetMatchId={matchId} trigger={<Button variant="outline" size="sm"><BanknoteArrowUp />Money in</Button>} /><ExpenseDialog presetMatchId={matchId} trigger={<Button variant="outline" size="sm"><BanknoteArrowDown />Expense</Button>} /></div></div><div className="no-print mt-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={cn("min-w-fit rounded-md px-3 py-2 text-sm font-medium transition", tab === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}<span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{item === "Attendance" ? attendance.length : item === "Contributions" ? contributions.length : expenses.length}</span></button>)}</div></CardHeader>
      <CardContent className="p-0">
        <div className={cn(tab !== "Attendance" && "hidden print:block")}><div className="hidden border-b bg-muted/50 px-5 py-3 font-semibold print:block">Attendance</div>{attendance.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Attendance</TableHead><TableHead>Expected</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead>Note</TableHead><TableHead className="no-print w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>{attendance.map((row) => { const player = data.players.find((item) => item.id === row.player_id); return <TableRow key={row.id}><TableCell><div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{initials(player?.name ?? "?")}</div><div><p className="font-semibold">{player?.name ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{player?.player_type}</p></div></div></TableCell><TableCell><Badge variant="secondary">{row.attendance_status}</Badge></TableCell><TableCell className="number-tabular">{formatBDT(row.expected_contribution)}</TableCell><TableCell className="number-tabular">{formatBDT(row.paid_amount)}</TableCell><TableCell><PaymentBadge status={row.payment_status} /></TableCell><TableCell className="text-muted-foreground">{row.notes ?? "—"}</TableCell><TableCell className="no-print"><ConfirmAction trigger={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>} title="Remove player from this match?" description="Their contribution record, if any, stays in the ledger until you remove it separately." actionLabel="Remove player" onConfirm={() => removeAttendance(row.id)} /></TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={Users} title="Nobody added yet" description="Add the friends who joined this match." />}</div>
        <div className={cn(tab !== "Contributions" && "hidden print:block")}><div className="hidden border-b bg-muted/50 px-5 py-3 font-semibold print:block">Contributions</div>{contributions.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Type</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{contributions.map((item) => { const player = data.players.find((p) => p.id === item.player_id); return <TableRow key={item.id}><TableCell className="font-semibold">{player?.name}</TableCell><TableCell><Badge variant={item.contribution_type === "Extra Support" ? "warning" : "secondary"}>{item.contribution_type}</Badge></TableCell><TableCell>{item.payment_method}</TableCell><TableCell>{formatMatchDate(item.payment_date)}</TableCell><TableCell className="number-tabular text-right font-bold text-emerald-700">+{formatBDT(item.amount)}</TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={BanknoteArrowUp} title="No money received" description="Record player fees and sponsor support for this match." />}</div>
        <div className={cn(tab !== "Expenses" && "hidden print:block")}><div className="hidden border-b bg-muted/50 px-5 py-3 font-semibold print:block">Expenses</div>{expenses.length ? <Table><TableHeader><TableRow><TableHead>Expense</TableHead><TableHead>Paid by</TableHead><TableHead>Date</TableHead><TableHead>Note</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{expenses.map((item) => { const player = data.players.find((p) => p.id === item.paid_by); return <TableRow key={item.id}><TableCell><Badge variant="info">{item.expense_type}</Badge></TableCell><TableCell>{player?.name ?? "Club fund"}</TableCell><TableCell>{formatMatchDate(item.expense_date)}</TableCell><TableCell className="text-muted-foreground">{item.notes ?? "—"}</TableCell><TableCell className="number-tabular text-right font-bold text-red-700">−{formatBDT(item.amount)}</TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={BanknoteArrowDown} title="No expenses recorded" description="The usual turf fee is added when a match is created." />}</div>
      </CardContent>
    </Card>
    {match.notes ? <div className="mt-5 rounded-xl border bg-card p-4 text-sm"><span className="font-semibold">Match note:</span> <span className="text-muted-foreground">{match.notes}</span></div> : null}
  </div>;
}
