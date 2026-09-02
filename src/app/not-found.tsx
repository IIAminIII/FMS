import Link from "next/link";
import { Goal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Goal className="size-8" /></div><p className="text-sm font-semibold uppercase tracking-widest text-primary">404 · Offside</p><h1 className="mt-2 text-3xl font-bold tracking-tight">That page missed the goal</h1><p className="mt-2 text-muted-foreground">Head back to the clubhouse and try again.</p><Link href="/dashboard" className={`${buttonVariants()} mt-6`}>Back to dashboard</Link></div></main>;
}
