import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { getCategories, searchProducts, type SearchInput } from "@/lib/catalog.functions";
import { EmptyState, ProductCard, ProductGridSkeleton } from "@/components/shop-ui";
import { CAMPUSES } from "@/lib/format";
import { Button } from "@/components/ui/button";

type Search = SearchInput;
const SORTS = [
  { v: "newest", l: "Newest" },
  { v: "price_asc", l: "Price: low to high" },
  { v: "price_desc", l: "Price: high to low" },
  { v: "top_rated", l: "Top rated" },
] as const;

const catsQuery = queryOptions({ queryKey: ["categories"], queryFn: () => getCategories(), staleTime: 600_000 });

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
    campus: typeof s.campus === "string" && s.campus ? s.campus : undefined,
    min: s.min ? Number(s.min) || undefined : undefined,
    max: s.max ? Number(s.max) || undefined : undefined,
    rating: s.rating ? Number(s.rating) || undefined : undefined,
    sort: (SORTS.find((x) => x.v === s.sort)?.v ?? undefined) as Search["sort"],
  }),
  head: () => ({
    meta: [
      { title: "Browse handmade products — Shop It" },
      { name: "description", content: "Search and filter handmade beads, fragrance, bags and crochet by price, campus and rating." },
      { property: "og:title", content: "Browse handmade products — Shop It" },
      { property: "og:description", content: "Find student-made items near your campus." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catsQuery),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [showFilters, setShowFilters] = useState(false);
  const { data: cats = [] } = useQuery(catsQuery);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["search", search],
    queryFn: () => searchProducts({ data: search }),
  });

  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{search.q ? `“${search.q}”` : "Browse"}</h1>
        <Button variant="outline" className="h-11 rounded-full" onClick={() => setShowFilters((v) => !v)}>
          <SlidersHorizontal /> Filters
        </Button>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!search.cat} onClick={() => set({ cat: undefined })}>All</Chip>
        {cats.map((c) => (
          <Chip key={c.slug} active={search.cat === c.slug} onClick={() => set({ cat: c.slug })}>
            {c.emoji} {c.name}
          </Chip>
        ))}
      </div>

      {showFilters && (
        <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-card sm:grid-cols-2">
          <Field label="Sort by">
            <select className="h-11 w-full rounded-xl border bg-background px-3" value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as Search["sort"] })}>
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>
          <Field label="Campus / area">
            <select className="h-11 w-full rounded-xl border bg-background px-3" value={search.campus ?? ""} onChange={(e) => set({ campus: e.target.value || undefined })}>
              <option value="">Anywhere</option>
              {CAMPUSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Min price (₦)">
            <input inputMode="numeric" className="h-11 w-full rounded-xl border bg-background px-3" defaultValue={search.min ?? ""} onBlur={(e) => set({ min: Number(e.target.value) || undefined })} />
          </Field>
          <Field label="Max price (₦)">
            <input inputMode="numeric" className="h-11 w-full rounded-xl border bg-background px-3" defaultValue={search.max ?? ""} onBlur={(e) => set({ max: Number(e.target.value) || undefined })} />
          </Field>
          <Field label="Rating">
            <select className="h-11 w-full rounded-xl border bg-background px-3" value={search.rating ?? ""} onChange={(e) => set({ rating: Number(e.target.value) || undefined })}>
              <option value="">Any</option>
              <option value="4">4★ & up</option>
              <option value="4.5">4.5★ & up</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button variant="ghost" className="h-11" onClick={() => navigate({ search: { q: search.q } })}>Clear filters</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <EmptyState title="Couldn't load products" body="Check your connection and try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <EmptyState title="Nothing here yet" body="Try a different spelling, remove a filter, or browse all categories." />
      )}
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium ${active ? "border-secondary bg-secondary text-secondary-foreground" : "bg-card"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
