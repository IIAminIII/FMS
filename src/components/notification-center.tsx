"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarCheck2, CircleDollarSign, ReceiptText, ShieldCheck } from "lucide-react";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { calculatePlayerDue, formatBDT, formatMatchDate } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface ActionNotice {
  id: string;
  title: string;
  description: string;
  href: "/contributions" | "/due-list" | "/matches" | "/my-account";
  type: "match" | "due" | "claim";
}

const NOTICE_STYLES = {
  match: { icon: CalendarCheck2, className: "bg-sky-50 text-sky-700" },
  due: { icon: CircleDollarSign, className: "bg-red-50 text-red-700" },
  claim: { icon: ReceiptText, className: "bg-amber-50 text-amber-700" },
} as const;

export function NotificationCenter() {
  const { data, canManage, profiles, currentUserId } = useFootball();
  const router = useRouter();
  const notices = useMemo<ActionNotice[]>(() => {
    const result: ActionNotice[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const nextMatch = data.matches
      .filter((match) => match.match_date >= today && (match.status === "Planned" || match.status === "Booked"))
      .sort((a, b) => a.match_date.localeCompare(b.match_date))[0];

    if (canManage) {
      const pendingClaims = data.paymentClaims.filter((claim) => claim.status === "Pending");
      if (pendingClaims.length) result.push({ id: "pending-claims", title: `${pendingClaims.length} payment${pendingClaims.length === 1 ? "" : "s"} awaiting review`, description: "Verify the payment details before recording money in.", href: "/contributions", type: "claim" });

      const duePlayers = data.players.map((player) => ({ player, due: Math.max(calculatePlayerDue(data, player.id) - data.paymentClaims.filter((claim) => claim.player_id === player.id && claim.status === "Pending").reduce((sum, claim) => sum + claim.amount, 0), 0) })).filter((item) => item.due > 0);
      if (duePlayers.length) result.push({ id: "player-dues", title: `${duePlayers.length} player${duePlayers.length === 1 ? " has" : "s have"} outstanding dues`, description: `${formatBDT(duePlayers.reduce((sum, item) => sum + item.due, 0))} needs follow-up.`, href: "/due-list", type: "due" });

      if (nextMatch) {
        const responded = new Set(data.attendance.filter((row) => row.match_id === nextMatch.id).map((row) => row.player_id));
        const unconfirmed = data.players.filter((player) => player.is_active && !responded.has(player.id)).length;
        if (unconfirmed) result.push({ id: `unconfirmed-${nextMatch.id}`, title: `${unconfirmed} player${unconfirmed === 1 ? "" : "s"} have not responded`, description: `Next match: ${formatMatchDate(nextMatch.match_date)} at ${nextMatch.turf_name}.`, href: "/matches", type: "match" });
      }
      return result;
    }

    const playerId = profiles.find((profile) => profile.id === currentUserId)?.player_id;
    if (!playerId) return result;
    if (nextMatch) {
      const response = data.attendance.find((row) => row.match_id === nextMatch.id && row.player_id === playerId);
      if (!response) result.push({ id: `rsvp-${nextMatch.id}`, title: "Your match response is needed", description: `${formatMatchDate(nextMatch.match_date)} at ${nextMatch.turf_name}.`, href: "/my-account", type: "match" });
    }

    const due = calculatePlayerDue(data, playerId);
    const pendingAmount = data.paymentClaims.filter((claim) => claim.player_id === playerId && claim.status === "Pending").reduce((sum, claim) => sum + claim.amount, 0);
    if (due > pendingAmount) result.push({ id: "my-due", title: `${formatBDT(due - pendingAmount)} still needs payment`, description: pendingAmount ? `${formatBDT(pendingAmount)} is already awaiting verification.` : "Submit payment details after paying.", href: "/my-account", type: "due" });

    const reviewed = data.paymentClaims.filter((claim) => claim.player_id === playerId && claim.status !== "Pending").sort((a, b) => (b.reviewed_at ?? b.created_at).localeCompare(a.reviewed_at ?? a.created_at))[0];
    if (reviewed) result.push({ id: `claim-${reviewed.id}-${reviewed.status}`, title: `Payment claim ${reviewed.status.toLowerCase()}`, description: reviewed.review_note ?? `${formatBDT(reviewed.amount)} was ${reviewed.status.toLowerCase()}.`, href: "/my-account", type: "claim" });
    return result;
  }, [canManage, currentUserId, data, profiles]);

  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative" aria-label={`${notices.length} notifications`}><Bell />{notices.length ? <span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-4 text-white">{notices.length > 9 ? "9+" : notices.length}</span> : null}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-2"><div className="flex items-center justify-between px-2 py-2"><div><p className="font-semibold">Action center</p><p className="text-xs text-muted-foreground">Live reminders from club activity</p></div><Badge variant={notices.length ? "warning" : "success"}>{notices.length} open</Badge></div><div className="mt-1 space-y-1">{notices.length ? notices.map((notice) => { const style = NOTICE_STYLES[notice.type]; const Icon = style.icon; return <DropdownMenuItem key={notice.id} className="items-start gap-3 p-3" onSelect={() => router.push(notice.href)}><div className={cn("grid size-9 shrink-0 place-items-center rounded-lg", style.className)}><Icon className="size-4" /></div><div><p className="font-medium leading-5">{notice.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notice.description}</p></div></DropdownMenuItem>; }) : <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><ShieldCheck className="size-5" /><span>Nothing needs your attention.</span></div>}</div></DropdownMenuContent></DropdownMenu>;
}