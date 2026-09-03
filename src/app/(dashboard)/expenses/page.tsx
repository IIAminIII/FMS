"use client";

import { useMemo, useState } from "react";
import { BanknoteArrowDown, Droplets, MoreHorizontal, Pencil, Plus, Search, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { ExpenseDialog } from "@/components/entity-dialogs";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBDT, formatMatchDate, isSameMonth } from "@/lib/calculations";

export default function ExpensesPage() {
  const { data, removeEntity, canManage } = useFootball();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const rows = useMemo(() => [...data.expenses].filter((item) => {
    const payer = data.players.find((p) => p.id === item.paid_by);
    const match = data.matches.find((m) => m.id === item.match_id);
    return `${item.expense_type} ${payer?.name ?? ""} ${match?.turf_name ?? ""}`.toLowerCase().includes(search.toLowerCase()) && (type === "all" || item.expense_type === type);
  }).sort((a, b) => b.expense_date.localeCompare(a.expense_date)), [data.expenses, data.matches, data.players, search, type]);
  const total = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const monthly = data.expenses.filter((item) => isSameMonth(item.expense_date)).reduce((sum, item) => sum + item.amount, 0);
  const turf = data.expenses.filter((item) => item.expense_type === "Turf Fee").reduce((sum, item) => sum + item.amount, 0);

  async function remove(id: string) { await removeEntity("expenses", id); toast.success("Expense removed"); }

  return <><PageHeader eyebrow="Money out" title="Expenses" description="A separate, transparent list of turf fees and everything else the group paid for." actions={canManage ? <ExpenseDialog trigger={<Button><Plus />Record expense</Button>} /> : undefined} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-700"><WalletCards className="size-5" /></div><div><p className="text-xs text-muted-foreground">Spent overall</p><p className="number-tabular text-xl font-bold">{formatBDT(total)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><BanknoteArrowDown className="size-5" /></div><div><p className="text-xs text-muted-foreground">This month</p><p className="number-tabular text-xl font-bold">{formatBDT(monthly)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Droplets className="size-5" /></div><div><p className="text-xs text-muted-foreground">Turf fees overall</p><p className="number-tabular text-xl font-bold">{formatBDT(turf)}</p></div></CardContent></Card></div>
    <Card><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type, turf, or payer…" className="ps-9" /></div><Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-44"><option value="all">All expense types</option><option>Turf Fee</option><option>Ball</option><option>Water</option><option>Transport</option><option>Other</option></Select></div>
      {rows.length ? <Table><TableHeader><TableRow><TableHead>Expense</TableHead><TableHead>Match</TableHead><TableHead>Paid by</TableHead><TableHead>Date</TableHead><TableHead>Note</TableHead><TableHead className="text-right">Amount</TableHead>{canManage ? <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead> : null}</TableRow></TableHeader><TableBody>{rows.map((item) => { const player = data.players.find((p) => p.id === item.paid_by); const match = data.matches.find((m) => m.id === item.match_id); return <TableRow key={item.id}><TableCell><Badge variant={item.expense_type === "Turf Fee" ? "info" : "secondary"}>{item.expense_type}</Badge></TableCell><TableCell><p className="font-medium">{match ? formatMatchDate(match.match_date) : "General club"}</p><p className="text-xs text-muted-foreground">{match?.turf_name ?? "No match linked"}</p></TableCell><TableCell>{player?.name ?? "Club fund"}</TableCell><TableCell>{formatMatchDate(item.expense_date, { day: "numeric", month: "short", year: "numeric" })}</TableCell><TableCell className="max-w-48 truncate text-muted-foreground">{item.notes ?? "—"}</TableCell><TableCell className="number-tabular text-right font-bold text-red-700">−{formatBDT(item.amount)}</TableCell>{canManage ? <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><ExpenseDialog expense={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil />Edit</DropdownMenuItem>} /><ConfirmAction trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 />Delete</DropdownMenuItem>} title="Delete this expense?" description="This will change the match and current fund balance. This action cannot be undone." actionLabel="Delete expense" onConfirm={() => remove(item.id)} /></DropdownMenuContent></DropdownMenu></TableCell> : null}</TableRow>; })}</TableBody></Table> : <EmptyState icon={BanknoteArrowDown} title="No expenses found" description="Record a turf fee or change your filters." />}
    </Card></>;
}
