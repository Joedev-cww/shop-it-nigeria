import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — Shop It" },
      { name: "description", content: "Create your Shop It account to buy and sell handmade items safely." },
      { property: "og:title", content: "Join Shop It" },
      { property: "og:description", content: "Buy and sell handmade items with Buyer Protection." },
    ],
  }),
  component: AuthPage,
});

/** Nigerian mobile number: 0803..., +234803..., 234803... */
const NG_PHONE = /^(\+?234|0)[789][01]\d{8}$/;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const phone = form.phone.replace(/\s|-/g, "");
        if (!NG_PHONE.test(phone)) throw new Error("Enter a valid Nigerian phone number, e.g. 08031234567");
        if (form.password.length < 8 || !/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password))
          throw new Error("Password needs at least 8 characters, with letters and numbers.");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: form.name, phone } },
        });
        if (error) throw error;
        setSent(true);
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw new Error("Wrong email or password.");
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Sign-in didn't complete. Please try again."); return; }
    if (r.redirected) return;
    navigate({ to: "/account" });
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm rounded-3xl bg-card p-6 text-center shadow-card">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a link to <b>{form.email}</b>. {mode === "signup" ? "Tap it to verify your account." : "Tap it to set a new password."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{mode === "signup" ? "Join Shop It" : mode === "forgot" ? "Reset password" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buy and sell handmade, safely.</p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
        {mode === "signup" && (
          <>
            <F label="Full name"><Input required value={form.name} onChange={upd("name")} className="h-12" autoComplete="name" /></F>
            <F label="Phone number"><Input required inputMode="tel" placeholder="0803 123 4567" value={form.phone} onChange={upd("phone")} className="h-12" autoComplete="tel" /></F>
          </>
        )}
        <F label="Email"><Input required type="email" value={form.email} onChange={upd("email")} className="h-12" autoComplete="email" /></F>
        {mode !== "forgot" && (
          <F label="Password"><Input required type="password" value={form.password} onChange={upd("password")} className="h-12" autoComplete={mode === "signup" ? "new-password" : "current-password"} /></F>
        )}
        <Button disabled={busy} className="h-12 w-full rounded-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </Button>
        {mode === "signin" && (
          <button type="button" onClick={() => setMode("forgot")} className="w-full text-sm text-muted-foreground underline">Forgot password?</button>
        )}
      </form>

      {mode !== "forgot" && (
        <div className="space-y-2">
          <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => oauth("google")}>Continue with Google</Button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
        </div>
      )}

      <p className="text-center text-sm">
        {mode === "signup" ? "Already have an account? " : "New to Shop It? "}
        <button className="font-semibold text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>

      <div className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
        <p className="font-semibold">Stay safe 🛡️</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Never pay a seller directly or outside Shop It.</li>
          <li>Shop It staff will never ask for your password or OTP.</li>
        </ul>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label>{label}</Label>{children}</div>;
}
