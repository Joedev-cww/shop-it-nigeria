import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategories, getFeaturedShops, searchProducts } from "@/lib/catalog.functions";
import { ProductCard, ProductGridSkeleton, Stars } from "@/components/shop-ui";
import { ShieldCheck } from "lucide-react";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [categories, newest, shops] = await Promise.all([
      getCategories(),
      searchProducts({ data: { sort: "newest" } }),
      getFeaturedShops(),
    ]);
    return { categories, newest: newest.slice(0, 8), shops };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop It — Handmade beads, scents & bags by Nigerian students" },
      { name: "description", content: "Discover handmade waist beads, fragrance oils, Ankara bags and crochet from student makers on Nigerian campuses. Pay safely in Naira." },
      { property: "og:title", content: "Shop It — Handmade by Nigerian students" },
      { property: "og:description", content: "Handmade beads, fragrance, bags and crochet from campus makers. Buyer Protection on every order." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  pendingComponent: () => <ProductGridSkeleton n={8} />,
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  return (
    <div className="space-y-8">
      {/* Intro */}
      <section className="bg-warm overflow-hidden rounded-3xl px-5 py-7 text-primary-foreground">
        <p className="text-sm font-medium opacity-90">Made on campus · Sold with care</p>
        <h1 className="mt-2 max-w-md text-3xl font-extrabold leading-tight sm:text-4xl">
          Handmade things from Nigeria's young makers.
        </h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/search" className="rounded-full bg-card px-5 py-3 text-sm font-semibold text-foreground">Start shopping</Link>
          <Link to="/sell" className="rounded-full border border-primary-foreground/50 px-5 py-3 text-sm font-semibold">Open a shop</Link>
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-sm opacity-95">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Your money is held safely until you confirm "Item received".
        </p>
      </section>

      {/* Categories */}
      <section aria-labelledby="cats">
        <h2 id="cats" className="mb-3 text-xl font-bold">Shop by category</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {data.categories.map((c) => (
            <Link
              key={c.slug}
              to="/search"
              search={{ cat: c.slug }}
              className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-3 text-sm font-medium"
            >
              <span aria-hidden>{c.emoji}</span> {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section aria-labelledby="new">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="new" className="text-xl font-bold">New arrivals</h2>
          <Link to="/search" className="text-sm font-medium text-primary">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.newest.map((p, i) => (
            <ProductCard key={p.id} p={p} eager={i < 2} />
          ))}
        </div>
      </section>

      {/* Shops */}
      <section aria-labelledby="shops">
        <h2 id="shops" className="mb-3 text-xl font-bold">Top student shops</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.shops.map((s) => (
            <Link key={s.slug} to="/shop/$slug" params={{ slug: s.slug }} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-secondary-foreground">
                {s.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.campus} · {s.sales_count} sales</p>
              </div>
              <div className="ml-auto"><Stars value={s.rating_avg} /></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
