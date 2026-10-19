/** Small presentational building blocks shared across pages. */
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star, Zap, Trophy, Flame } from "lucide-react";
import { naira } from "@/lib/format";

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-highlight text-highlight" aria-hidden />
      <span className="font-medium text-foreground">{Number(value).toFixed(1)}</span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

type ShopStats = { rating_avg: number; rating_count: number; sales_count: number; is_fast_responder: boolean };

/** Badges: Verified (approved shops), Fast Responder, 10 Sales, Top Rated. */
export function ShopBadges({ shop }: { shop: ShopStats }) {
  const items = [
    { show: true, icon: BadgeCheck, label: "Verified" },
    { show: shop.is_fast_responder, icon: Zap, label: "Fast Responder" },
    { show: shop.sales_count >= 10, icon: Flame, label: "10+ Sales" },
    { show: shop.rating_avg >= 4.7 && shop.rating_count >= 10, icon: Trophy, label: "Top Rated" },
  ].filter((b) => b.show);
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
        </span>
      ))}
    </div>
  );
}

export type CardProduct = {
  slug: string;
  title: string;
  display_price: number;
  rating_avg: number;
  rating_count: number;
  image_url?: string | null;
  shop_name?: string;
  campus?: string | null;
  stock?: number;
};

export function ProductCard({ p, eager }: { p: CardProduct; eager?: boolean }) {
  return (
    <Link to="/p/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="aspect-square overflow-hidden bg-muted">
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.title}
            width={400}
            height={400}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug">{p.title}</h3>
        <p className="font-display text-lg font-bold text-primary">{naira(p.display_price)}</p>
        <div className="flex items-center justify-between gap-2">
          {p.rating_count > 0 ? <Stars value={p.rating_avg} /> : <span className="text-xs text-muted-foreground">New</span>}
          {p.campus && <span className="truncate text-xs text-muted-foreground">{p.campus}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SafetyBanner() {
  return (
    <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
      🛡️ Never pay or chat outside Shop It. You lose your Buyer Protection.
    </p>
  );
}
