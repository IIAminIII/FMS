import type { Metadata } from "next";
import { Banknote, CalendarCheck2, ShieldCheck, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const features = [
  { icon: CalendarCheck2, label: "Plan Saturday matches" },
  { icon: UsersRound, label: "Know who joined & paid" },
  { icon: Banknote, label: "See the real fund balance" },
];

export default function LoginPage() {
  const demoMode = !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="pitch-pattern relative hidden overflow-hidden bg-sidebar p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -start-36 top-1/2 size-[520px] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute -start-16 top-1/2 size-[250px] -translate-y-1/2 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><BrandMark /><div><p className="font-semibold">Saturday Football</p><p className="text-xs text-white/55">Fund Manager</p></div></div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">One fund. Zero confusion.</p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.05em] xl:text-6xl">More football.<br /><span className="text-emerald-300">Less হিসাব.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">The friendly clubhouse for attendance, weekly collections, turf costs, and Emranul Hasan&apos;s generous support.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">{features.map(({ icon: Icon, label }) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.055] p-4"><Icon className="mb-3 size-5 text-emerald-300" /><p className="text-sm font-medium leading-5">{label}</p></div>)}</div>
        </div>
        <p className="relative text-xs text-white/35">Built for friends who play every Saturday morning.</p>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><BrandMark /><div><p className="font-semibold">Saturday Football</p><p className="text-xs text-muted-foreground">Fund Manager</p></div></div>
          <Card className="border-0 shadow-[0_20px_70px_oklch(0.25_0.04_150/0.12)] sm:border">
            <CardHeader className="pb-5">
              <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>{demoMode ? "Take a tour with the ready-to-use sample club." : "Sign in to manage your Saturday football fund."}</CardDescription>
            </CardHeader>
            <CardContent><LoginForm demoMode={demoMode} /></CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-muted-foreground">Private workspace · Protected with Supabase Auth</p>
        </div>
      </section>
    </main>
  );
}
