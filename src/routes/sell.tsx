/**
 * Sell — one shop per account, plus the seller's own listings.
 *
 * The price a seller types is what they receive. The Shop It fee and the
 * buyer-facing price are added by a database trigger, never by the browser,
 * so a tampered request can never change what a buyer is charged.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ImagePlus, Loader2, Plus, Store, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCategories } from "@/lib/catalog.functions";
import { CAMPUSES, containsContactInfo, naira } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shop-ui";

const PHOTO_BUCKET = "product-images";
const FIELD = "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary";
const AREA = "min-h-24 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary";
const PILL = "inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  logo_url: string | null;
  campus: string | null;
  city: string | null;
  instagram: string | null;
  tiktok: string | null;
  status: string;
  vacation_mode: boolean;
};

type ListingRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  seller_price: number;
  service_fee: number;
  display_price: number;
  stock: number;
  status: string;
  pickup_available: boolean;
  local_delivery: boolean;
  local_delivery_fee: number;
  buyer_rider: boolean;
  min_order_for_delivery: number;
  allows_custom: boolean;
  view_count: number;
};

type Category = { slug: string; name: string; emoji: string | null };

/** URL-safe handle from a shop name: "Ada's Beads" -> "adas-beads". */
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "shop";
}

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell your handmade items — Shop It" },
      { name: "description", content: "Open a Shop It shop, list your beads, scents and bags, and get paid safely in Naira." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { user, loading } = useAuth();
  const [shop, setShop] = useState<ShopRow | null>(null);
  const [checking, setChecking] = useState(true);
  const [version, setVersion] = useState(0);

  // An owner can always read their own shop at any status (pending, rejected...).
  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let live = true;
    supabase
      .from("shops")
      .select("id,slug,name,bio,logo_url,campus,city,instagram,tiktok,status,vacation_mode")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setShop((data ?? null) as ShopRow | null);
        setChecking(false);
      });
    return () => {
      live = false;
    };
  }, [user]);

  if (loading || checking) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading your shop…</p>;
  }

  if (!user) {
    return (
      <EmptyState
        title="Sign in to start selling"
        body="Create a free account, open your shop, and our team approves new sellers within a day."
        action={
          <Link to="/auth" className={PILL}>
            Sign in or create account
          </Link>
        }
      />
    );
  }

  if (!shop) return <ShopForm onCreated={setShop} />;

  return (
    <div className="space-y-6">
      <ShopHeader shop={shop} onUpdated={setShop} />
      <ListingForm shop={shop} onAdded={() => setVersion((v) => v + 1)} />
      <MyListings shop={shop} version={version} onChanged={() => setVersion((v) => v + 1)} />
    </div>
  );
}

// ---------------------------------------------------------------- shop setup

function ShopForm({ onCreated }: { onCreated: (s: ShopRow) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [campus, setCampus] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    // Instant nudge only — the database check is the one that actually blocks.
    if (containsContactInfo(name) || containsContactInfo(bio)) {
      toast.error("Remove phone numbers, links or handles from your shop name and bio.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("shops")
      .insert({
        owner_id: user.id,
        slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        bio: bio.trim() || null,
        campus: campus || null,
        city: city.trim() || null,
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
      })
      .select("id,slug,name,bio,logo_url,campus,city,instagram,tiktok,status,vacation_mode")
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Shop created — it goes live once our team approves it");
    onCreated(data as unknown as ShopRow);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" aria-hidden />
        <h1 className="font-display text-xl font-bold">Open your shop</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Your shop page shows your name, bio, campus and ratings. Buyers never see your phone number, and you never
        share your exact address.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="shop-name">Shop name</Label>
        <Input id="shop-name" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada's Bead Studio" maxLength={60} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shop-bio">Short bio</Label>
        <Textarea id="shop-bio" className={AREA} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Handmade beads and hair accessories, made between lectures." maxLength={400} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shop-campus">Campus or area</Label>
          <select id="shop-campus" className={FIELD} value={campus} onChange={(e) => setCampus(e.target.value)}>
            <option value="">Not on campus</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-city">City</Label>
          <Input id="shop-city" className={FIELD} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shop-ig">Instagram (shown on your page)</Label>
          <Input id="shop-ig" className={FIELD} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="adasbeads" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shop-tk">TikTok (shown on your page)</Label>
          <Input id="shop-tk" className={FIELD} value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="adasbeads" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Social links are for display only. Chat and payment stay inside Shop It so your Buyer Protection still works.
      </p>

      <Button type="submit" className="h-12 w-full rounded-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Create shop
      </Button>
    </form>
  );
}

function ShopHeader({ shop, onUpdated }: { shop: ShopRow; onUpdated: (s: ShopRow) => void }) {
  const notice =
    shop.status === "pending"
      ? "Awaiting approval. You can add listings now — they go live the moment your shop is approved."
      : shop.status === "rejected"
        ? "We could not approve this shop. Open a support ticket to ask why."
        : shop.status === "suspended"
          ? "This shop is paused. Our team will contact you."
          : null;

  return (
    <header className="space-y-3 rounded-2xl bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
        <StatusChip status={shop.status} />
        {shop.campus && <span className="text-sm text-muted-foreground">{shop.campus}</span>}
      </div>
      {notice && <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">{notice}</p>}
      <div className="flex flex-wrap items-center gap-4">
        {shop.status === "approved" && (
          <Link to="/shop/$slug" params={{ slug: shop.slug }} className="text-sm font-medium text-secondary underline">
            View my shop page
          </Link>
        )}
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={shop.vacation_mode}
            onCheckedChange={async (on) => {
              const { error } = await supabase.from("shops").update({ vacation_mode: on }).eq("id", shop.id);
              if (error) { toast.error("Could not update vacation mode."); return; }
              onUpdated({ ...shop, vacation_mode: on });
              toast.success(on ? "Vacation mode on — your listings are hidden." : "Welcome back — your listings are visible.");
            }}
          />
          Vacation mode
        </label>
      </div>
    </header>
  );
}

function StatusChip({ status }: { status: string }) {
  const copy: Record<string, string> = {
    pending: "Pending approval",
    approved: "Live",
    rejected: "Rejected",
    suspended: "Suspended",
    pending_review: "In review",
    active: "Live",
    hidden: "Hidden",
  };
  const tone = status === "approved" || status === "active" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{copy[status] ?? status}</span>;
}

// ------------------------------------------------------------- add a listing

function ListingForm({ shop, onAdded }: { shop: ShopRow; onAdded: () => void }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [pickup, setPickup] = useState(true);
  const [local, setLocal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [rider, setRider] = useState(false);
  const [custom, setCustom] = useState(false);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fee preview only. The database recalculates the real fee on save.
  const [fee, setFee] = useState({ mode: "flat", flat_fee: 500, tier1_max: 2000, tier1_fee: 200, tier2_max: 10000, tier2_fee: 500, tier3_percent: 5, zero_fee_promo: false });
  useEffect(() => {
    supabase.from("fee_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => data && setFee(data as typeof fee));
  }, []);
  useEffect(() => {
    getCategories().then((c) => setCategories(c as Category[]));
  }, []);

  const sellerPrice = Math.max(0, Math.round(Number(price) || 0));
  const feeAmount = previewFee(sellerPrice, fee);

  function previewFee(p: number, s: typeof fee) {
    if (!p) return 0;
    if (s.zero_fee_promo) return 0;
    if (s.mode === "flat") return s.flat_fee;
    if (p < s.tier1_max) return s.tier1_fee;
    if (p <= s.tier2_max) return s.tier2_fee;
    return Math.ceil((p * Number(s.tier3_percent)) / 100);
  }

  function pickFiles(files: FileList | null) {
    const picked = Array.from(files ?? []).slice(0, 5 - photos.length);
    setPhotos((prev) => [...prev, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (sellerPrice < 100) { toast.error("Your price must be at least ₦100."); return; }
    if (containsContactInfo(title) || containsContactInfo(description)) {
      toast.error("Remove phone numbers, links or handles — the listing will be rejected.");
      return;
    }
    setBusy(true);
    try {
      const { data: created, error } = await supabase
        .from("products")
        .insert({
          shop_id: shop.id,
          category_id: categoryId || null,
          title: title.trim(),
          description: description.trim(),
          seller_price: sellerPrice,
          stock: Math.max(0, Math.round(Number(stock) || 0)),
          pickup_available: pickup,
          local_delivery: local,
          local_delivery_fee: local ? Math.max(0, Math.round(Number(deliveryFee) || 0)) : 0,
          buyer_rider: rider,
          min_order_for_delivery: local ? Math.max(0, Math.round(Number(minOrder) || 0)) : 0,
          allows_custom: custom,
        })
        .select("id")
        .single();
      if (error || !created) {
        toast.error(error?.message ?? "Could not save the listing.");
        return;
      }

      // Photos are resized and re-encoded in the browser first: that strips the
      // GPS data phones embed, and keeps uploads small on slow networks.
      const urls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const blob = await compressImage(photos[i].file);
        const path = `${user.id}/${created.id}-${i}.webp`;
        const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/webp" });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl);
      }
      if (urls.length) {
        await supabase.from("product_images").insert(urls.map((url, position) => ({ product_id: created.id, url, position })));
      }

      toast.success("Listing saved");
      setTitle(""); setDescription(""); setPrice(""); setStock("1"); setLocal(false); setRider(false); setCustom(false);
      setPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.url)); return []; });
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Your photos did not upload. Edit the listing to add them.");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="font-display text-xl font-bold">Add an item</h2>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-title">Title</Label>
        <Input id="p-title" className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Handmade red bead necklace" maxLength={90} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" className={AREA} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Materials, size, how long it takes you to make it." maxLength={1200} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-cat">Category</Label>
          <select id="p-cat" className={FIELD} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Pick a category</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.emoji ?? ""} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-stock">How many do you have?</Label>
          <Input id="p-stock" className={FIELD} type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-price">Your price (₦)</Label>
        <Input id="p-price" className={FIELD} type="number" min={100} step={50} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" required />
        {sellerPrice >= 100 && (
          <p className="rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
            You get {naira(sellerPrice)} · Shop It fee {naira(feeAmount)} · buyer pays {naira(sellerPrice + feeAmount)}.
            <span className="mt-1 block text-muted-foreground">
              You set your price. The fee is added on top automatically, so you always take home what you asked for.
            </span>
          </p>
        )}
      </div>

      <fieldset className="space-y-2 rounded-xl border p-3">
        <legend className="px-1 text-sm font-semibold">Delivery</legend>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Pickup at a campus hub <span className="block text-xs text-muted-foreground">Cheapest for the buyer</span></span>
          <Switch checked={pickup} onCheckedChange={setPickup} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Local delivery <span className="block text-xs text-muted-foreground">You or a rider takes it there</span></span>
          <Switch checked={local} onCheckedChange={setLocal} />
        </label>
        {local && (
          <div className="grid gap-3 pl-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-fee">Your delivery charge (₦)</Label>
              <Input id="p-fee" className={FIELD} type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-min">Minimum order for delivery (₦)</Label>
              <Input id="p-min" className={FIELD} type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0" />
            </div>
          </div>
        )}
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Buyer arranges their own rider</span>
          <Switch checked={rider} onCheckedChange={setRider} />
        </label>
      </fieldset>

      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Open to custom orders <span className="block text-xs text-muted-foreground">Buyers request a colour or size in-app</span></span>
        <Switch checked={custom} onCheckedChange={setCustom} />
      </label>

      <div className="space-y-2">
        <Label>Photos (up to 5)</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <img key={p.url} src={p.url} alt="" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
          ))}
          {photos.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground">
              <ImagePlus className="h-5 w-5" aria-hidden /> Add
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => pickFiles(e.target.files)} />
      </div>

      <Button type="submit" className="h-12 w-full rounded-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Save listing
      </Button>
    </form>
  );
}

// ---------------------------------------------------------- my listings list

function MyListings({ shop, version, onChanged }: { shop: ShopRow; version: number; onChanged: () => void }) {
  const [rows, setRows] = useState<ListingRow[] | null>(null);

  useEffect(() => {
    let live = true;
    supabase
      .from("products")
      .select("id,slug,title,description,seller_price,service_fee,display_price,stock,status,pickup_available,local_delivery,local_delivery_fee,buyer_rider,min_order_for_delivery,allows_custom,view_count")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (live) setRows((data ?? []) as unknown as ListingRow[]); });
    return () => { live = false; };
  }, [shop.id, version]);

  async function setStatus(row: ListingRow, status: "active" | "hidden") {
    const { error } = await supabase.from("products").update({ status }).eq("id", row.id);
    if (error) { toast.error("Could not change that listing."); return; }
    toast.success(status === "hidden" ? "Listing hidden" : "Listing live");
    onChanged();
  }

  async function remove(row: ListingRow) {
    const { error } = await supabase.from("products").delete().eq("id", row.id);
    if (error) { toast.error("Could not delete that listing."); return; }
    toast.success("Listing deleted");
    onChanged();
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold">My listings</h2>
      {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {rows !== null && rows.length === 0 && (
        <EmptyState title="No listings yet" body="Add your first item above. New sellers get their first three listings checked by our team before they go live." />
      )}
      {rows?.map((row) => (
        <article key={row.id} className="space-y-2 rounded-2xl bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link to="/p/$slug" params={{ slug: row.slug }} className="font-sans text-sm font-semibold underline-offset-2 hover:underline">
              {row.title}
            </Link>
            <StatusChip status={row.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            You get {naira(row.seller_price)} · fee {naira(row.service_fee)} · buyer pays {naira(row.display_price)} ·{" "}
            {row.stock} in stock · {row.view_count} views
          </p>
          <div className="flex flex-wrap gap-2">
            {row.status === "active" && (
              <Button size="sm" variant="outline" className="h-9 rounded-full" onClick={() => setStatus(row, "hidden")}>
                <EyeOff className="h-4 w-4" aria-hidden /> Hide
              </Button>
            )}
            {row.status === "hidden" && (
              <Button size="sm" variant="outline" className="h-9 rounded-full" onClick={() => setStatus(row, "active")}>
                <Eye className="h-4 w-4" aria-hidden /> Show
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-9 rounded-full text-destructive" onClick={() => remove(row)}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}
