"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, MoreHorizontal, Pencil, Plus, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { MatchDialog } from "@/components/entity-dialogs";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { MatchBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateMatchSummary, formatBDT, formatMatchDate, formatTime } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export default function MatchesPage() {
  const { data, saveEntity } = useFootball();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(() => [...data.matches].filter((match) => `${match.turf_name} ${match.match_date}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || match.status === status)).sort((a, b) => b.match_date.localeCompare(a.match_date)), [data.matches, search, status]);

  async function setMatchStatus(match: typeof data.matches[number], next: "Completed" | "Cancelled") {
    await saveEntity("matches", { ...match, status: next });
    toast.success(next === "Completed" ? "Match marked completed" : "Match cancelled");
  }

  return <><PageHeader eyebrow="Every Saturday" title="Matches" description="Plan the next kick-off and keep a clean weekly record of attendance, money, and turf costs." actions={<MatchDialog trigger={<Button><Plus />Plan match</Button>} />} />
    <Card><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search turf or date…" className="ps-9" /></div><Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-44"><option value="all">All statuses</option><option>Planned</option><option>Booked</option><option>Completed</option><option>Cancelled</option></Select></div>
      {rows.length ? <div className="divide-y">{rows.map((match) => { const summary = calculateMatchSummary(data, match.id); return <article key={match.id} className={cn("group grid gap-5 p-5 transition hover:bg-muted/35 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(90px,.5fr))_auto] lg:items-center", match.status === "Cancelled" && "opacity-60")}><div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-center text-primary"><span className="text-lg font-bold leading-none">{new Date(`${match.match_date}T12:00:00`).getDate()}</span><span className="text-[9px] font-bold uppercase">{formatMatchDate(match.match_date, { month: "short" })}</span></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><h2 className="font-semibold">{formatMatchDate(match.match_date, { weekday: "long", day: "numeric", month: "long" })}</h2><MatchBadge status={match.status} /></div><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatTime(match.start_time)} – {formatTime(match.end_time)}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{match.turf_name}</span></div></div></div>{[{ label: "Joined", value: String(summary.joined) }, { label: "Collected", value: formatBDT(summary.collected), tone: "text-emerald-700" }, { label: "Expense", value: formatBDT(summary.expenses) }, { label: "Balance", value: formatBDT(summary.balance), tone: summary.balance < 0 ? "text-red-700" : "text-emerald-700" }].map((item) => <div key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className={cn("number-tabular mt-1 text-sm font-bold", item.tone)}>{item.value}</p></div>)}<div className="flex items-center justify-end gap-1"><Link href={`/matches/${match.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open <ArrowRight /></Link><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Match actions"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><MatchDialog match={match} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}><Pencil />Edit match</DropdownMenuItem>} />{match.status !== "Completed" && match.status !== "Cancelled" ? <DropdownMenuItem onSelect={() => void setMatchStatus(match, "Completed")}><CheckCircle2 />Mark completed</DropdownMenuItem> : null}{match.status !== "Cancelled" ? <ConfirmAction trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive"><XCircle />Cancel match</DropdownMenuItem>} title="Cancel this match?" description="The financial history stays intact, but this match will no longer count as upcoming." actionLabel="Cancel match" onConfirm={() => setMatchStatus(match, "Cancelled")} /> : null}</DropdownMenuContent></DropdownMenu></div></article>; })}</div> : <EmptyState icon={CalendarDays} title="No matches found" description="Plan the next Saturday game or change the current filters." action={<MatchDialog trigger={<Button><Plus />Plan match</Button>} />} />}
    </Card></>;
}
