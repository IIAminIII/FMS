"use client";

import { useMemo, useState } from "react";
import { BanknoteArrowDown, BanknoteArrowUp, CalendarRange, ChartNoAxesCombined, Download, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateMatchSummary, calculatePlayerDue, formatBDT, formatMatchDate } from "@/lib/calculations";
import { cn } from "@/lib/utils";

function monthKey(date: string) { return date.slice(0, 7); }
function monthLabel(key: string) { return new Intl.DateTimeFormat("en-BD", { month: "short", year: "2-digit" }).format(new Date(`${key}-15T12:00:00`)); }

export default function ReportsPage() {
  const { data } = useFootball();
  const [period, setPeriod] = useState("all");
  const monthOptions = useMemo(() => Array.from(new Set([...data.contributions.map((i) => monthKey(i.payment_date)), ...data.expenses.map((i) => monthKey(i.expense_date))])).sort().reverse(), [data.contributions, data.expenses]);
  const contributionRows = period === "all" ? data.contributions : data.contributions.filter((i) => monthKey(i.payment_date) === period);
  const expenseRows = period === "all" ? data.expenses : data.expenses.filter((i) => monthKey(i.expense_date) === period);
  const collected = contributionRows.reduce((sum, i) => sum + i.amount, 0);
  const spent = expenseRows.reduce((sum, i) => sum + i.amount, 0);
  const sponsor = contributionRows.filter((i) => i.contribution_type === "Extra Support" || data.players.find((p) => p.id === i.player_id)?.player_type === "Boss / Sponsor").reduce((sum, i) => sum + i.amount, 0);
  const monthly = [...monthOptions].reverse().slice(-6).map((key) => ({ key, collected: data.contributions.filter((i) => monthKey(i.payment_date) === key).reduce((s, i) => s + i.amount, 0), spent: data.expenses.filter((i) => monthKey(i.expense_date) === key).reduce((s, i) => s + i.amount, 0) }));
  const chartMax = Math.max(1, ...monthly.flatMap((m) => [m.collected, m.spent]));
  const players = data.players.map((player) => ({ player, total: contributionRows.filter((i) => i.player_id === player.id).reduce((s, i) => s + i.amount, 0), sponsor: contributionRows.filter((i) => i.player_id === player.id && i.contribution_type === "Extra Support").reduce((s, i) => s + i.amount, 0), due: calculatePlayerDue(data, player.id) })).filter((row) => row.total > 0 || row.due > 0).sort((a, b) => b.total - a.total);

  function exportCsv() {
    const lines = ["Date,Kind,Player or Type,Amount", ...contributionRows.map((i) => `${i.payment_date},Contribution,"${data.players.find((p) => p.id === i.player_id)?.name ?? "Unknown"}",${i.amount}`), ...expenseRows.map((i) => `${i.expense_date},Expense,"${i.expense_type}",${i.amount}`)];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `football-report-${period}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <><PageHeader eyebrow="Know the numbers" title="Reports" description="Simple, honest summaries for the group—monthly money, player contributions, sponsor support, and match history." actions={<><Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44"><option value="all">All time</option>{monthOptions.map((m) => <option value={m} key={m}>{monthLabel(m)}</option>)}</Select><Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button></>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Collection", value: collected, icon: BanknoteArrowUp, color: "bg-emerald-50 text-emerald-700" },
      { label: "Expenses", value: spent, icon: BanknoteArrowDown, color: "bg-red-50 text-red-700" },
      { label: "Net balance", value: collected - spent, icon: ChartNoAxesCombined, color: "bg-sky-50 text-sky-700" },
      { label: "Sponsor contribution", value: sponsor, icon: Trophy, color: "bg-amber-50 text-amber-700" },
    ].map(({ label, value, icon: Icon, color }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><div className={cn("grid size-10 place-items-center rounded-xl", color)}><Icon className="size-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="number-tabular text-xl font-bold">{formatBDT(value)}</p></div></CardContent></Card>)}</section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><Card><CardHeader><CardTitle>Monthly collection vs expense</CardTitle><CardDescription>Last six active months in the ledger</CardDescription></CardHeader><CardContent>{monthly.length ? <div className="flex h-60 items-end gap-4 border-b border-l px-4 pt-5 sm:gap-7">{monthly.map((month) => <div key={month.key} className="flex h-full flex-1 flex-col justify-end"><div className="flex flex-1 items-end justify-center gap-1"><div title={`Collected ${formatBDT(month.collected)}`} className="w-[38%] min-w-3 rounded-t-md bg-primary transition-all" style={{ height: `${Math.max((month.collected / chartMax) * 100, 3)}%` }} /><div title={`Spent ${formatBDT(month.spent)}`} className="w-[38%] min-w-3 rounded-t-md bg-amber-400 transition-all" style={{ height: `${Math.max((month.spent / chartMax) * 100, 3)}%` }} /></div><p className="py-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">{monthLabel(month.key)}</p></div>)}</div> : <p className="py-20 text-center text-sm text-muted-foreground">No monthly activity yet.</p>}<div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary" />Collection</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-amber-400" />Expense</span></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Expense mix</CardTitle><CardDescription>Where the match fund went</CardDescription></CardHeader><CardContent className="space-y-4">{["Turf Fee", "Ball", "Water", "Transport", "Other"].map((type) => { const value = expenseRows.filter((i) => i.expense_type === type).reduce((s, i) => s + i.amount, 0); const pct = spent ? (value / spent) * 100 : 0; return <div key={type}><div className="mb-1.5 flex justify-between text-sm"><span>{type}</span><span className="number-tabular font-semibold">{formatBDT(value)}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></div>; })}</CardContent></Card></section>

    <Card className="mt-5"><CardHeader><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-4" /></div><div><CardTitle>Player contribution report</CardTitle><CardDescription>Total paid, outstanding due, and sponsor support by player</CardDescription></div></div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Total paid</TableHead><TableHead className="text-right">Sponsor support</TableHead><TableHead className="text-right">Current due</TableHead></TableRow></TableHeader><TableBody>{players.map(({ player, total, sponsor: support, due }) => <TableRow key={player.id}><TableCell className="font-semibold">{player.name}</TableCell><TableCell><Badge variant={player.player_type === "Boss / Sponsor" ? "warning" : "secondary"}>{player.player_type}</Badge></TableCell><TableCell className="number-tabular text-right font-semibold text-emerald-700">{formatBDT(total)}</TableCell><TableCell className="number-tabular text-right">{formatBDT(support)}</TableCell><TableCell className={cn("number-tabular text-right font-semibold", due > 0 && "text-red-700")}>{formatBDT(due)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

    <Card className="mt-5"><CardHeader><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-sky-50 text-sky-700"><CalendarRange className="size-4" /></div><div><CardTitle>Match history report</CardTitle><CardDescription>Attendance and match-level financial result</CardDescription></div></div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Turf</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Joined</TableHead><TableHead className="text-right">Collection</TableHead><TableHead className="text-right">Expense</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader><TableBody>{[...data.matches].sort((a, b) => b.match_date.localeCompare(a.match_date)).map((match) => { const summary = calculateMatchSummary(data, match.id); return <TableRow key={match.id}><TableCell className="font-semibold">{formatMatchDate(match.match_date)}</TableCell><TableCell>{match.turf_name}</TableCell><TableCell><MatchBadge status={match.status} /></TableCell><TableCell className="text-right">{summary.joined}</TableCell><TableCell className="number-tabular text-right text-emerald-700">{formatBDT(summary.collected)}</TableCell><TableCell className="number-tabular text-right">{formatBDT(summary.expenses)}</TableCell><TableCell className={cn("number-tabular text-right font-bold", summary.balance < 0 ? "text-red-700" : "text-emerald-700")}>{formatBDT(summary.balance)}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
  </>;
}
