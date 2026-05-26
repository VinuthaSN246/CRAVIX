import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Receipt, CreditCard, MapPin, Bell, HelpCircle, LogOut, ChevronRight, Moon, Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Flavora Kitchen" }] }),
});

type Profile = { username: string | null; avatar_url: string | null; wallet_balance: number };

function ProfilePage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    supabase.from("profiles").select("username, avatar_url, wallet_balance").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user, loading]);

  async function logout() {
    await supabase.auth.signOut();
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
          <h2 className="text-xl font-bold">{name}</h2>
          <p className="text-xs text-neutral-400">{user?.email}</p>
          <div className="mt-4 bg-gradient-to-r from-[#FF6A1A]/20 to-transparent border border-[#FF6A1A]/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A1A] grid place-items-center"><Wallet size={18} className="text-white" /></div>
            <div className="text-left">
              <div className="text-xs text-neutral-400">Wallet balance</div>
              <div className="text-lg font-bold">${(profile?.wallet_balance ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#141414] border border-white/10 rounded-3xl overflow-hidden">
          <ToggleRow icon={<Moon size={18} />} label="Dark Mode" value={dark} onChange={setDark} />
          <MenuRow icon={<Heart size={18} />} label="Favorites" />
          <MenuRow icon={<Receipt size={18} />} label="Orders" />
          <MenuRow icon={<CreditCard size={18} />} label="Payments" />
          <MenuRow icon={<MapPin size={18} />} label="Addresses" />
          <MenuRow icon={<Bell size={18} />} label="Notifications" />
          <MenuRow icon={<HelpCircle size={18} />} label="Help & Support" />
        </div>

        <button
          onClick={logout}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3.5 rounded-2xl hover:bg-red-500/20"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>

      <BottomNav />
    </div>
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
