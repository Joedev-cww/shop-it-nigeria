import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Share2, Truck, MapPin, Bike, AlertTriangle } from "lucide-react";
import { getProduct } from "@/lib/catalog.functions";
import { deliveryIsExpensive, naira } from "@/lib/format";
import { SafetyBanner, ShopBadges, Stars } from "@/components/shop-ui";
import { WishlistButton } from "@/components/wishlist-button";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }) });

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { title: p.title, description: p.description, price: p.display_price, shop: p.shops.name };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — ${naira(loaderData.price)} | Shop It` },
          { name: "description", content: loaderData.description.slice(0, 155) },
          { property: "og:title", content: `${loaderData.title} by ${loaderData.shop}` },
          { property: "og:description", content: `${naira(loaderData.price)} · ${loaderData.description.slice(0, 120)}` },
          { property: "og:type", content: "product" },
        ]
      : [{ title: "Product unavailable — Shop It" }, { name: "robots", content: "noindex" }],
  }),
  component: ProductPage,
});

type DeliveryChoice = "pickup" | "local" | "rider";

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { user } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const product = p!;
  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const defaultChoice: DeliveryChoice = product.pickup_available ? "pickup" : product.local_delivery ? "local" : "rider";
  const [choice, setChoice] = useState<DeliveryChoice>(defaultChoice);
  const soldOut = product.stock <= 0;

  useEffect(() => {
    supabase.rpc("record_product_view", { _product: product.id });
  }, [product.id]);

  // Delivery preview shown before add-to-cart: no surprise charges later.
  const deliveryFee = choice === "local" ? product.local_delivery_fee : 0;
  const belowMinimum = choice === "local" && product.min_order_for_delivery > product.display_price;
  const expensive = choice === "local" && deliveryIsExpensive(product.display_price, deliveryFee);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  async function share() {
    if (navigator.share) {
      await navigator.share({ title: product.title, url: shareUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied — paste it in your Instagram story or bio");
    }
  }

  async function notifyMe() {
    if (!user) { toast.error("Sign in to get notified"); return; }
    await supabase.from("stock_alerts").upsert({ user_id: user.id, product_id: product.id });
    toast.success("We'll let you know when it's back");
  }

  return (
    <article className="grid gap-6 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
          {images[imgIdx] && <img src={images[imgIdx].url} alt={product.title} width={800} height={800} className="h-full w-full object-cover" />}
        </div>
        {images.length > 1 && (
          <div className="mt-2 flex gap-2">
            {images.map((im, i) => (
              <button key={im.url} onClick={() => setImgIdx(i)} className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                <img src={im.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          {product.categories && (
            <Link to="/search" search={{ cat: product.categories.slug }} className="text-sm font-medium text-secondary">
              {product.categories.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <p className="font-display text-3xl font-extrabold text-primary">{naira(product.display_price)}</p>
            {product.rating_count > 0 && <Stars value={product.rating_avg} count={product.rating_count} />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Includes Shop It Buyer Protection fee</p>
        </div>

        {/* Delivery preview */}
        <section className="space-y-2 rounded-2xl bg-card p-4 shadow-card">
          <h2 className="font-sans text-sm font-semibold">How do you want it?</h2>
          {product.pickup_available && (
            <DeliveryOption icon={MapPin} active={choice === "pickup"} onClick={() => setChoice("pickup")} label="Pickup point" note={`${product.shops.campus ?? "Campus"} hub`} fee={0} />
          )}
          {product.local_delivery && (
            <DeliveryOption icon={Truck} active={choice === "local"} onClick={() => setChoice("local")} label="Local delivery" note={product.shops.city ?? ""} fee={product.local_delivery_fee} />
          )}
          {product.buyer_rider && (
            <DeliveryOption icon={Bike} active={choice === "rider"} onClick={() => setChoice("rider")} label="I'll send my own rider" note="Arranged in-app" fee={0} />
          )}
          {belowMinimum && (
            <p className="text-sm text-muted-foreground">Add {naira(product.min_order_for_delivery - product.display_price)} more from this shop to unlock delivery.</p>
          )}
          {expensive && (
            <p className="flex gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden /> Delivery is more than half the item price. Pickup or adding more items from this shop saves you money.
            </p>
          )}
          <div className="flex justify-between border-t pt-2 text-sm">
            <span>Item + delivery</span>
            <span className="font-semibold">{naira(product.display_price + (belowMinimum ? 0 : deliveryFee))}</span>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-2">
          {soldOut ? (
            <Button className="h-12 flex-1 rounded-full" variant="secondary" onClick={notifyMe}>
              <Bell /> Sold out — notify me
            </Button>
          ) : (
            <>
              <Button className="h-12 flex-1 rounded-full" onClick={() => toast("Checkout opens in the next update")}>Buy now</Button>
              <Button className="h-12 flex-1 rounded-full" variant="outline" onClick={() => toast("Cart opens in the next update")}>Add to cart</Button>
            </>
          )}
          <WishlistButton productId={product.id} />
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${product.title} on Shop It: ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium"
          >
            Share to WhatsApp
          </a>
          <button onClick={share} className="inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium">
            <Share2 className="h-4 w-4" aria-hidden /> Share
          </button>
        </div>

        <section>
          <h2 className="mb-1 text-lg font-bold">About this item</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{product.description}</p>
          {product.allows_custom && <p className="mt-2 text-sm font-medium text-secondary">✨ This maker accepts custom orders (names, colours, sizes).</p>}
          <p className="mt-2 text-sm text-muted-foreground">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
        </section>

        {/* Seller (only shop name, campus and ratings — never exact location) */}
        <Link to="/shop/$slug" params={{ slug: product.shops.slug }} className="block rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-secondary-foreground">{product.shops.name.charAt(0)}</div>
            <div>
              <p className="font-semibold">{product.shops.name}</p>
              <p className="text-sm text-muted-foreground">{product.shops.campus} · {product.shops.sales_count} sales</p>
            </div>
            <div className="ml-auto"><Stars value={product.shops.rating_avg} count={product.shops.rating_count} /></div>
          </div>
          <div className="mt-3"><ShopBadges shop={product.shops} /></div>
        </Link>

        <section>
          <h2 className="mb-1 text-lg font-bold">Reviews</h2>
          <p className="text-sm text-muted-foreground">
            {product.rating_count > 0 ? `${product.rating_count} verified buyers rated this ${Number(product.rating_avg).toFixed(1)}★.` : "No reviews yet."} Only buyers with completed orders can review.
          </p>
        </section>

        <SafetyBanner />
      </div>
    </article>
  );
}

function DeliveryOption(props: { icon: typeof Truck; label: string; note: string; fee: number; active: boolean; onClick: () => void }) {
  const Icon = props.icon;
  return (
    <button onClick={props.onClick} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${props.active ? "border-primary bg-accent" : ""}`}>
      <Icon className="h-5 w-5 text-secondary" aria-hidden />
      <span className="flex-1">
        <span className="block text-sm font-medium">{props.label}</span>
        <span className="block text-xs text-muted-foreground">{props.note}</span>
      </span>
      <span className="text-sm font-semibold">{props.fee ? naira(props.fee) : "Free"}</span>
    </button>
  );
}
