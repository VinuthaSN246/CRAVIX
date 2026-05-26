import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Home, Briefcase, Wallet, CreditCard, Banknote, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Flavora Kitchen" }] }),
});

const ADDRESSES = [
  { id: "home", label: "Home", icon: Home, address: "123 Sunset Blvd, Apt 4B" },
  { id: "work", label: "Work", icon: Briefcase, address: "Flavora HQ, 200 Market St" },
];

const PAYMENTS = [
  { id: "cash", label: "Cash on Delivery", icon: Banknote },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "wallet", label: "E-Wallet", icon: Wallet },
];

type CartRow = {
  id: string;
  quantity: number;
  dish: { id: string; name: string; price: number; image_url: string } | null;
};

function CheckoutPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartRow[]>([]);
  const [addr, setAddr] = useState("home");
  const [pay, setPay] = useState("cash");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    supabase
      .from("cart_items")
      .select("id, quantity, dish:dishes(id, name, price, image_url)")
      .then(({ data }) => setItems((data as any) ?? []));
  }, [user, loading]);

  const subtotal = items.reduce((s, it) => s + (it.dish?.price ?? 0) * it.quantity, 0);
  const delivery = items.length ? 4.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;

  async function placeOrder() {
    if (!user || !items.length) return;
    setBusy(true);
    try {
      const a = ADDRESSES.find((x) => x.id === addr)!;
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total, address: `${a.label} • ${a.address}`, payment_method: pay })
        .select()
        .single();
      if (oErr) throw oErr;

      const orderItems = items
        .filter((it) => it.dish)
        .map((it) => ({
          order_id: order.id,
          dish_id: it.dish!.id,
          name: it.dish!.name,
          price: it.dish!.price,
          quantity: it.quantity,
          image_url: it.dish!.image_url,
        }));
      if (orderItems.length) {
        const { error: iErr } = await supabase.from("order_items").insert(orderItems);
        if (iErr) throw iErr;
      }

      await supabase.from("cart_items").delete().eq("user_id", user.id);
      nav({ to: "/order-done" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to place order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-40">
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <Link to="/cart" className="w-10 h-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold">Checkout</h1>
      </header>

      <div className="mx-auto max-w-md px-5 py-4 space-y-6">
        <Section title="Shipping Address" icon={<MapPin size={16} className="text-[#FF6A1A]" />}>
          <div className="grid grid-cols-2 gap-3">
            {ADDRESSES.map((a) => {
              const active = addr === a.id;
              return (
                <button key={a.id} onClick={() => setAddr(a.id)} className={`text-left p-3 rounded-2xl border transition ${active ? "border-[#FF6A1A] bg-[#FF6A1A]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <a.icon size={18} className={active ? "text-[#FF6A1A]" : "text-neutral-400"} />
                  <div className="font-semibold mt-2 text-sm">{a.label}</div>
                  <div className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">{a.address}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Payment Method">
          <div className="space-y-2">
            {PAYMENTS.map((p) => {
              const active = pay === p.id;
              return (
                <button key={p.id} onClick={() => setPay(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition ${active ? "border-[#FF6A1A] bg-[#FF6A1A]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${active ? "bg-[#FF6A1A]" : "bg-white/5"}`}>
                    <p.icon size={18} className="text-white" />
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">{p.label}</span>
                  {active && <Check size={16} className="text-[#FF6A1A]" />}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Order Summary">
          <div className="space-y-2 text-sm">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-neutral-300">
                <span>{it.quantity}× {it.dish?.name}</span>
                <span>${((it.dish?.price ?? 0) * it.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-white/10 my-2" />
            <SummaryRow label="Subtotal" value={subtotal} />
            <SummaryRow label="Delivery" value={delivery} />
            <SummaryRow label="Tax (8%)" value={tax} />
            <div className="border-t border-white/10 my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-[#FF6A1A]">${total.toFixed(2)}</span>
            </div>
          </div>
        </Section>
      </div>

      <div className="fixed bottom-20 inset-x-0 z-30 px-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={false}
          onClick={placeOrder}
          className="mx-auto max-w-md w-full bg-[#FF6A1A] hover:bg-[#ff7a30] disabled:opacity-50 text-white font-semibold py-4 rounded-2xl shadow-2xl shadow-[#FF6A1A]/30 flex items-center justify-center gap-2"
        >
          {busy ? "Placing order…" : `Confirmation • $${total.toFixed(2)}`}
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-neutral-400">
      <span>{label}</span>
      <span className="text-white">${value.toFixed(2)}</span>
    </div>
  );
}
