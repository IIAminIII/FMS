import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/providers/data-provider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email: string | undefined;
  let currentUserId: string | undefined;
  let role: AppRole = "admin";
  if (isSupabaseConfigured() && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    const supabase = await createClient();
    const { data } = await supabase!.auth.getClaims();
    if (!data?.claims) redirect("/login");
    email = typeof data.claims.email === "string" ? data.claims.email : undefined;
    currentUserId = typeof data.claims.sub === "string" ? data.claims.sub : undefined;
    if (currentUserId) {
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", currentUserId).maybeSingle();
      role = (profile?.role as AppRole | undefined) ?? "player";
    }
  }
  return <DataProvider initialRole={role} currentUserId={currentUserId}><AppShell userEmail={email}>{children}</AppShell></DataProvider>;
}
