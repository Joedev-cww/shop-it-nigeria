/**
 * Account — the buyer's own details. Nothing here is shown to sellers: they
 * only ever see a masked buyer id, the item, and the delivery area.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRoles, useProfile } from "@/hooks/use-auth";
import { CAMPUSES } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shop-ui";

const FIELD = "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Shop It" },
      { name: "description", content: "Manage your Shop It name, phone, delivery area and notification preferences." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [lowData, setLowData] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setArea(profile?.default_area ?? "");
    setLowData(!!profile?.low_data_mode);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    fetchMyRoles(user.id).then(setRoles);
  }, [user]);

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading your account…</p>;

  if (!user) {
    return (
      <EmptyState
        title="Sign in to manage your account"
        body="Your saved items, delivery area and notification settings live here."
        action={
          <Link to="/auth" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        }
      />
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const next = {
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      default_area: area || null,
      low_data_mode: lowData,
    };
    const { error } = await supabase.from("profiles").update(next).eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save. Check your details and try again.");
      return;
    }
    setProfile({ ...next, language: profile?.language ?? "en" });
    toast.success("Saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Your account</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {roles.map((r) => (
              <span key={r} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium capitalize text-accent-foreground">
                {r}
              </span>
            ))}
          </div>
        )}
      </header>

      <form onSubmit={save} className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-name">Full name</Label>
            <Input id="a-name" className={FIELD} value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-phone">Phone</Label>
            <Input id="a-phone" className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08031234567" inputMode="tel" maxLength={20} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-area">Where do you usually take deliveries?</Label>
          <select id="a-area" className={FIELD} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Not set yet</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Off campus">Off campus</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Sellers only ever see this area — never your name, photo, phone number or exact address.
          </p>
        </div>

        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Low-data mode <span className="block text-xs text-muted-foreground">Fewer animations and lighter pages on slow networks</span></span>
          <Switch checked={lowData} onCheckedChange={setLowData} />
        </label>

        <Button type="submit" className="h-12 w-full rounded-full" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Save changes
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link to="/wishlist" className="inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium">
          Saved items
        </Link>
        <Link to="/sell" className="inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium">
          Start selling
        </Link>
        <Button variant="ghost" className="h-11 rounded-full text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </Button>
      </div>
    </div>
  );
}
