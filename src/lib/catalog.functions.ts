/**
 * Public catalog reads. These run on the server (SSR-friendly, good for SEO)
 * with the publishable key, so database row-level security still applies:
 * only approved shops and active listings are ever returned.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type SearchInput = {
  q?: string | undefined;
  cat?: string | undefined;
  campus?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  rating?: number | undefined;
  sort?: undefined | "newest" | "price_asc" | "price_desc" | "top_rated" | "relevance";
};

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((input: SearchInput) => ({
    q: input.q?.slice(0, 80),
    cat: input.cat?.slice(0, 40),
    campus: input.campus?.slice(0, 40),
    min: input.min && input.min > 0 ? Math.floor(input.min) : undefined,
    max: input.max && input.max > 0 ? Math.floor(input.max) : undefined,
    rating: input.rating && input.rating > 0 ? Math.min(5, input.rating) : undefined,
    sort: input.sort ?? "newest",
  }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await publicClient().rpc("search_products", Object.fromEntries(Object.entries({
      q: data.q ?? undefined,
      cat: data.cat ?? undefined,
      campus_q: data.campus ?? undefined,
      min_price: data.min,
      max_price: data.max,
      min_rating: data.rating,
      sort: data.q && data.sort === "newest" ? "relevance" : data.sort,
      lim: 40,
    }).filter(([, v]) => v !== undefined)) as { lim: number });
    if (error) throw new Error("Could not load products. Please try again.");
    return rows ?? [];
  });

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("categories").select("slug,name,emoji").order("sort_order");
  return data ?? [];
});

export const getFeaturedShops = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("shops")
    .select("slug,name,campus,rating_avg,rating_count,sales_count,logo_url")
    .order("rating_avg", { ascending: false })
    .limit(6);
  return data ?? [];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: p } = await sb
      .from("products")
      .select(
        "id,slug,title,description,display_price,stock,pickup_available,local_delivery,local_delivery_fee,buyer_rider,min_order_for_delivery,allows_custom,rating_avg,rating_count,created_at," +
          "categories(slug,name),product_images(url,position)," +
          "shops(id,slug,name,campus,city,rating_avg,rating_count,sales_count,is_fast_responder,logo_url,created_at)",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    return p as unknown as ProductDetail | null;
  });

export const getShop = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Explicit columns only: never expose owner_id or private fields.
    const { data: shop } = await sb
      .from("shops")
      .select("id,slug,name,bio,logo_url,campus,city,instagram,tiktok,rating_avg,rating_count,sales_count,is_fast_responder,vacation_mode,created_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!shop) return null;
    const { data: products } = await sb
      .from("products")
      .select("id,slug,title,display_price,stock,rating_avg,rating_count,product_images(url,position)")
      .eq("shop_id", shop.id)
      .gt("stock", 0)
      .order("created_at", { ascending: false });
    return { shop, products: products ?? [] };
  });

export type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  display_price: number;
  stock: number;
  pickup_available: boolean;
  local_delivery: boolean;
  local_delivery_fee: number;
  buyer_rider: boolean;
  min_order_for_delivery: number;
  allows_custom: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  categories: { slug: string; name: string } | null;
  product_images: { url: string; position: number }[];
  shops: {
    id: string;
    slug: string;
    name: string;
    campus: string | null;
    city: string | null;
    rating_avg: number;
    rating_count: number;
    sales_count: number;
    is_fast_responder: boolean;
    logo_url: string | null;
    created_at: string;
  };
};
