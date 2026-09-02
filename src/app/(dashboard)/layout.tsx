import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/providers/data-provider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email: string | undefined;
  if (isSupabaseConfigured() && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    const supabase = await createClient();
    const { data } = await supabase!.auth.getClaims();
    if (!data?.claims) redirect("/login");
    email = typeof data.claims.email === "string" ? data.claims.email : undefined;
  }
  return <DataProvider><AppShell userEmail={email}>{children}</AppShell></DataProvider>;
}
