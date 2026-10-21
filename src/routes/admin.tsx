/**
 * Admin: review new seller shops. Only admins/moderators see pending shops
 * (database access rules), and only admins can open ID photos. Approval is
 * refused by the database unless the seller submitted ID verification.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRoles, useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/shop-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Seller approvals — Shop It admin" },
      { name: "description", content: "Review and approve new Shop It sellers." },
      { property: "og:title", content: "Seller approvals — Shop It admin" },
      { property: "og:description", content: "Review and approve new Shop It sellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Pending = {
  id: string; name: string; campus: string | null; created_at: string; is_minor: boolean;
  seller_verifications: { legal_name: string; date_of_birth: string; id_type: string; id_document_path: string; guardian_name: string | null; guardian_phone: string | null; guardian_relationship: string | null } | null;
};

function AdminPage() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Pending[] | null>(null);
  const [v, setV] = useState(0);

  useEffect(() => { if (user) fetchMyRoles(user.id).then(setRoles); }, [user]);
  const staff = !!roles && (roles.includes("admin") || roles.includes("moderator"));

  useEffect(() => {
    if (!staff) return;
    supabase.from("shops")
      .select("id,name,campus,created_at,is_minor,seller_verifications(legal_name,date_of_birth,id_type,id_document_path,guardian_name,guardian_phone,guardian_relationship)")
      .eq("status", "pending").order("created_at")
      .then(({ data }) => setRows((data ?? []) as unknown as Pending[]));
  }, [staff, v]);

  if (loading || (user && roles === null)) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!user || !staff) {
    return <EmptyState title="Staff only" body="This area is for the Shop It team." action={<Link to="/" className="text-sm underline">Back home</Link>} />;
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("shops").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Shop approved." : "Shop rejected.");
    setV((x) => x + 1);
  }

  async function viewId(path: string) {
    const { data, error } = await supabase.storage.from("id-documents").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Only admins can open ID photos."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Seller approvals</h1>
      {rows === null ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <EmptyState title="All caught up" body="No shops are waiting for review." />
      ) : rows.map((s) => {
        const ver = s.seller_verifications;
        return (
          <article key={s.id} className="space-y-3 rounded-2xl bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <span className="text-sm text-muted-foreground">{s.campus ?? "No campus"}</span>
              {s.is_minor && <span className="rounded-full bg-accent px-2 py-0.5 text-xs">Under 18</span>}
            </div>
            {ver ? (
              <div className="text-sm">
                <p>{ver.legal_name} · born {ver.date_of_birth} · {ver.id_type}</p>
                {ver.guardian_name && <p>Guardian: {ver.guardian_name} ({ver.guardian_relationship}) · {ver.guardian_phone}</p>}
                <button className="mt-1 underline" onClick={() => viewId(ver.id_document_path)}>Open ID photo</button>
              </div>
            ) : <p className="text-sm text-muted-foreground">ID not submitted yet — cannot approve.</p>}
            <div className="flex gap-2">
              <Button disabled={!ver} onClick={() => decide(s.id, "approved")} className="rounded-full">Approve</Button>
              <Button variant="outline" onClick={() => decide(s.id, "rejected")} className="rounded-full">Reject</Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
