import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Home, Briefcase, Wallet, CreditCard, Banknote, Check, Tag, Trash2, ChefHat } from "lucide-react";
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
  { id: "wallet", label: "E-Wallet (Flavora Wallet)", icon: Wallet },
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

  // Custom states for promo codes & stashed notes
  const [isGold] = useState(() => localStorage.getItem("flavora_gold_active") === "true");
  const [notes] = useState(() => localStorage.getItem("cart_notes") ?? "");
  const [promoCode, setPromoCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number; type: "flat" | "percent" | "free_del" } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    supabase
      .from("cart_items")
      .select("id, quantity, dish:dishes(id, name, price, image_url)")
      .then(({ data }) => setItems((data as any) ?? []));

    // Fetch wallet balance
    supabase.from("profiles").select("wallet_balance").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setWalletBalance(data.wallet_balance);
      });
  }, [user, loading]);

  const subtotal = items.reduce((s, it) => s + (it.dish?.price ?? 0) * it.quantity, 0);
  const delivery = items.length ? ((isGold || activeCoupon?.type === "free_del") ? 0 : 4.99) : 0;
  
  const couponDiscount = activeCoupon ? activeCoupon.discount : 0;
  const tax = Math.max((subtotal - couponDiscount) * 0.08, 0);
  const total = Math.max(subtotal + delivery + tax - couponDiscount, 0);

  function applyCoupon() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "CRAVEIT") {
      if (subtotal < 25) {
        toast.error("Code CRAVEIT is only valid on orders above $25.00");
        return;
      }
      setActiveCoupon({ code, discount: 10, type: "flat" });
      toast.success("Promo code CRAVEIT applied! $10.00 saved.");
    } else if (code === "TASTY50") {
      const discountVal = Math.min(subtotal * 0.5, 15);
      setActiveCoupon({ code, discount: discountVal, type: "percent" });
      toast.success(`Promo code TASTY50 applied! 50% discount ($${discountVal.toFixed(2)}) saved.`);
    } else if (code === "FREEDEL") {
      if (isGold) {
        toast.error("You already have free delivery with Flavora Gold!");
        return;
      }
      setActiveCoupon({ code, discount: 4.99, type: "free_del" });
      toast.success("Promo code FREEDEL applied! Delivery fee waived.");
    } else {
      toast.error("Invalid coupon code. Try TASTY50 or CRAVEIT!");
    }
    setPromoCode("");
  }

  async function placeOrder() {
    if (!user || !items.length) return;
    setBusy(true);

    // E-Wallet logic
    if (pay === "wallet") {
      if (walletBalance === null) {
        toast.error("Unable to check wallet balance. Please try again.");
        setBusy(false);
        return;
      }
      if (walletBalance < total) {
        toast.error(`Insufficient wallet balance! You have $${walletBalance.toFixed(2)} but order total is $${total.toFixed(2)}.`);
        setBusy(false);
        return;
      }
      // Deduct wallet balance in DB
      const { error: wErr } = await supabase
        .from("profiles")
        .update({ wallet_balance: walletBalance - total })
        .eq("id", user.id);
      if (wErr) {
        toast.error("Wallet transaction failed. Please try cash.");
        setBusy(false);
        return;
      }
    }

    try {
      const a = ADDRESSES.find((x) => x.id === addr)!;
      const finalAddress = `${a.label} • ${a.address}${notes ? ` • Note: ${notes}` : ""}${activeCoupon ? ` • Promo: ${activeCoupon.code}` : ""}`;
      
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total, address: finalAddress, payment_method: pay })
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
      localStorage.removeItem("cart_notes"); // clear instructions
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
                <button key={a.id} onClick={() => setAddr(a.id)} className={`text-left p-3 rounded-2xl border transition cursor-pointer ${active ? "border-[#FF6A1A] bg-[#FF6A1A]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <a.icon size={18} className={active ? "text-[#FF6A1A]" : "text-neutral-400"} />
                  <div className="font-semibold mt-2 text-sm">{a.label}</div>
                  <div className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">{a.address}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Cooking/Delivery Notes */}
        {notes && (
          <Section title="Chef Instructions" icon={<ChefHat size={16} className="text-[#FF6A1A]" />}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs text-neutral-300 italic leading-relaxed">
              "{notes}"
            </div>
          </Section>
        )}

        {/* Promo Code input field */}
        <Section title="Offers & Promo Codes" icon={<Tag size={16} className="text-[#FF6A1A]" />}>
          {activeCoupon ? (
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-emerald-400">COUPON APPLIED: {activeCoupon.code}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Saved ${activeCoupon.discount.toFixed(2)} on this order</div>
              </div>
              <button onClick={() => setActiveCoupon(null)} className="text-neutral-500 hover:text-red-500 p-1 cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter CRAVEIT or TASTY50..."
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-[#FF6A1A] hover:bg-[#ff7a30] text-black font-bold px-5 py-3 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                <div className="p-2 border border-white/5 rounded-lg bg-white/[0.01]">
                  <span className="font-bold text-white block">TASTY50</span>
                  50% off up to $15.00
                </div>
                <div className="p-2 border border-white/5 rounded-lg bg-white/[0.01]">
                  <span className="font-bold text-white block">CRAVEIT</span>
                  $10.00 off orders &gt; $25
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Payment Method">
          <div className="space-y-2">
            {PAYMENTS.map((p) => {
              const active = pay === p.id;
              const isWalletType = p.id === "wallet";
              return (
                <button key={p.id} onClick={() => setPay(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer ${active ? "border-[#FF6A1A] bg-[#FF6A1A]/10" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${active ? "bg-[#FF6A1A]" : "bg-white/5"}`}>
                    <p.icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-neutral-200">{p.label}</div>
                    {isWalletType && walletBalance !== null && (
                      <div className="text-[10px] text-neutral-400">Balance: ${walletBalance.toFixed(2)}</div>
                    )}
                  </div>
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
            {activeCoupon && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Coupon Discount ({activeCoupon.code})</span>
                <span>-${couponDiscount.toFixed(2)}</span>
              </div>
            )}
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
          disabled={busy || !items.length}
          onClick={placeOrder}
          className="mx-auto max-w-md w-full bg-[#FF6A1A] hover:bg-[#ff7a30] disabled:opacity-50 text-white font-semibold py-4 rounded-2xl shadow-2xl shadow-[#FF6A1A]/30 flex items-center justify-center gap-2 cursor-pointer"
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
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-neutral-300">{icon}{title}</h2>
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
