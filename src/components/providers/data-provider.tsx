"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { calculatePaymentStatus } from "@/lib/calculations";
import { createSeedData } from "@/lib/seed";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AppData, AppRole, Attendance, AttendanceStatus, Contribution, EntityMap, Expense, Match, Player, Profile, Settings } from "@/lib/types";

const STORAGE_KEY = "sffm-data-v1";

type NewEntity<K extends keyof EntityMap> = Omit<EntityMap[K], "id" | "created_at"> & Partial<Pick<EntityMap[K], "id" | "created_at">>;

interface FootballContextValue {
  data: AppData;
  loading: boolean;
  demoMode: boolean;
  role: AppRole;
  profiles: Profile[];
  canManage: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  saveEntity: <K extends keyof EntityMap>(table: K, item: NewEntity<K>) => Promise<EntityMap[K]>;
  removeEntity: <K extends keyof EntityMap>(table: K, id: string) => Promise<void>;
  addMatch: (item: NewEntity<"matches">) => Promise<Match>;
  addContribution: (item: NewEntity<"contributions">) => Promise<Contribution>;
  addExpense: (item: NewEntity<"expenses">) => Promise<Expense>;
  addAttendance: (matchId: string, playerId: string) => Promise<Attendance>;
  settleDue: (attendanceId: string, method?: Contribution["payment_method"]) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  updateProfileRole: (profileId: string, role: AppRole) => Promise<void>;
  updateProfilePlayer: (profileId: string, playerId: string | null) => Promise<void>;
  respondToMatch: (matchId: string, status: AttendanceStatus) => Promise<Attendance>;
  resetDemo: () => void;
}

const FootballContext = createContext<FootballContextValue | null>(null);

function normalizeNumbers(data: AppData): AppData {
  return {
    ...data,
    players: data.players.map((item) => ({ ...item, default_contribution: Number(item.default_contribution) })),
    matches: data.matches.map((item) => ({ ...item, match_cost: Number(item.match_cost) })),
    attendance: data.attendance.map((item) => ({ ...item, expected_contribution: Number(item.expected_contribution), paid_amount: Number(item.paid_amount) })),
    contributions: data.contributions.map((item) => ({ ...item, amount: Number(item.amount) })),
    expenses: data.expenses.map((item) => ({ ...item, amount: Number(item.amount) })),
    settings: {
      ...data.settings,
      default_match_cost: Number(data.settings.default_match_cost),
      default_player_contribution: Number(data.settings.default_player_contribution),
    },
  };
}

export function DataProvider({ children, initialRole = "admin", currentUserId }: { children: ReactNode; initialRole?: AppRole; currentUserId?: string }) {
  const [data, setData] = useState<AppData>(() => createSeedData());
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const demoMode = !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const role: AppRole = demoMode ? "admin" : initialRole;
  const canManage = role === "admin" || role === "treasurer";
  const isAdmin = role === "admin";
  const activeUserId = demoMode ? "demo-manager" : currentUserId;

  useEffect(() => {
    let active = true;

    async function load() {
      if (demoMode) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && active) {
          try {
            setData(normalizeNumbers(JSON.parse(saved) as AppData));
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
        if (active) {
          setProfiles([{ id: "demo-manager", email: null, display_name: "Demo manager", role: "admin", player_id: "p-mahadi", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
          setLoading(false);
        }
        return;
      }

      const supabase = createClient();
      if (!supabase) return;
      const [players, matches, attendance, contributions, expenses, settings, profileRows] = await Promise.all([
        supabase.from("players").select("*").order("name"),
        supabase.from("matches").select("*").order("match_date", { ascending: false }),
        supabase.from("attendance").select("*"),
        supabase.from("contributions").select("*").order("payment_date", { ascending: false }),
        supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
        supabase.from("settings").select("*").limit(1).maybeSingle(),
        supabase.from("profiles").select("*").order("created_at"),
      ]);
      const firstError = [players.error, matches.error, attendance.error, contributions.error, expenses.error, settings.error, profileRows.error].find(Boolean);
      if (firstError) {
        toast.error("Could not load Supabase data", { description: firstError.message });
      } else if (active) {
        const seed = createSeedData();
        setData(normalizeNumbers({
          players: (players.data ?? []) as Player[],
          matches: (matches.data ?? []) as Match[],
          attendance: (attendance.data ?? []) as Attendance[],
          contributions: (contributions.data ?? []) as Contribution[],
          expenses: (expenses.data ?? []) as Expense[],
          settings: (settings.data as Settings | null) ?? { ...seed.settings, id: crypto.randomUUID() },
        }));
        setProfiles((profileRows.data ?? []) as Profile[]);
      }
      if (active) setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode && !loading) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, demoMode, loading]);

  const saveEntity = useCallback(async <K extends keyof EntityMap>(table: K, item: NewEntity<K>) => {
    if (!canManage) throw new Error("Your Player role has read-only access.");
    const complete = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
      created_at: item.created_at ?? new Date().toISOString(),
    } as EntityMap[K];

    if (!demoMode) {
      const supabase = createClient();
      const { error } = await supabase!.from(table).upsert(complete);
      if (error) throw error;
    }

    setData((current) => ({
      ...current,
      [table]: (current[table] as EntityMap[K][]).some((row) => row.id === complete.id)
        ? (current[table] as EntityMap[K][]).map((row) => (row.id === complete.id ? complete : row))
        : [complete, ...(current[table] as EntityMap[K][])],
    }));
    return complete;
  }, [canManage, demoMode]);

  const removeEntity = useCallback(async <K extends keyof EntityMap>(table: K, id: string) => {
    if (!canManage) throw new Error("Your Player role has read-only access.");
    if (!demoMode) {
      const supabase = createClient();
      const { error } = await supabase!.from(table).delete().eq("id", id);
      if (error) throw error;
    }
    setData((current) => {
      const removedContribution = table === "contributions"
        ? current.contributions.find((item) => item.id === id)
        : undefined;
      const nextTable = (current[table] as EntityMap[K][]).filter((item) => item.id !== id);
      if (!removedContribution?.match_id) return { ...current, [table]: nextTable };
      const remainingContributions = current.contributions.filter((item) => item.id !== id);
      const paid = remainingContributions
        .filter((item) => item.match_id === removedContribution.match_id && item.player_id === removedContribution.player_id)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        ...current,
        [table]: nextTable,
        attendance: current.attendance.map((row) =>
          row.match_id === removedContribution.match_id && row.player_id === removedContribution.player_id
            ? { ...row, paid_amount: paid, payment_status: calculatePaymentStatus(row.expected_contribution, paid) }
            : row,
        ),
      };
    });
  }, [canManage, demoMode]);

  const addMatch = useCallback(async (item: NewEntity<"matches">) => {
    const match = await saveEntity("matches", item);
    if (demoMode) {
      await saveEntity("expenses", {
        match_id: match.id,
        expense_type: "Turf Fee",
        amount: match.match_cost,
        paid_by: null,
        expense_date: match.match_date,
        notes: "Auto-added turf fee",
      });
    } else {
      const supabase = createClient();
      const { data: expense } = await supabase!
        .from("expenses")
        .select("*")
        .eq("match_id", match.id)
        .eq("expense_type", "Turf Fee")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (expense) {
        setData((current) => ({ ...current, expenses: [expense as Expense, ...current.expenses] }));
      }
    }
    return match;
  }, [demoMode, saveEntity]);

  const addContribution = useCallback(async (item: NewEntity<"contributions">) => {
    const contribution = await saveEntity("contributions", item);
    if (demoMode && contribution.match_id) {
      setData((current) => {
        const paid = current.contributions
          .filter((row) => row.match_id === contribution.match_id && row.player_id === contribution.player_id && row.id !== contribution.id)
          .reduce((sum, row) => sum + row.amount, contribution.amount);
        return {
          ...current,
          attendance: current.attendance.map((row) =>
            row.match_id === contribution.match_id && row.player_id === contribution.player_id
              ? { ...row, paid_amount: paid, payment_status: calculatePaymentStatus(row.expected_contribution, paid) }
              : row,
          ),
        };
      });
    }
    return contribution;
  }, [demoMode, saveEntity]);

  const addExpense = useCallback((item: NewEntity<"expenses">) => saveEntity("expenses", item), [saveEntity]);

  const addAttendance = useCallback(async (matchId: string, playerId: string) => {
    const player = data.players.find((item) => item.id === playerId);
    if (!player) throw new Error("Player not found");
    const paid = data.contributions
      .filter((item) => item.match_id === matchId && item.player_id === playerId)
      .reduce((sum, item) => sum + item.amount, 0);
    return saveEntity("attendance", {
      match_id: matchId,
      player_id: playerId,
      attendance_status: "Joined",
      expected_contribution: player.default_contribution,
      paid_amount: paid,
      payment_status: calculatePaymentStatus(player.default_contribution, paid),
      notes: null,
    });
  }, [data.contributions, data.players, saveEntity]);

  const settleDue = useCallback(async (attendanceId: string, method: Contribution["payment_method"] = "Cash") => {
    const row = data.attendance.find((item) => item.id === attendanceId);
    if (!row) throw new Error("Attendance record not found");
    const due = Math.max(row.expected_contribution - row.paid_amount, 0);
    if (!due) return;
    await addContribution({
      match_id: row.match_id,
      player_id: row.player_id,
      amount: due,
      contribution_type: "Regular Player Fee",
      payment_method: method,
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "Due payment received",
    });
  }, [addContribution, data.attendance]);

  const updateSettings = useCallback(async (settings: Settings) => {
    if (!isAdmin) throw new Error("Only an Admin can update club settings.");
    if (!demoMode) {
      const supabase = createClient();
      const { error } = await supabase!.from("settings").upsert(settings);
      if (error) throw error;
    }
    setData((current) => ({ ...current, settings }));
  }, [demoMode, isAdmin]);

  const updateProfileRole = useCallback(async (profileId: string, nextRole: AppRole) => {
    if (!isAdmin) throw new Error("Only an Admin can change member roles.");
    if (!demoMode) {
      const supabase = createClient();
      const { data: updated, error } = await supabase!.from("profiles").update({ role: nextRole }).eq("id", profileId).select("*").single();
      if (error) throw error;
      setProfiles((current) => current.map((profile) => profile.id === profileId ? updated as Profile : profile));
      return;
    }
    setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, role: nextRole, updated_at: new Date().toISOString() } : profile));
  }, [demoMode, isAdmin]);

  const updateProfilePlayer = useCallback(async (profileId: string, playerId: string | null) => {
    if (!isAdmin) throw new Error("Only an Admin can link member accounts to players.");
    if (!demoMode) {
      const supabase = createClient();
      const { data: updated, error } = await supabase!.from("profiles").update({ player_id: playerId }).eq("id", profileId).select("*").single();
      if (error) throw error;
      setProfiles((current) => current.map((profile) => profile.id === profileId ? updated as Profile : profile));
      return;
    }
    setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, player_id: playerId, updated_at: new Date().toISOString() } : profile));
  }, [demoMode, isAdmin]);

  const respondToMatch = useCallback(async (matchId: string, status: AttendanceStatus) => {
    const profile = profiles.find((item) => item.id === activeUserId);
    if (!profile?.player_id) throw new Error("Your account is not linked to a player yet.");

    let response: Attendance;
    if (!demoMode) {
      const supabase = createClient();
      const { data: result, error } = await supabase!.rpc("respond_to_match", {
        target_match_id: matchId,
        target_status: status,
      });
      if (error) throw error;
      const raw = (Array.isArray(result) ? result[0] : result) as Attendance | null;
      if (!raw) throw new Error("The RSVP could not be saved.");
      response = {
        ...raw,
        expected_contribution: Number(raw.expected_contribution),
        paid_amount: Number(raw.paid_amount),
      };
    } else {
      const player = data.players.find((item) => item.id === profile.player_id);
      if (!player?.is_active) throw new Error("The linked player is not active.");
      const existing = data.attendance.find((item) => item.match_id === matchId && item.player_id === player.id);
      response = existing
        ? { ...existing, attendance_status: status }
        : {
            id: crypto.randomUUID(),
            match_id: matchId,
            player_id: player.id,
            attendance_status: status,
            expected_contribution: player.default_contribution,
            paid_amount: 0,
            payment_status: calculatePaymentStatus(player.default_contribution, 0),
            notes: "Player RSVP",
            created_at: new Date().toISOString(),
          };
    }

    setData((current) => ({
      ...current,
      attendance: current.attendance.some((item) => item.id === response.id)
        ? current.attendance.map((item) => item.id === response.id ? response : item)
        : [response, ...current.attendance],
    }));
    return response;
  }, [activeUserId, data.attendance, data.players, demoMode, profiles]);
  const resetDemo = useCallback(() => {
    const fresh = createSeedData();
    window.localStorage.removeItem(STORAGE_KEY);
    setData(fresh);
    toast.success("Demo data restored");
  }, []);

  const value = useMemo<FootballContextValue>(() => ({
    data,
    loading,
    demoMode,
    role,
    profiles,
    canManage,
    isAdmin,
    currentUserId: activeUserId,
    saveEntity,
    removeEntity,
    addMatch,
    addContribution,
    addExpense,
    addAttendance,
    settleDue,
    updateSettings,
    updateProfileRole,
    updateProfilePlayer,
    respondToMatch,
    resetDemo,
  }), [data, loading, demoMode, role, profiles, canManage, isAdmin, activeUserId, saveEntity, removeEntity, addMatch, addContribution, addExpense, addAttendance, settleDue, updateSettings, updateProfileRole, updateProfilePlayer, respondToMatch, resetDemo]);

  return <FootballContext.Provider value={value}>{children}</FootballContext.Provider>;
}

export function useFootball() {
  const value = useContext(FootballContext);
  if (!value) throw new Error("useFootball must be used inside DataProvider");
  return value;
}
