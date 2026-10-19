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

/**
 * Applies the account's "low data" preference to <html data-low-data>, so the
 * stylesheet can drop hover zoom and transitions on slow networks.
 */
export function useLowDataMode() {
  const { user } = useAuth();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!user) { setOn(false); return; }
    let live = true;
    supabase
      .from("profiles")
      .select("low_data_mode")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (live) setOn(!!data?.low_data_mode); });
    return () => { live = false; };
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.lowData = on ? "true" : "false";
  }, [on]);

  return on;
}
