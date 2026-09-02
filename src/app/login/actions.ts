"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface LoginState { error?: string }

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true") redirect("/dashboard");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
