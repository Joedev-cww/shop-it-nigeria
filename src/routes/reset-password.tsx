import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Shop It" },
      { name: "description", content: "Choose a new password for your Shop It account." },
      { property: "og:title", content: "Reset password — Shop It" },
      { property: "og:description", content: "Choose a new password for your Shop It account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/account" });
  }
  return (
    <form onSubmit={save} className="mx-auto max-w-sm space-y-3 rounded-3xl bg-card p-5 shadow-card">
      <h1 className="text-2xl font-bold">New password</h1>
      <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className="h-12" autoComplete="new-password" />
      <Button className="h-12 w-full rounded-full">Save password</Button>
    </form>
  );
}
