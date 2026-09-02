"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Database, RotateCcw, Save, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  default_match_cost: z.coerce.number().min(0),
  default_player_contribution: z.coerce.number().min(0),
  default_turf_name: z.string().min(2),
  default_start_time: z.string().min(1),
  default_end_time: z.string().min(1),
  currency: z.string().min(3),
});

export default function SettingsPage() {
  const { data, demoMode, updateSettings, resetDemo } = useFootball();
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: data.settings });
  useEffect(() => form.reset(data.settings), [data.settings, form]);
  async function submit(values: z.output<typeof schema>) { try { await updateSettings({ ...values, id: data.settings.id }); toast.success("Club defaults saved"); } catch (error) { toast.error("Could not save settings", { description: error instanceof Error ? error.message : "Try again" }); } }

  return <><PageHeader eyebrow="Club preferences" title="Settings" description="Set the defaults that make planning each Saturday fast and consistent." />
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]"><Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Settings2 className="size-5" /></div><div><CardTitle>Match defaults</CardTitle><CardDescription>These values pre-fill every new match and player.</CardDescription></div></div></CardHeader><CardContent><form onSubmit={form.handleSubmit(submit)} className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="turf">Default turf name</Label><Input id="turf" {...form.register("default_turf_name")} /></div><div className="space-y-2"><Label htmlFor="start">Default start time</Label><Input id="start" type="time" {...form.register("default_start_time")} /></div><div className="space-y-2"><Label htmlFor="end">Default end time</Label><Input id="end" type="time" {...form.register("default_end_time")} /></div><div className="space-y-2"><Label htmlFor="cost">Default match cost</Label><Input id="cost" type="number" step="100" {...form.register("default_match_cost")} /></div><div className="space-y-2"><Label htmlFor="contribution">Default player contribution</Label><Input id="contribution" type="number" step="50" {...form.register("default_player_contribution")} /></div><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Input id="currency" disabled {...form.register("currency")} /></div><div className="flex items-end justify-end"><Button type="submit" disabled={form.formState.isSubmitting}><Save />{form.formState.isSubmitting ? "Saving…" : "Save settings"}</Button></div></form></CardContent></Card>
      <div className="space-y-5"><Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Database className="size-5" /></div><div><CardTitle>Data connection</CardTitle><CardDescription>Current workspace mode</CardDescription></div></div></CardHeader><CardContent><Badge variant={demoMode ? "warning" : "success"}>{demoMode ? "Browser demo" : "Supabase connected"}</Badge><p className="mt-3 text-sm leading-6 text-muted-foreground">{demoMode ? "Changes are saved locally in this browser. Add Supabase environment variables for secure shared access." : "Authentication and club records are securely backed by your Supabase project."}</p></CardContent></Card><Card><CardHeader><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" /></div><div><CardTitle>Privacy</CardTitle><CardDescription>Protected clubhouse</CardDescription></div></div></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">With Supabase connected, Proxy verifies every session and database Row Level Security blocks public access.</CardContent></Card>{demoMode ? <Card><CardHeader><CardTitle>Reset product tour</CardTitle><CardDescription>Restore the original sample matches and payments.</CardDescription></CardHeader><CardContent><ConfirmAction trigger={<Button variant="outline" className="w-full"><RotateCcw />Reset demo data</Button>} title="Reset all demo changes?" description="This clears local edits and restores the original sample club data." actionLabel="Reset demo" onConfirm={resetDemo} /></CardContent></Card> : null}</div>
    </div></>;
}
