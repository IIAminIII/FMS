"use client";

import { useMemo, useState } from "react";
import { BanknoteArrowDown, BanknoteArrowUp, CalendarDays, CalendarRange, ChartNoAxesCombined, CircleDollarSign, Download, Printer, ReceiptText, Trophy, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateMatchSummary, formatBDT, formatMatchDate } from "@/lib/calculations";
import { downloadCsv } from "@/lib/reporting";
import { cn } from "@/lib/utils";

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("en-BD", { month: "long", year: "numeric" }).format(new Date(`${key}-15T12:00:00`));
}

interface LedgerRow {
  id: string;
  date: string;
  kind: "Contribution" | "Expense";
  details: string;
  match: string;
  method: string;
  notes: string;
  moneyIn: number;
  moneyOut: number;
}

export default function ReportsPage() {
  const { data } = useFootball();
  const [period, setPeriod] = useState("all");
  const monthOptions = useMemo(() => Array.from(new Set([
    ...data.contributions.map((item) => monthKey(item.payment_date)),
    ...data.expenses.map((item) => monthKey(item.expense_date)),
    ...data.matches.map((item) => monthKey(item.match_date)),
  ])).sort().reverse(), [data.contributions, data.expenses, data.matches]);
  const periodLabel = period === "all" ? "All-time statement" : monthLabel(period);
  const contributionRows = useMemo(() => period === "all" ? data.contributions : data.contributions.filter((item) => monthKey(item.payment_date) === period), [data.contributions, period]);
  const expenseRows = useMemo(() => period === "all" ? data.expenses : data.expenses.filter((item) => monthKey(item.expense_date) === period), [data.expenses, period]);
  const matchRows = useMemo(() => (period === "all" ? data.matches : data.matches.filter((item) => monthKey(item.match_date) === period)).toSorted((a, b) => b.match_date.localeCompare(a.match_date)), [data.matches, period]);
  const matchIds = useMemo(() => new Set(matchRows.map((match) => match.id)), [matchRows]);

  const collected = contributionRows.reduce((sum, item) => sum + item.amount, 0);
  const spent = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  const sponsor = contributionRows.filter((item) => item.contribution_type === "Extra Support" || data.players.find((player) => player.id === item.player_id)?.player_type === "Boss / Sponsor").reduce((sum, item) => sum + item.amount, 0);
  const periodDue = data.attendance.filter((item) => matchIds.has(item.match_id) && item.attendance_status === "Joined").reduce((sum, item) => sum + Math.max(item.expected_contribution - item.paid_amount, 0), 0);
  const appearances = data.attendance.filter((item) => matchIds.has(item.match_id) && item.attendance_status === "Joined").length;
  const monthly = monthOptions.toReversed().slice(-6).map((key) => ({
    key,
    collected: data.contributions.filter((item) => monthKey(item.payment_date) === key).reduce((sum, item) => sum + item.amount, 0),
    spent: data.expenses.filter((item) => monthKey(item.expense_date) === key).reduce((sum, item) => sum + item.amount, 0),
  }));
  const chartMax = Math.max(1, ...monthly.flatMap((month) => [month.collected, month.spent]));
  const players = data.players.map((player) => ({
    player,
    total: contributionRows.filter((item) => item.player_id === player.id).reduce((sum, item) => sum + item.amount, 0),
    sponsor: contributionRows.filter((item) => item.player_id === player.id && item.contribution_type === "Extra Support").reduce((sum, item) => sum + item.amount, 0),
    due: data.attendance.filter((item) => item.player_id === player.id && matchIds.has(item.match_id) && item.attendance_status === "Joined").reduce((sum, item) => sum + Math.max(item.expected_contribution - item.paid_amount, 0), 0),
  })).filter((row) => row.total > 0 || row.due > 0).sort((a, b) => b.total - a.total);
  const ledgerRows = useMemo<LedgerRow[]>(() => [
    ...contributionRows.map((item) => {
      const player = data.players.find((candidate) => candidate.id === item.player_id);
      const match = data.matches.find((candidate) => candidate.id === item.match_id);
      return { id: `in-${item.id}`, date: item.payment_date, kind: "Contribution" as const, details: player?.name ?? "Unknown player", match: match?.turf_name ?? "Club fund", method: item.payment_method, notes: item.notes ?? "", moneyIn: item.amount, moneyOut: 0 };
    }),
    ...expenseRows.map((item) => {
      const match = data.matches.find((candidate) => candidate.id === item.match_id);
      const payer = data.players.find((candidate) => candidate.id === item.paid_by);
      return { id: `out-${item.id}`, date: item.expense_date, kind: "Expense" as const, details: item.expense_type, match: match?.turf_name ?? "Club expense", method: payer ? `Paid by ${payer.name}` : "Club fund", notes: item.notes ?? "", moneyIn: 0, moneyOut: item.amount };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind)), [contributionRows, data.matches, data.players, expenseRows]);

  function exportCsv() {
    downloadCsv(`football-statement-${period}`, [
      ["Saturday Football Fund Manager"],
      ["Period", periodLabel],
      ["Collection", collected],
      ["Expenses", spent],
      ["Net balance", collected - spent],
      ["Outstanding due", periodDue],
      [],
      ["Date", "Kind", "Player or type", "Match or account", "Method or payer", "Notes", "Money in", "Money out", "Running net"],
      ...ledgerRows.map((item, index) => [item.date, item.kind, item.details, item.match, item.method, item.notes, item.moneyIn || "", item.moneyOut || "", ledgerRows.slice(index).reduce((sum, row) => sum + row.moneyIn - row.moneyOut, 0)]),
    ]);
  }

  return <>
    <div className="print-only mb-6 border-b pb-4"><p className="text-xs font-semibold uppercase tracking-[0.14em]">Saturday Football Fund Manager</p><h1 className="mt-1 text-2xl font-bold">{periodLabel}</h1><p className="mt-1 text-sm text-muted-foreground">Financial statement and club activity report</p></div>
    <PageHeader eyebrow="Know the numbers" title="Reports" description="Period-correct statements, player balances, match results, and an audit-friendly transaction ledger." actions={<><Select aria-label="Report period" value={period} onChange={(event) => setPeriod(event.target.value)} className="no-print w-48"><option value="all">All time</option>{monthOptions.map((month) => <option value={month} key={month}>{monthLabel(month)}</option>)}</Select><Button className="no-print" variant="outline" onClick={() => window.print()}><Printer />Print / PDF</Button><Button className="no-print" variant="outline" onClick={exportCsv}><Download />Export CSV</Button></>} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{[
      { label: "Collection", value: formatBDT(collected), helper: `${contributionRows.length} entries`, icon: BanknoteArrowUp, color: "bg-emerald-50 text-emerald-700" },
      { label: "Expenses", value: formatBDT(spent), helper: `${expenseRows.length} entries`, icon: BanknoteArrowDown, color: "bg-red-50 text-red-700" },
      { label: "Net balance", value: formatBDT(collected - spent), helper: periodLabel, icon: ChartNoAxesCombined, color: "bg-sky-50 text-sky-700" },
      { label: "Outstanding due", value: formatBDT(periodDue), helper: "Joined matches in period", icon: CircleDollarSign, color: "bg-red-50 text-red-700" },
      { label: "Matches", value: String(matchRows.length), helper: `${appearances} joined appearances`, icon: CalendarDays, color: "bg-violet-50 text-violet-700" },
      { label: "Sponsor support", value: formatBDT(sponsor), helper: "Extra and sponsor funds", icon: Trophy, color: "bg-amber-50 text-amber-700" },
    ].map(({ label, value, helper, icon: Icon, color }) => <Card key={label}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{label}</p><p className="number-tabular mt-1 text-xl font-bold">{value}</p></div><div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", color)}><Icon className="size-4" /></div></div><p className="mt-3 text-xs text-muted-foreground">{helper}</p></CardContent></Card>)}</section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><Card><CardHeader><CardTitle>Monthly collection vs expense</CardTitle><CardDescription>Last six active months in the ledger</CardDescription></CardHeader><CardContent>{monthly.length ? <div className="flex h-60 items-end gap-4 border-b border-l px-4 pt-5 sm:gap-7">{monthly.map((month) => <div key={month.key} className="flex h-full flex-1 flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><div title={`Collected ${formatBDT(month.collected)}`} className="w-[38%] min-w-3 rounded-t-md bg-primary transition-all" style={{ height: `${Math.max((month.collected / chartMax) * 100, 3)}%` }} /><div title={`Spent ${formatBDT(month.spent)}`} className="w-[38%] min-w-3 rounded-t-md bg-amber-400 transition-all" style={{ height: `${Math.max((month.spent / chartMax) * 100, 3)}%` }} /></div><p className="py-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">{monthLabel(month.key).replace("20", "'")}</p></div>)}</div> : <p className="py-20 text-center text-sm text-muted-foreground">No monthly activity yet.</p>}<div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary" />Collection</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-amber-400" />Expense</span></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Expense mix</CardTitle><CardDescription>Where the match fund went</CardDescription></CardHeader><CardContent className="space-y-4">{["Turf Fee", "Ball", "Water", "Transport", "Other"].map((type) => { const value = expenseRows.filter((item) => item.expense_type === type).reduce((sum, item) => sum + item.amount, 0); const percentage = spent ? (value / spent) * 100 : 0; return <div key={type}><div className="mb-1.5 flex justify-between text-sm"><span>{type}</span><span className="number-tabular font-semibold">{formatBDT(value)}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>; })}</CardContent></Card></section>

    <Card className="mt-5"><CardHeader><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-sky-50 text-sky-700"><ReceiptText className="size-4" /></div><div><CardTitle>Transaction ledger</CardTitle><CardDescription>Every approved money-in and expense entry for {periodLabel.toLowerCase()}</CardDescription></div></div></CardHeader><CardContent className="p-0">{ledgerRows.length ? <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Kind</TableHead><TableHead>Details</TableHead><TableHead>Match / account</TableHead><TableHead>Method / payer</TableHead><TableHead className="text-right">Money in</TableHead><TableHead className="text-right">Money out</TableHead></TableRow></TableHeader><TableBody>{ledgerRows.map((item) => <TableRow key={item.id}><TableCell className="whitespace-nowrap font-medium">{formatMatchDate(item.date, { day: "numeric", month: "short", year: "numeric" })}</TableCell><TableCell><Badge variant={item.kind === "Contribution" ? "success" : "danger"}>{item.kind}</Badge></TableCell><TableCell><p className="font-semibold">{item.details}</p>{item.notes ? <p className="max-w-56 truncate text-xs text-muted-foreground">{item.notes}</p> : null}</TableCell><TableCell>{item.match}</TableCell><TableCell className="text-muted-foreground">{item.method}</TableCell><TableCell className="number-tabular text-right font-semibold text-emerald-700">{item.moneyIn ? formatBDT(item.moneyIn) : "—"}</TableCell><TableCell className="number-tabular text-right font-semibold text-red-700">{item.moneyOut ? formatBDT(item.moneyOut) : "—"}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState icon={ReceiptText} title="No transactions in this period" description="Choose another month or record the first contribution or expense." />}</CardContent></Card>

    <Card className="mt-5"><CardHeader><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-4" /></div><div><CardTitle>Player contribution report</CardTitle><CardDescription>Total paid, period due, and sponsor support by player</CardDescription></div></div></CardHeader><CardContent className="p-0">{players.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Total paid</TableHead><TableHead className="text-right">Sponsor support</TableHead><TableHead className="text-right">Due in period</TableHead></TableRow></TableHeader><TableBody>{players.map(({ player, total, sponsor: support, due }) => <TableRow key={player.id}><TableCell className="font-semibold">{player.name}</TableCell><TableCell><Badge variant={player.player_type === "Boss / Sponsor" ? "warning" : "secondary"}>{player.player_type}</Badge></TableCell><TableCell className="number-tabular text-right font-semibold text-emerald-700">{formatBDT(total)}</TableCell><TableCell className="number-tabular text-right">{formatBDT(support)}</TableCell><TableCell className={cn("number-tabular text-right font-semibold", due > 0 && "text-red-700")}>{formatBDT(due)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState icon={Users} title="No player activity in this period" description="Player payments and joined-match dues will appear here." />}</CardContent></Card>

    <Card className="mt-5"><CardHeader><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-sky-50 text-sky-700"><CalendarRange className="size-4" /></div><div><CardTitle>Match history report</CardTitle><CardDescription>Attendance and match-level financial result for the selected period</CardDescription></div></div></CardHeader><CardContent className="p-0">{matchRows.length ? <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Turf</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Joined</TableHead><TableHead className="text-right">Collection</TableHead><TableHead className="text-right">Expense</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader><TableBody>{matchRows.map((match) => { const summary = calculateMatchSummary(data, match.id); return <TableRow key={match.id}><TableCell className="font-semibold">{formatMatchDate(match.match_date)}</TableCell><TableCell>{match.turf_name}</TableCell><TableCell><MatchBadge status={match.status} /></TableCell><TableCell className="text-right">{summary.joined}</TableCell><TableCell className="number-tabular text-right text-emerald-700">{formatBDT(summary.collected)}</TableCell><TableCell className="number-tabular text-right">{formatBDT(summary.expenses)}</TableCell><TableCell className={cn("number-tabular text-right font-bold", summary.balance < 0 ? "text-red-700" : "text-emerald-700")}>{formatBDT(summary.balance)}</TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={CalendarRange} title="No matches in this period" description="Choose another month to view its match history." />}</CardContent></Card>
  </>;
}