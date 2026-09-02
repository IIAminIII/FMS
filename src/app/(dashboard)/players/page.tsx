"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MoreHorizontal, Pencil, Plus, Search, UserRoundX, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { PlayerDialog } from "@/components/entity-dialogs";
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
import { calculatePlayerDue, formatBDT } from "@/lib/calculations";
import { cn, initials } from "@/lib/utils";

export default function PlayersPage() {
  const { data, saveEntity } = useFootball();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const rows = useMemo(() => data.players.filter((player) => {
    const matchesSearch = `${player.name} ${player.phone ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (type === "all" || player.player_type === type);
  }), [data.players, search, type]);

  const stats = data.players.map((player) => {
    const contributions = data.contributions.filter((item) => item.player_id === player.id);
    const total = contributions.reduce((sum, item) => sum + item.amount, 0);
    const extra = contributions.filter((item) => item.contribution_type === "Extra Support").reduce((sum, item) => sum + item.amount, 0);
    return { player, total, extra, due: calculatePlayerDue(data, player.id) };
  });

  async function toggleActive(player: typeof data.players[number]) {
    await saveEntity("players", { ...player, is_active: !player.is_active });
    toast.success(player.is_active ? `${player.name} deactivated` : `${player.name} is active again`);
  }

  return <><PageHeader eyebrow="The squad" title="Players" description="Manage the friends who play, their usual fee, and their complete payment position." actions={<PlayerDialog trigger={<Button><Plus />Add player</Button>} />} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Users className="size-5" /></div><div><p className="text-xs text-muted-foreground">Active players</p><p className="text-xl font-bold">{data.players.filter((p) => p.is_active).length}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><WalletCards className="size-5" /></div><div><p className="text-xs text-muted-foreground">All-time player payments</p><p className="number-tabular text-xl font-bold">{formatBDT(data.contributions.reduce((sum, c) => sum + c.amount, 0))}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-700"><UserRoundX className="size-5" /></div><div><p className="text-xs text-muted-foreground">Players with due</p><p className="text-xl font-bold">{stats.filter((s) => s.due > 0).length}</p></div></CardContent></Card></div>
    <Card><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player or phone…" className="ps-9" /></div><Select value={type} onChange={(event) => setType(event.target.value)} className="sm:w-48"><option value="all">All player types</option><option>Regular</option><option>Occasional</option><option>Boss / Sponsor</option><option>Guest</option></Select></div>
      {rows.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Type</TableHead><TableHead>Default</TableHead><TableHead>Total paid</TableHead><TableHead>Due</TableHead><TableHead>Extra support</TableHead><TableHead>Status</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>{rows.map((player) => { const stat = stats.find((item) => item.player.id === player.id)!; return <TableRow key={player.id} className={cn(!player.is_active && "opacity-55")}><TableCell><div className="flex items-center gap-3"><div className={cn("grid size-9 place-items-center rounded-full text-xs font-bold", player.player_type === "Boss / Sponsor" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary")}>{initials(player.name)}</div><div><p className="font-semibold">{player.name}</p><p className="text-xs text-muted-foreground">{player.phone ?? "No phone"}</p></div></div></TableCell><TableCell><Badge variant={player.player_type === "Boss / Sponsor" ? "warning" : "secondary"}>{player.player_type}</Badge></TableCell><TableCell className="number-tabular">{formatBDT(player.default_contribution)}</TableCell><TableCell className="number-tabular font-semibold text-emerald-700">{formatBDT(stat.total)}</TableCell><TableCell className={cn("number-tabular font-semibold", stat.due > 0 ? "text-red-700" : "text-muted-foreground")}>{formatBDT(stat.due)}</TableCell><TableCell className="number-tabular">{formatBDT(stat.extra)}</TableCell><TableCell>{player.is_active ? <Badge variant="success"><CheckCircle2 className="size-3" /> Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${player.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><PlayerDialog player={player} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}><Pencil />Edit player</DropdownMenuItem>} /><ConfirmAction trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()} className={player.is_active ? "text-destructive" : ""}>{player.is_active ? <UserRoundX /> : <CheckCircle2 />}{player.is_active ? "Deactivate" : "Reactivate"}</DropdownMenuItem>} title={player.is_active ? `Deactivate ${player.name}?` : `Reactivate ${player.name}?`} description="Payment history stays safe. This only changes whether the player appears in quick-add lists." actionLabel={player.is_active ? "Deactivate" : "Reactivate"} onConfirm={() => toggleActive(player)} /></DropdownMenuContent></DropdownMenu></TableCell></TableRow>; })}</TableBody></Table> : <EmptyState icon={Users} title="No players found" description="Try a different filter, or add the first player to your squad." />}
    </Card></>;
}
