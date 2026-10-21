/**
 * Seller ID verification. The ID photo goes to a private bucket inside a
 * folder named after the user's id; only the owner and admins can read it.
 * Under-18 sellers must add a parent/guardian (also enforced in the database).
 */
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const FIELD = "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary";

/** True when someone born on `dob` (YYYY-MM-DD) is under 18 today. */
export function isMinor(dob: string, today = new Date()): boolean {
  const d = new Date(dob);
  const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
  return eighteen > today;
}

export function VerificationCard({ shopId, userId }: { shopId: string; userId: string }) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [legalName, setLegalName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("School ID");
  const [file, setFile] = useState<File | null>(null);
  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gRel, setGRel] = useState("Parent");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("seller_verifications").select("shop_id").eq("shop_id", shopId).maybeSingle()
      .then(({ data }) => setSubmitted(!!data));
  }, [shopId]);

  if (submitted === null) return null;
  if (submitted) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-card p-4 text-sm shadow-card">
        <ShieldCheck className="h-5 w-5 text-secondary" /> ID received. Our team is reviewing your shop.
      </p>
    );
  }

  const minor = dob ? isMinor(dob) : false;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Add a photo of your ID."); return; }
    if (minor && (!gName.trim() || !gPhone.trim() || !consent)) {
      toast.error("Sellers under 18 need a parent or guardian's details and consent.");
      return;
    }
    setBusy(true);
    try {
      const blob = await compressImage(file, 1600);
      const path = `${userId}/${shopId}-id.webp`;
      const { error: upErr } = await supabase.storage.from("id-documents").upload(path, blob, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase.from("seller_verifications").insert({
        shop_id: shopId, owner_id: userId, legal_name: legalName.trim(), date_of_birth: dob,
        id_type: idType, id_document_path: path,
        guardian_name: minor ? gName.trim() : null, guardian_phone: minor ? gPhone.trim() : null,
        guardian_relationship: minor ? gRel : null, guardian_consent: minor ? consent : false,
      });
      if (error) throw error;
      toast.success("ID submitted. We'll review it soon.");
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
      <div>
        <h2 className="font-display text-xl font-bold">Verify your identity</h2>
        <p className="text-sm text-muted-foreground">Required before your shop can go live. Only Shop It staff can see this.</p>
      </div>
      <div className="space-y-1.5"><Label htmlFor="ln">Full legal name</Label>
        <input id="ln" required className={FIELD} value={legalName} onChange={(e) => setLegalName(e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="dob">Date of birth</Label>
          <input id="dob" type="date" required className={FIELD} value={dob} onChange={(e) => setDob(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="idt">ID type</Label>
          <select id="idt" className={FIELD} value={idType} onChange={(e) => setIdType(e.target.value)}>
            {["School ID", "NIN slip", "Voter's card", "Passport", "Driver's licence"].map((t) => <option key={t}>{t}</option>)}
          </select></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="idf">Photo of your ID</Label>
        <input id="idf" type="file" accept="image/*" required className="block text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      {minor && (
        <div className="space-y-3 rounded-xl bg-accent p-4">
          <p className="text-sm font-medium">You're under 18, so a parent or guardian must agree.</p>
          <input placeholder="Guardian's full name" className={FIELD} value={gName} onChange={(e) => setGName(e.target.value)} />
          <input placeholder="Guardian's phone" inputMode="tel" className={FIELD} value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
          <select className={FIELD} value={gRel} onChange={(e) => setGRel(e.target.value)}>
            {["Parent", "Guardian", "Older sibling", "Other relative"].map((r) => <option key={r}>{r}</option>)}
          </select>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            My parent or guardian agrees to me selling on Shop It, and payouts go to them or a verified account.
          </label>
        </div>
      )}
      <Button type="submit" disabled={busy} className="h-11 rounded-full px-6">
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for review
      </Button>
    </form>
  );
}
