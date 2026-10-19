/**
 * Saved items. Rows come from the wishlists table, which row-level security
 * only ever lets the owner read.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, ProductCard, ProductGridSkeleton, type CardProduct } from "@/components/shop-ui";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Saved items — Shop It" },
      { name: "description", content: "The handmade pieces you saved on Shop It, with prices in Naira." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

type Saved = CardProduct & { product_id: string };

function WishlistPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Saved[] | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let live = true;
    (async () => {
      const { data: saved } = await supabase
        .from("wishlists")
        .select("product_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const ids = (saved ?? []).map((s) => s.product_id);
      if (!ids.length) {
        if (live) setItems([]);
        return;
      }

      const { data: rows } = await supabase
        .from("products")
        .select("id,slug,title,display_price,rating_avg,rating_count,stock,product_images(url,position),shops(name,campus)")
        .in("id", ids);

      const byId = new Map((rows ?? []).map((r) => [r.id, r]));
      if (!live) return;
      setItems(
        ids
          .filter((id) => byId.has(id))
          .map((id) => {
            const r = byId.get(id)!;
            const cover = [...(r.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
            return {
              product_id: id,
              slug: r.slug,
              title: r.title,
              display_price: r.display_price,
              rating_avg: Number(r.rating_avg),
              rating_count: r.rating_count,
              stock: r.stock,
              image_url: cover?.url ?? null,
              shop_name: r.shops?.name ?? undefined,
              campus: r.shops?.campus ?? null,
            } satisfies Saved;
          }),
      );
    })();
    return () => {
      live = false;
    };
  }, [user]);

  async function remove(productId: string) {
    if (!user) return;
    const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
    if (error) {
      toast.error("Could not remove that item. Try again.");
      return;
    }
    setItems((prev) => (prev ?? []).filter((i) => i.product_id !== productId));
  }

  if (loading || items === null) return <ProductGridSkeleton n={4} />;

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see saved items"
        body="Tap the heart on any listing and it lands here."
        action={
          <Link to="/auth" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        }
      />
    );
  }

  if (items.length === 0) {
    return <EmptyState title="Nothing saved yet" body="Tap the heart on a listing to keep it here for later." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Saved items</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.product_id} className="relative">
            <ProductCard p={item} />
            {item.stock === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-1 text-xs text-background">Sold out</span>
            )}
            <button
              onClick={() => remove(item.product_id)}
              aria-label={`Remove ${item.title} from saved items`}
              className="absolute right-2 top-2 rounded-full bg-card/90 p-2 shadow-card"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
