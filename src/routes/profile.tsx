import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Receipt, CreditCard, MapPin, Bell, HelpCircle, LogOut, ChevronRight, Moon, Wallet, Plus, X, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { GOLD_KEY } from "@/lib/constants";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — CRAVIX" }] }),
});

type Profile = { username: string | null; avatar_url: string | null; wallet_balance: number };

function ProfilePage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dark, setDark] = useState(true);
  const [isGold, setIsGold] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    setIsGold(localStorage.getItem(GOLD_KEY) === "true");
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    supabase.from("profiles").select("username, avatar_url, wallet_balance").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user, loading]);

  async function joinGold() {
    if (!user || !profile) return;
    const price = 9.99;
    if (profile.wallet_balance < price) {
      toast.error(`Insufficient wallet balance to buy Gold! You need at least $${price.toFixed(2)}.`);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ wallet_balance: profile.wallet_balance - price })
        .eq("id", user.id);
      
      if (error) throw error;
      
      localStorage.setItem(GOLD_KEY, "true");
      setIsGold(true);
      setProfile(prev => prev ? { ...prev, wallet_balance: prev.wallet_balance - price } : null);
      toast.success("Welcome to CRAVIX Gold! 👑 Free delivery activated on all your orders!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to join CRAVIX Gold.");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem(GOLD_KEY);
    toast.success("Signed out");
    nav({ to: "/" });
  }

  const avatar = profile?.avatar_url ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop";
  const name = profile?.username ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-28">
      <div className="relative bg-gradient-to-br from-[#FF6A1A] via-[#ff3d00] to-[#0a0a0a] pt-12 pb-24 px-6">
        <h1 className="text-lg font-bold text-center">Profile</h1>

        <div className="flex justify-center mt-6 relative">
          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-2xl"
          />
          {/* floating dishes */}
          {["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200",
            "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200",
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200"].map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="absolute w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-xl"
              style={{ left: `${30 + i * 18}%`, top: i % 2 ? 10 : 40 }}
              animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.5 }}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 -mt-16 relative">
        <div className="bg-[#141414] border border-white/10 rounded-3xl p-5 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xl font-bold">{name}</h2>
            {isGold && (
              <span className="text-[10px] tracking-wide font-black text-[#d4af37] bg-[#d4af37]/15 border border-[#d4af37]/35 rounded-full px-2 py-0.5 uppercase flex items-center gap-0.5">
                👑 Gold
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{user?.email}</p>
          
          <div className="mt-4 bg-gradient-to-r from-[#FF6A1A]/20 to-transparent border border-[#FF6A1A]/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A1A] grid place-items-center"><Wallet size={18} className="text-white" /></div>
            <div className="text-left flex-1">
              <div className="text-xs text-neutral-400">Wallet balance</div>
              <div className="text-lg font-bold">${(profile?.wallet_balance ?? 0).toFixed(2)}</div>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF6A1A] hover:bg-[#ff7a30] text-black text-xs font-bold transition cursor-pointer shadow-lg shadow-[#FF6A1A]/30"
            >
              <Plus size={12} /> Top Up
            </button>
          </div>
        </div>

        {/* CRAVIX Gold Premium Subscription Banner Card */}
        <div className="mt-4 overflow-hidden relative rounded-2xl p-4 bg-gradient-to-r from-[#1E1B15] via-[#2D2313] to-[#1E1B15] border border-[#d4af37]/30 shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa7c11] flex items-center justify-center text-sm shadow-md">
              👑
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-black tracking-wider text-[#d4af37] uppercase">CRAVIX Gold</div>
              <div className="text-[11px] text-neutral-300 font-medium mt-0.5">
                {isGold ? "Unlimited Free Deliveries & Exclusive Discounts Active!" : "Waive delivery fee ($4.99) on every single order!"}
              </div>
            </div>
            {isGold ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full font-bold">
                ACTIVE
              </span>
            ) : (
              <button
                onClick={joinGold}
                className="px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black shadow-md hover:scale-105 transition cursor-pointer"
              >
                Join @ $9.99
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 bg-[#141414] border border-white/10 rounded-3xl overflow-hidden">
          <ToggleRow icon={<Moon size={18} />} label="Dark Mode" value={dark} onChange={setDark} />
          <Link to="/favorites" className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#FF6A1A]"><Heart size={18} /></div>
            <span className="flex-1 text-left text-sm font-medium">Favorites</span>
            <ChevronRight size={16} className="text-neutral-500" />
          </Link>
          <Link to="/orders" className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#FF6A1A]"><Receipt size={18} /></div>
            <span className="flex-1 text-left text-sm font-medium">Orders</span>
            <ChevronRight size={16} className="text-neutral-500" />
          </Link>
          <MenuRow icon={<CreditCard size={18} />} label="Payments" />
          <MenuRow icon={<MapPin size={18} />} label="Addresses" />
          <MenuRow icon={<Bell size={18} />} label="Notifications" />
          <MenuRow icon={<HelpCircle size={18} />} label="Help & Support" />
        </div>

        <button
          onClick={logout}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3.5 rounded-2xl hover:bg-red-500/20 cursor-pointer"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>

      <BottomNav />

      {/* Top Up Bottom Sheet */}
      <AnimatePresence>
        {showTopUp && profile && user && (
          <TopUpSheet
            balance={profile.wallet_balance}
            onClose={() => setShowTopUp(false)}
            onSuccess={(newBalance) => {
              setProfile(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
              setShowTopUp(false);
            }}
            userId={user.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Top Up Sheet ─── */
type TopUpSheetProps = {
  balance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  userId: string;
};

const PRESETS = [10, 25, 50, 100];

function TopUpSheet({ balance, onClose, onSuccess, userId }: TopUpSheetProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = selected ?? (parseFloat(custom) || 0);

  async function handleTopUp() {
    if (amount <= 0 || amount > 500) {
      toast.error("Please enter an amount between $1 and $500.");
      return;
    }
    setBusy(true);
    const newBalance = balance + amount;
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", userId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`$${amount.toFixed(2)} added to your CRAVIX Wallet! 🎉`);
    onSuccess(newBalance);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-[#141414] border-t border-white/10 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Top Up Wallet</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Current balance: <span className="text-white font-semibold">${balance.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 grid place-items-center hover:bg-white/10 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Preset chips */}
        <div className="mb-5">
          <p className="text-xs text-neutral-400 font-semibold mb-3 uppercase tracking-wider">Quick Add</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => { setSelected(selected === p ? null : p); setCustom(""); }}
                className={`py-3 rounded-2xl text-sm font-bold border transition cursor-pointer ${
                  selected === p
                    ? "bg-[#FF6A1A] border-[#FF6A1A] text-black shadow-lg shadow-[#FF6A1A]/30"
                    : "bg-white/[0.04] border-white/10 text-white hover:border-[#FF6A1A]/40"
                }`}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="mb-6">
          <p className="text-xs text-neutral-400 font-semibold mb-2 uppercase tracking-wider">Or Custom Amount</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
            <input
              type="number"
              min="1"
              max="500"
              value={custom}
              onChange={e => { setCustom(e.target.value); setSelected(null); }}
              placeholder="Enter amount…"
              className="w-full bg-white/[0.04] border border-white/10 focus:border-[#FF6A1A]/50 rounded-2xl pl-8 pr-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-600"
            />
          </div>
          {amount > 0 && amount <= 500 && (
            <p className="text-xs text-neutral-400 mt-2">
              New balance: <span className="text-white font-bold">${(balance + amount).toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleTopUp}
          disabled={busy || amount <= 0}
          className="w-full h-14 rounded-2xl font-bold text-black flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-xl shadow-[#FF6A1A]/20"
          style={{ background: "linear-gradient(135deg, #FF6A1A, #ff8a3d)" }}
        >
          {busy ? (
            <span className="animate-pulse">Processing…</span>
          ) : (
            <><Zap size={16} /> Add ${amount > 0 ? amount.toFixed(2) : "0.00"} to Wallet</>
          )}
        </motion.button>

        {/* Note */}
        <p className="text-center text-[10px] text-neutral-600 mt-4">Demo mode — no real charge. Max top-up $500/transaction.</p>
      </motion.div>
    </>
  );
}

function MenuRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#FF6A1A]">{icon}</div>
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ChevronRight size={16} className="text-neutral-500" />
    </button>
  );
}
function ToggleRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/5">
      <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-[#FF6A1A]">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full p-0.5 transition ${value ? "bg-[#FF6A1A]" : "bg-white/10"}`}>
        <motion.div animate={{ x: value ? 20 : 0 }} className="w-5 h-5 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
