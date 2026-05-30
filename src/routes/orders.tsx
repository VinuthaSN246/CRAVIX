import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Banknote, CreditCard, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShimmerCard } from "@/components/ShimmerCard";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import * as Tabs from "@radix-ui/react-tabs";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders — CRAVIX" }] }),
});

const ORANGE = "#FF6A1A";

type OrderItem = {
  id: string;
  dish_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  payment_method: string | null;
  order_items: OrderItem[];
};

const ACTIVE_STATUSES = ["confirmed", "preparing", "out_for_delivery", "pending"];

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "_");
}

function statusBadgeColor(status: string): string {
  const normalized = normalizeStatus(status);
  if (ACTIVE_STATUSES.includes(normalized)) return "#FF6A1A";
  if (normalized === "delivered") return "#22C55E";
  if (normalized === "cancelled") return "#EF4444";
  return "#6B7280";
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatOrderId(id: string): string {
  return `CRX-${id.slice(0, 6).toUpperCase()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", " ·");
}

function PaymentIcon({ method }: { method: string | null }) {
  if (method === "card") return <CreditCard size={14} className="text-neutral-400" />;
  if (method === "wallet") return <Wallet size={14} className="text-neutral-400" />;
  return <Banknote size={14} className="text-neutral-400" />;
}

function OrderCard({ order, onReorder }: { order: Order; onReorder: (o: Order) => void }) {
  const color = statusBadgeColor(order.status);
  const thumbnails = order.order_items.slice(0, 3);
  const extra = order.order_items.length - 3;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="font-bold text-sm">{formatOrderId(order.id)}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">{formatDate(order.created_at)}</div>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {statusLabel(order.status)}
        </span>
      </div>

      {/* Thumbnails */}
      <div className="flex items-center gap-2">
        {thumbnails.map((item) =>
          item.image_url ? (
            <img
              key={item.id}
              src={item.image_url}
              alt={item.name}
              className="w-14 h-14 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div key={item.id} className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-xs text-neutral-500">
              🍽️
            </div>
          )
        )}
        {extra > 0 && (
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-xs font-bold text-neutral-400">
            +{extra}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PaymentIcon method={order.payment_method} />
          <span className="text-base font-bold" style={{ color: ORANGE }}>${Number(order.total).toFixed(2)}</span>
        </div>
        <button
          onClick={() => onReorder(order)}
          className="h-9 px-4 rounded-full text-xs font-bold text-black"
          style={{ background: ORANGE }}
        >
          Re-order
        </button>
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="text-center py-16 rounded-3xl border border-white/5 bg-white/[0.02]">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}

function OrdersPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    load();
  }, [user, loading]);

  async function load() {
    setFetching(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setFetching(false);
  }

  async function reorder(order: Order) {
    if (!user) return;
    for (const item of order.order_items) {
      if (!item.dish_id) continue;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("dish_id", item.dish_id)
        .maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + item.quantity }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, dish_id: item.dish_id, quantity: item.quantity });
      }
    }
    toast.success("Items added to cart");
    nav({ to: "/cart" });
  }

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(normalizeStatus(o.status)));
  const completed = orders.filter((o) => normalizeStatus(o.status) === "delivered");
  const cancelled = orders.filter((o) => normalizeStatus(o.status) === "cancelled");

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-28"
    >
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="w-10 h-10 grid place-items-center rounded-full bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">My Orders</h1>
      </header>

      <div className="max-w-md mx-auto px-5 py-4">
        {fetching ? (
          <ShimmerCard variant="order" count={3} />
        ) : (
          <Tabs.Root defaultValue="active">
            <Tabs.List className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 mb-5">
              {[
                { value: "active", label: "Active", count: active.length },
                { value: "completed", label: "Completed", count: completed.length },
                { value: "cancelled", label: "Cancelled", count: cancelled.length },
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition data-[state=active]:bg-[#FF6A1A] data-[state=active]:text-black text-neutral-400 data-[state=active]:shadow"
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="active" className="space-y-4">
              {active.length === 0
                ? <EmptyTab message="No active orders" />
                : active.map((o) => <OrderCard key={o.id} order={o} onReorder={reorder} />)}
            </Tabs.Content>
            <Tabs.Content value="completed" className="space-y-4">
              {completed.length === 0
                ? <EmptyTab message="No completed orders yet" />
                : completed.map((o) => <OrderCard key={o.id} order={o} onReorder={reorder} />)}
            </Tabs.Content>
            <Tabs.Content value="cancelled" className="space-y-4">
              {cancelled.length === 0
                ? <EmptyTab message="No cancelled orders" />
                : cancelled.map((o) => <OrderCard key={o.id} order={o} onReorder={reorder} />)}
            </Tabs.Content>
          </Tabs.Root>
        )}
      </div>
      <BottomNav />
    </motion.div>
  );
}
