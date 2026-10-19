import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

/** Save / unsave a product. Signed-out users are sent to sign in. */
export function WishlistButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, productId]);

  async function toggle() {
    if (!user) return navigate({ to: "/auth" });
    if (saved) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      setSaved(false);
    } else {
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      if (error) return toast.error("Could not save. Try again.");
      setSaved(true);
      toast.success("Saved to your wishlist");
    }
  }

  return (
    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={toggle} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
      <Heart className={saved ? "fill-primary text-primary" : ""} />
    </Button>
  );
}
