/**
 * Streams a seller-uploaded product photo to whoever is browsing.
 *
 * This workspace does not allow public storage buckets, so uploads sit in
 * private storage and are served from here instead. The route itself is
 * public, but it only ever answers for a picture whose listing is live: the
 * visibility question is asked of the database as an anonymous visitor, and
 * row-level security says only active products from approved, open shops are
 * visible. A pending, rejected, hidden or sold-out listing's photo returns 404.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BUCKET = "product-images";

/** Only `<uploader id>/<product id>-<position>.webp` is ever served. */
const SAFE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{1,2}\.webp$/i;

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/** Read-only client on the publishable key: row-level security decides what it sees. */
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

export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!SAFE_PATH.test(path)) return notFound();

        const productId = path.split("/")[1]?.slice(0, 36);
        if (!productId) return notFound();

        // Is this listing live for the public? RLS answers, so nothing here
        // trusts the caller and no listing that isn't approved can leak a photo.
        const { data: live } = await publicClient().from("products").select("id").eq("id", productId).maybeSingle();
        if (!live) return notFound();

        // Fetching the file itself needs the privileged storage client; the live
        // listing check above is what authorises sending it back.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: file, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
        if (error || !file) return notFound();

        return new Response(file, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
