"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { NotificationCenter } from "@/components/notification-center";
import { useFootball } from "@/components/providers/data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { calculatePlayerDue } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-account", label: "My account", icon: CircleUserRound },
  { href: "/matches", label: "Matches", icon: CalendarDays },
  { href: "/players", label: "Players", icon: Users },
  { href: "/contributions", label: "Contributions", icon: BanknoteArrowUp },
  { href: "/expenses", label: "Expenses", icon: BanknoteArrowDown },
  { href: "/due-list", label: "Due list", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;


function NavLink({ item, dueCount, onClick }: { item: (typeof navItems)[number]; dueCount: number; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} className={cn("group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", active ? "bg-white/10 text-white" : "text-sidebar-muted hover:bg-white/6 hover:text-white") }>
      <Icon className={cn("size-[18px]", active && "text-emerald-400")} />
      <span>{item.label}</span>
      {item.label === "Due list" && dueCount > 0 ? <span className="ms-auto rounded-full bg-red-400/15 px-1.5 py-0.5 text-[10px] font-bold text-red-300">{dueCount}</span> : null}
    </Link>
  );
}

export function AppShell({ children, userEmail }: { children: ReactNode; userEmail?: string }) {
  const { data, role, isAdmin } = useFootball();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const current = navItems.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
  const dueCount = data.players.filter((player) => calculatePlayerDue(data, player.id) > 0).length;
  const visibleNavItems = isAdmin ? navItems : navItems.filter((item) => item.href !== "/settings");
  const roleLabel = role === "admin" ? "Admin" : role === "treasurer" ? "Treasurer" : "Player";
  const mobileHrefs: readonly string[] = role === "player"
    ? ["/dashboard", "/my-account", "/matches", "/due-list"]
    : ["/dashboard", "/matches", "/contributions", "/due-list"];
  const bottomItems = navItems.filter((item) => mobileHrefs.includes(item.href));

  async function signOut() {
    const supabase = createClient();
    if (!supabase) {
      toast.info("Demo mode is always available");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="no-print fixed inset-y-0 start-0 z-40 hidden w-[248px] flex-col overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <div className="pitch-pattern absolute inset-0 opacity-50" />
        <div className="relative flex h-20 items-center gap-3 px-5">
          <BrandMark />
          <div>
            <p className="font-semibold tracking-tight">Saturday Football</p>
            <p className="text-xs text-sidebar-muted">Fund Manager</p>
          </div>
        </div>
        <div className="relative mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.055] p-3">
          <div className="flex items-center gap-2 text-xs text-sidebar-muted"><span className="size-1.5 rounded-full bg-emerald-400" />Weekly game</div>
          <p className="mt-1 text-sm font-semibold text-white">Saturday · 7:00 AM</p>
        </div>
        <nav className="relative flex-1 space-y-1 px-3" aria-label="Main navigation">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted/75">Clubhouse</p>
          {visibleNavItems.map((item) => <NavLink key={item.href} item={item} dueCount={dueCount} />)}
        </nav>
        <div className="relative m-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.055] p-3">
            <div className="grid size-9 place-items-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">FM</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{roleLabel}</p>
              <p className="truncate text-xs text-sidebar-muted">{userEmail ?? "Demo workspace"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="me-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div>
            <p className="text-sm font-semibold sm:text-base">{current?.label ?? "Saturday Football"}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Keep the game simple. Keep the fund clear.</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">{roleLabel}</Badge>
            <Badge variant="success" className="hidden sm:inline-flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Live fund</Badge>
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2"><span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">FM</span><ChevronDown className="size-3.5 text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin ? <DropdownMenuItem onSelect={() => router.push("/settings")}><Settings /> Settings</DropdownMenuItem> : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="print-full px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="pitch-pattern absolute inset-y-0 start-0 flex w-[280px] flex-col bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
            <div className="mb-5 flex items-center gap-3 px-1 py-2"><BrandMark /><div><p className="font-semibold">Saturday Football</p><p className="text-xs text-sidebar-muted">Fund Manager</p></div><Button variant="ghost" size="icon" className="ms-auto text-white hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(false)}><X /></Button></div>
            <nav className="space-y-1">{visibleNavItems.map((item) => <NavLink key={item.href} item={item} dueCount={dueCount} onClick={() => setMobileOpen(false)} />)}</nav>
          </aside>
        </div>
      ) : null}

      <nav className="no-print fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border bg-card/95 p-1.5 shadow-[0_12px_40px_oklch(0.2_0.03_150/0.2)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        {bottomItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground", active && "bg-primary/10 text-primary")}><Icon className="size-[18px]" />{item.label === "Contributions" ? "Money" : item.label === "My account" ? "Me" : item.label}</Link>;
        })}
        <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground"><Menu className="size-[18px]" />More</button>
      </nav>
    </div>
  );
}
