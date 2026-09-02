"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Search, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { PaymentBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBDT, formatMatchDate } from "@/lib/calculations";
import { initials } from "@/lib/utils";

export default function DueListPage() {
  const { data, settleDue } = useFootball();
  const [search, setSearch] = useState("");
  const [matchId, setMatchId] = useState("all");
  const rows = useMemo(() => data.attendance.filter((row) => row.attendance_status === "Joined" && row.paid_amount < row.expected_contribution).filter((row) => { const player = data.players.find((p) => p.id === row.player_id); return (player?.name.toLowerCase().includes(search.toLowerCase()) ?? false) && (matchId === "all" || row.match_id === matchId); }).sort((a, b) => (b.expected_contribution - b.paid_amount) - (a.expected_contribution - a.paid_amount)), [data.attendance, data.players, matchId, search]);
  const total = rows.reduce((sum, row) => sum + Math.max(row.expected_contribution - row.paid_amount, 0), 0);

  async function receive(id: string) { try { await settleDue(id); toast.success("Payment received and due cleared"); } catch (error) { toast.error("Could not receive payment", { description: error instanceof Error ? error.message : "Try again" }); } }

  return <><PageHeader eyebrow="Who still owes?" title="Due list" description="A focused list of outstanding match fees, with one-click payment collection." />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card className="sm:col-span-2"><CardContent className="flex items-center gap-4 p-5"><div className="grid size-12 place-items-center rounded-xl bg-red-50 text-red-700"><CircleDollarSign className="size-6" /></div><div><p className="text-sm text-muted-foreground">Outstanding in this view</p><p className="number-tabular text-3xl font-bold tracking-tight text-red-700">{formatBDT(total)}</p></div></CardContent></Card><Card><CardContent className="flex h-full items-center gap-4 p-5"><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Send className="size-5" /></div><div><p className="text-xs text-muted-foreground">Reminders needed</p><p className="text-2xl font-bold">{rows.length}</p></div></CardContent></Card></div>
    <Card><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by player…" className="ps-9" /></div><Select value={matchId} onChange={(e) => setMatchId(e.target.value)} className="sm:w-64"><option value="all">All matches</option>{data.matches.map((match) => <option value={match.id} key={match.id}>{match.match_date} · {match.turf_name}</option>)}</Select></div>
      {rows.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Match</TableHead><TableHead>Expected</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => { const player = data.players.find((p) => p.id === row.player_id); const match = data.matches.find((m) => m.id === row.match_id); const due = row.expected_contribution - row.paid_amount; return <TableRow key={row.id}><TableCell><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-red-50 text-xs font-bold text-red-700">{initials(player?.name ?? "?")}</div><div><p className="font-semibold">{player?.name}</p><p className="text-xs text-muted-foreground">{player?.phone ?? "No phone"}</p></div></div></TableCell><TableCell><p className="font-medium">{match ? formatMatchDate(match.match_date) : "Unknown"}</p><p className="text-xs text-muted-foreground">{match?.turf_name}</p></TableCell><TableCell className="number-tabular">{formatBDT(row.expected_contribution)}</TableCell><TableCell className="number-tabular">{formatBDT(row.paid_amount)}</TableCell><TableCell><PaymentBadge status={row.payment_status} /></TableCell><TableCell className="number-tabular text-right font-bold text-red-700">{formatBDT(due)}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => void receive(row.id)}><CheckCircle2 />Received</Button></TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={ShieldCheck} title="All dues are clear" description="Everyone in this view has paid their expected contribution. Beautiful." />}
    </Card></>;
}
