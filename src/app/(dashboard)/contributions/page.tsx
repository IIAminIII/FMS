"use client";

import { useMemo, useState } from "react";
import { BanknoteArrowUp, MoreHorizontal, Pencil, Plus, Search, Trash2, TrendingUp, Trophy, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { ContributionDialog } from "@/components/entity-dialogs";
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
import { initials } from "@/lib/utils";

export default function ContributionsPage() {
  const { data, removeEntity } = useFootball();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const rows = useMemo(() => [...data.contributions].filter((item) => {
    const player = data.players.find((p) => p.id === item.player_id);
    return `${player?.name ?? ""} ${item.payment_method} ${item.contribution_type}`.toLowerCase().includes(search.toLowerCase()) && (type === "all" || item.contribution_type === type);
  }).sort((a, b) => b.payment_date.localeCompare(a.payment_date)), [data.contributions, data.players, search, type]);
  const total = data.contributions.reduce((sum, item) => sum + item.amount, 0);
  const monthly = data.contributions.filter((item) => isSameMonth(item.payment_date)).reduce((sum, item) => sum + item.amount, 0);
  const support = data.contributions.filter((item) => item.contribution_type === "Extra Support").reduce((sum, item) => sum + item.amount, 0);

  async function remove(id: string) { await removeEntity("contributions", id); toast.success("Contribution removed"); }

  return <><PageHeader eyebrow="Money in" title="Contributions" description="Every payment received from players and sponsors—never mixed with match expenses." actions={<ContributionDialog trigger={<Button><Plus />Record contribution</Button>} />} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><WalletCards className="size-5" /></div><div><p className="text-xs text-muted-foreground">Collected overall</p><p className="number-tabular text-xl font-bold">{formatBDT(total)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><TrendingUp className="size-5" /></div><div><p className="text-xs text-muted-foreground">This month</p><p className="number-tabular text-xl font-bold">{formatBDT(monthly)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Trophy className="size-5" /></div><div><p className="text-xs text-muted-foreground">Extra support</p><p className="number-tabular text-xl font-bold">{formatBDT(support)}</p></div></CardContent></Card></div>
    <Card><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search player, type, or method…" className="ps-9" /></div><Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-52"><option value="all">All contribution types</option><option>Regular Player Fee</option><option>Extra Support</option><option>Advance Fund</option><option>Adjustment</option></Select></div>
      {rows.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Match</TableHead><TableHead>Type</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((item) => { const player = data.players.find((p) => p.id === item.player_id); const match = data.matches.find((m) => m.id === item.match_id); return <TableRow key={item.id}><TableCell><div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{initials(player?.name ?? "?")}</div><div><p className="font-semibold">{player?.name ?? "Unknown"}</p>{item.notes ? <p className="max-w-44 truncate text-xs text-muted-foreground">{item.notes}</p> : null}</div></div></TableCell><TableCell className="text-muted-foreground">{match ? formatMatchDate(match.match_date) : "Club fund"}</TableCell><TableCell><Badge variant={item.contribution_type === "Extra Support" ? "warning" : "secondary"}>{item.contribution_type}</Badge></TableCell><TableCell>{item.payment_method}</TableCell><TableCell>{formatMatchDate(item.payment_date, { day: "numeric", month: "short", year: "numeric" })}</TableCell><TableCell className="number-tabular text-right font-bold text-emerald-700">+{formatBDT(item.amount)}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><ContributionDialog contribution={item} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil />Edit</DropdownMenuItem>} /><ConfirmAction trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 />Delete</DropdownMenuItem>} title="Delete this contribution?" description="This will change the match and overall balance. This action cannot be undone." actionLabel="Delete contribution" onConfirm={() => remove(item.id)} /></DropdownMenuContent></DropdownMenu></TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={BanknoteArrowUp} title="No contributions found" description="Record the first player fee or change your filters." />}
    </Card></>;
}
