"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { login, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? "Signing in…" : "Enter the clubhouse"}{pending ? null : <ArrowRight />}</Button>;
}

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      {state.error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{state.error}</div> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative"><Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" name="email" type="email" autoComplete="email" placeholder="manager@example.com" className="ps-10" required={!demoMode} disabled={demoMode} /></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><span className="text-xs text-muted-foreground">Supabase Auth</span></div>
        <div className="relative"><LockKeyhole className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className="ps-10" required={!demoMode} disabled={demoMode} /></div>
      </div>
      <SubmitButton />
      {demoMode ? <p className="text-center text-xs leading-5 text-muted-foreground">Demo mode is active because Supabase credentials are not configured. Your changes stay in this browser.</p> : null}
    </form>
  );
}
