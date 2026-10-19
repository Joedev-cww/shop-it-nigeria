import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Current signed-in user (client only). `loading` is true until the first check finishes. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/** Roles for the current user, read from the protected user_roles table. */
export async function fetchMyRoles(userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role);
}

export type Profile = {
  full_name: string | null;
  phone: string | null;
  default_area: string | null;
  language: string;
  low_data_mode: boolean;
};

/** The signed-in account's own profile row (null while signed out). */
export function useProfile() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let live = true;
    supabase
      .from("profiles")
      .select("full_name,phone,default_area,language,low_data_mode")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (live) setProfile((data ?? null) as Profile | null); });
    return () => { live = false; };
  }, [user]);

  return { user, loading, profile, setProfile };
}

/**
 * Applies the account's "low data" preference to <html data-low-data>, so the
 * stylesheet can drop hover zoom and transitions on slow networks.
 */
export function useLowDataMode() {
  const { profile } = useProfile();
  const on = !!profile?.low_data_mode;

  useEffect(() => {
    document.documentElement.setAttribute("data-low-data", on ? "true" : "false");
  }, [on]);

  return on;
}
