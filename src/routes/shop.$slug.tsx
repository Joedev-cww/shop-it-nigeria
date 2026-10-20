import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getShop } from "@/lib/catalog.functions";
import { EmptyState, ProductCard, ShopBadges, Stars } from "@/components/shop-ui";

const shopQuery = (slug: string) => queryOptions({ queryKey: ["shop", slug], queryFn: () => getShop({ data: { slug } }) });

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(shopQuery(params.slug));
    if (!d) throw notFound();
    return { name: d.shop.name, bio: d.shop.bio ?? "", campus: d.shop.campus };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { name: "twitter:card", content: "summary_large_image" },
          { property: "og:type", content: "website" },
          { title: `${loaderData.name} — ${loaderData.campus ?? "Student shop"} | Shop It` },
          { name: "description", content: loaderData.bio.slice(0, 155) },
          { property: "og:title", content: `${loaderData.name} on Shop It` },
          { property: "og:description", content: loaderData.bio.slice(0, 150) },
        ]
      : [
          { title: "Shop unavailable — Shop It" },
          { name: "description", content: "This shop is not currently available on Shop It." },
          { property: "og:title", content: "Shop unavailable — Shop It" },
          { property: "og:description", content: "This shop is not currently available on Shop It." },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "robots", content: "noindex" },
        ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(shopQuery(slug));
  const { shop, products } = data!;
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">{shop.name.charAt(0)}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-sm text-muted-foreground">{shop.campus}{shop.city ? ` · ${shop.city}` : ""}</p>
            <div className="mt-1"><Stars value={shop.rating_avg} count={shop.rating_count} /></div>
          </div>
        </div>
        {shop.bio && <p className="mt-4 text-[15px]">{shop.bio}</p>}
        <div className="mt-4"><ShopBadges shop={shop} /></div>
        {(shop.instagram || shop.tiktok) && (
          // Display only: not clickable, to keep all buying inside Shop It.
          <p className="mt-3 text-xs text-muted-foreground">
            Also on {[shop.instagram && "Instagram", shop.tiktok && "TikTok"].filter(Boolean).join(" & ")} · Always buy here for Buyer Protection
          </p>
        )}
        {shop.vacation_mode && <p className="mt-3 rounded-xl bg-accent p-3 text-sm">🌴 This shop is on a break and not taking orders right now.</p>}
      </header>

      <section>
        <h2 className="mb-3 text-xl font-bold">Products ({products.length})</h2>
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                p={{ ...p, image_url: [...p.product_images].sort((a, b) => a.position - b.position)[0]?.url ?? null }}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No products right now" body="Check back soon — new pieces are on the way." />
        )}
      </section>
    </div>
  );
}
