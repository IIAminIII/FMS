"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Database, RotateCcw, Save, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AppRole } from "@/lib/types";

const TURF_OPTIONS = ["Fortune Sports Arena", "Intercity"] as const;
const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access, settings, and member roles" },
  { value: "treasurer", label: "Treasurer", description: "Manage matches, players, attendance, and money" },
  { value: "player", label: "Player", description: "View club records and manage their own match RSVP" },
];

const schema = z.object({
  default_match_cost: z.coerce.number().min(0),
  default_player_contribution: z.coerce.number().min(0),
  default_turf_name: z.string().min(2),
  default_start_time: z.string().min(1),
  default_end_time: z.string().min(1),
  currency: z.string().min(3),
});

export default function SettingsPage() {
  const { data, demoMode, isAdmin, profiles, currentUserId, updateSettings, updateProfileRole, updateProfilePlayer, resetDemo } = useFootball();
  const [savingProfileId, setSavingProfileId] = useState<string>();
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: data.settings });

  useEffect(() => form.reset(data.settings), [data.settings, form]);

  async function submit(values: z.output<typeof schema>) {
    try {
      await updateSettings({ ...values, id: data.settings.id });
      toast.success("Club defaults saved");
    } catch (error) {
      toast.error("Could not save settings", { description: error instanceof Error ? error.message : "Try again" });
    }
  }

  async function changeRole(profileId: string, nextRole: AppRole) {
    setSavingProfileId(profileId);
    try {
      await updateProfileRole(profileId, nextRole);
      toast.success("Member role updated", { description: "The new access takes effect after that member refreshes the app." });
    } catch (error) {
      toast.error("Could not update role", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setSavingProfileId(undefined);
    }
  }

  async function changePlayerLink(profileId: string, playerId: string | null) {
    setSavingProfileId(profileId);
    try {
      await updateProfilePlayer(profileId, playerId);
      toast.success(playerId ? "Player account linked" : "Player account unlinked");
    } catch (error) {
      toast.error("Could not update player link", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setSavingProfileId(undefined);
    }
  }
  if (!isAdmin) {
    return <><PageHeader eyebrow="Restricted" title="Admin settings" description="Club settings and member roles are available only to Admins." /><Card className="max-w-xl"><CardContent className="flex items-start gap-4 p-6"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><ShieldCheck className="size-5" /></div><div><p className="font-semibold">Your account has view or operational access</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Ask an Admin if your role needs to be changed.</p></div></CardContent></Card></>;
  }

  return <>
    <PageHeader eyebrow="Club preferences" title="Settings" description="Set match defaults and control who can change club records." />
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Settings2 className="size-5" /></div><div><CardTitle>Match defaults</CardTitle><CardDescription>These values pre-fill every new match and player.</CardDescription></div></div></CardHeader>
        <CardContent><form onSubmit={form.handleSubmit(submit)} className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="turf">Default turf name</Label><Select id="turf" {...form.register("default_turf_name")}>{Array.from(new Set([data.settings.default_turf_name, ...TURF_OPTIONS])).map((turf) => <option key={turf} value={turf}>{turf}</option>)}</Select></div><div className="space-y-2"><Label htmlFor="start">Default start time</Label><Input id="start" type="time" {...form.register("default_start_time")} /></div><div className="space-y-2"><Label htmlFor="end">Default end time</Label><Input id="end" type="time" {...form.register("default_end_time")} /></div><div className="space-y-2"><Label htmlFor="cost">Default match cost</Label><Input id="cost" type="number" step="100" {...form.register("default_match_cost")} /></div><div className="space-y-2"><Label htmlFor="contribution">Default player contribution</Label><Input id="contribution" type="number" step="50" {...form.register("default_player_contribution")} /></div><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" disabled {...form.register("currency")} /></div><div className="flex items-end justify-end"><Button type="submit" disabled={form.formState.isSubmitting}><Save />{form.formState.isSubmitting ? "Saving…" : "Save settings"}</Button></div></form></CardContent>
      </Card>
      <div className="space-y-5">
        <Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Database className="size-5" /></div><div><CardTitle>Data connection</CardTitle><CardDescription>Current workspace mode</CardDescription></div></div></CardHeader><CardContent><Badge variant={demoMode ? "warning" : "success"}>{demoMode ? "Browser demo" : "Supabase connected"}</Badge><p className="mt-3 text-sm leading-6 text-muted-foreground">{demoMode ? "Changes are saved locally in this browser. Add Supabase environment variables for secure shared access." : "Authentication and club records are securely backed by your Supabase project."}</p></CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" /></div><div><CardTitle>Privacy</CardTitle><CardDescription>Role-protected clubhouse</CardDescription></div></div></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">Supabase Row Level Security enforces Admin, Treasurer, and Player permissions for every database request.</CardContent></Card>
        {demoMode ? <Card><CardHeader><CardTitle>Reset product tour</CardTitle><CardDescription>Restore the original sample matches and payments.</CardDescription></CardHeader><CardContent><ConfirmAction trigger={<Button variant="outline" className="w-full"><RotateCcw />Reset demo data</Button>} title="Reset all demo changes?" description="This clears local edits and restores the original sample club data." actionLabel="Reset demo" onConfirm={resetDemo} /></CardContent></Card> : null}
      </div>
    </div>

    <Card className="mt-5">
      <CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><UsersRound className="size-5" /></div><div><CardTitle>Member roles</CardTitle><CardDescription>Set access and link each authenticated account to its player record.</CardDescription></div></div></CardHeader>
      <CardContent className="p-0">
        {profiles.length ? <div className="divide-y">{profiles.map((profile) => {
          const roleInfo = ROLE_OPTIONS.find((option) => option.value === profile.role)!;
          const isCurrentUser = profile.id === currentUserId;
          return <div key={profile.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold">{profile.display_name}</p>{isCurrentUser ? <Badge variant="secondary">You</Badge> : null}</div><p className="truncate text-sm text-muted-foreground">{profile.email ?? "No email"}</p><p className="mt-1 text-xs text-muted-foreground">{roleInfo.description}</p></div><div className="grid gap-2 sm:w-[360px] sm:grid-cols-2"><Select aria-label={`Linked player for ${profile.display_name}`} value={profile.player_id ?? ""} disabled={savingProfileId === profile.id} onChange={(event) => void changePlayerLink(profile.id, event.target.value || null)}><option value="">No player linked</option>{data.players.filter((player) => !profiles.some((other) => other.id !== profile.id && other.player_id === player.id)).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</Select><Select aria-label={`Role for ${profile.display_name}`} value={profile.role} disabled={isCurrentUser || savingProfileId === profile.id} onChange={(event) => void changeRole(profile.id, event.target.value as AppRole)}>{ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div></div>;
        })}</div> : <div className="p-6 text-sm text-muted-foreground">No member profiles are available yet. Run the updated Supabase schema to backfill existing Auth users.</div>}
      </CardContent>
    </Card>
  </>;
}
