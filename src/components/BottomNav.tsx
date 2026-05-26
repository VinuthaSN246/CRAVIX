import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingCart, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-md grid grid-cols-4 px-4 py-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2 transition-colors"
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  active ? "bg-[#FF6A1A] text-white shadow-lg shadow-[#FF6A1A]/40" : "text-neutral-500"
                }`}
              >
                <Icon size={20} />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-[#FF6A1A]" : "text-neutral-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
