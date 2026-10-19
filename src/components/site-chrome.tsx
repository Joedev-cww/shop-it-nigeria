/** Top header (logo + search) and the mobile bottom navigation. */
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Home, Search, Store, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0 font-display text-2xl font-extrabold tracking-tight text-primary">
          Shop<span className="text-secondary"> It</span>
        </Link>
        <form
          role="search"
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/search", search: { q: q.trim() || undefined } });
          }}
        >
          <label className="flex h-11 items-center gap-2 rounded-full border bg-card px-4">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search beads, scents, bags…"
              aria-label="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/sell" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-muted">Sell</Link>
          <Link to="/wishlist" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-muted">Wishlist</Link>
          {user ? (
            <Link to="/account" className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">Account</Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Browse", icon: Search },
  { to: "/wishlist", label: "Saved", icon: Heart },
  { to: "/sell", label: "Sell", icon: Store },
  { to: "/account", label: "Me", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
      <p className="font-display text-lg font-bold text-foreground">Shop It</p>
      <p className="mt-1">Handmade by Nigerian students. Paid safely, delivered with care.</p>
      <p className="mt-4">© {new Date().getFullYear()} Shop It</p>
    </footer>
  );
}
