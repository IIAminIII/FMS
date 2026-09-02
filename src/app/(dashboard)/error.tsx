"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Card className="mx-auto max-w-xl p-8 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-red-50 text-red-700"><AlertTriangle className="size-6" /></div><h1 className="text-xl font-bold">Something went offside</h1><p className="mt-2 text-sm text-muted-foreground">{error.message || "The page could not be loaded. Your saved records are safe."}</p><Button className="mt-5" onClick={reset}><RotateCcw />Try again</Button></Card>;
}
