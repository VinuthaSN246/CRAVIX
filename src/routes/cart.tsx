import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, Star, ArrowLeft, ShoppingBag, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "My Cart — Flavora Kitchen" }] }),
});

type CartRow = {
  id: string;
  quantity: number;
  dish: { id: string; name: string; price: number; image_url: string; rating: number } | null;
};

function CartPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [notes, setNotes] = useState(() => localStorage.getItem("cart_notes") ?? "");

  useEffect(() => {
    localStorage.setItem("cart_notes", notes);
  }, [notes]);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    load();
  }, [user, loading]);

  async function load() {
    setBusy(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, dish:dishes(id, name, price, image_url, rating)")
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setBusy(false);
  }

  async function setQty(id: string, q: number) {
    if (q <= 0) {
      await supabase.from("cart_items").delete().eq("id", id);
    } else {
      await supabase.from("cart_items").update({ quantity: q }).eq("id", id);
    }
    load();
  }

  // Check Flavora Gold status
  const [isGold, setIsGold] = useState(() => localStorage.getItem("flavora_gold_active") === "true");

  const subtotal = items.reduce((s, it) => s + (it.dish?.price ?? 0) * it.quantity, 0);
  const delivery = items.length ? (isGold ? 0 : 4.99) : 0;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-40">
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <Link to="/" className="w-10 h-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold">My Cart</h1>
        <span className="ml-auto text-xs text-neutral-400">{items.length} items</span>
      </header>

      <div className="mx-auto max-w-md px-5 py-4 space-y-4">
        {busy ? (
          <div className="text-neutral-500 text-sm text-center py-20">Loading your cart…</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-3"
              >
                <motion.img
                  src={it.dish?.image_url}
                  alt={it.dish?.name ?? ""}
                  className="w-20 h-20 rounded-xl object-cover"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.dish?.name}</div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <Star size={12} className="fill-[#FF6A1A] text-[#FF6A1A]" /> {it.dish?.rating}
                  </div>
                  <div className="text-[#FF6A1A] font-bold mt-1">${it.dish?.price?.toFixed(2)}</div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => setQty(it.id, 0)} className="text-neutral-500 hover:text-red-500 p-1 cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2 bg-black/40 rounded-full p-1">
                    <button onClick={() => setQty(it.id, it.quantity - 1)} className="w-7 h-7 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 cursor-pointer"><Minus size={12} /></button>
                    <span className="text-sm font-semibold w-5 text-center">{it.quantity}</span>
                    <button onClick={() => setQty(it.id, it.quantity + 1)} className="w-7 h-7 rounded-full bg-[#FF6A1A] grid place-items-center cursor-pointer"><Plus size={12} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Special Instructions card */}
        {items.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2 text-neutral-200">
              <ChefHat size={16} className="text-[#FF6A1A]" />
              Add Cooking / Delivery Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Make it extra spicy, leave at the door, ring doorbell..."
              className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-[#FF6A1A]/50 transition resize-none placeholder:text-neutral-600 text-neutral-100"
            />
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label="Delivery" value={isGold ? "FREE (Gold)" : `$${delivery.toFixed(2)}`} />
            {isGold && <div className="text-[10px] text-emerald-400 font-medium">Flavora Gold Membership Active! Free delivery applied.</div>}
            <div className="border-t border-white/10 my-2" />
            <Row label="Total" value={`$${total.toFixed(2)}`} bold />
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 z-30 px-5">
          <div className="mx-auto max-w-md bg-[#FF6A1A] rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-[#FF6A1A]/30">
            <div>
              <div className="text-xs text-white/80">Total</div>
              <div className="text-xl font-bold text-white">${total.toFixed(2)}</div>
            </div>
            <button
              onClick={() => nav({ to: "/checkout" })}
              className="bg-black text-white font-semibold px-6 py-3 rounded-xl hover:bg-neutral-900 cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-neutral-400"}`}>
      <span>{label}</span>
      <span className={bold ? "text-[#FF6A1A]" : "text-white"}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto rounded-full bg-white/5 grid place-items-center mb-4">
        <ShoppingBag className="text-neutral-500" size={32} />
      </div>
      <h2 className="text-lg font-bold">Your cart is empty</h2>
      <p className="text-sm text-neutral-400 mt-1 mb-6">Add some delicious dishes to get started.</p>
      <Link to="/" className="inline-flex bg-[#FF6A1A] text-white font-semibold px-6 py-3 rounded-xl">Browse menu</Link>
    </div>
  );
}
