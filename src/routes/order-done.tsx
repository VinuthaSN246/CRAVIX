import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, ChefHat, Truck, MapPin, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/order-done")({
  component: OrderDone,
  head: () => ({ meta: [{ title: "Order Confirmed — Flavora Kitchen" }] }),
});

function OrderDone() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [eta, setEta] = useState(25);

  // Stepper state updates every 10 seconds to simulate real-time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        if (s < 3) {
          if (s === 0) setEta(18);
          if (s === 1) setEta(8);
          if (s === 2) setEta(2);
          return s + 1;
        }
        setEta(0);
        clearInterval(interval);
        return 3;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const confetti = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 3 + Math.random() * 2,
      color: ["#FF6A1A", "#ffd166", "#ffffff", "#ff3d00"][i % 4],
      size: 5 + Math.random() * 6,
    })),
    [],
  );

  const trackingSteps = [
    { label: "Order Confirmed", desc: "Kitchen has accepted your order", icon: CheckCircle2 },
    { label: "Chef Preparing Meal", desc: "Prepared fresh with seasonal ingredients", icon: ChefHat },
    { label: "Out for Delivery", desc: "Delivery partner is on the way to you", icon: Truck },
    { label: "Delivered", desc: "Enjoy your hot, fresh meal!", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 relative overflow-x-hidden pb-32">
      {/* Confetti decoration */}
      {step === 0 && confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -50, x: `${c.x}%`, opacity: 0, rotate: 0 }}
          animate={{ y: "80vh", opacity: [0, 1, 1, 0], rotate: 720 }}
          transition={{ duration: c.duration, delay: c.delay, repeat: 1, ease: "linear" }}
          style={{ width: c.size, height: c.size, background: c.color }}
          className="absolute rounded-sm pointer-events-none z-0"
        />
      ))}

      <div className="relative z-10 max-w-md mx-auto px-5 pt-8 space-y-6">
        {/* Celebration Header */}
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-6xl mb-3"
          >
            {step === 3 ? "😋" : "🎉"}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black bg-gradient-to-r from-[#FF6A1A] to-[#ffd166] bg-clip-text text-transparent text-center"
          >
            {step === 3 ? "Order Delivered!" : "Order is on its way!"}
          </motion.h1>
          <p className="text-xs text-neutral-400 mt-1">
            Order ID: FLV-{Math.floor(100000 + Math.random() * 900000)}
          </p>
        </div>

        {/* Dynamic Countdown Timer Banner */}
        <div className="bg-gradient-to-br from-[#1E1B15] to-[#121212] border border-[#FF6A1A]/25 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6A1A]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-[#FF6A1A] font-bold">Estimated Arrival</div>
              <div className="text-3xl font-black mt-1 text-white">
                {step === 3 ? "0 mins" : `${eta} mins`}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {step === 3 ? "Delivered at " : "Arriving by "}
                <span className="font-bold text-neutral-200">
                  {new Date(Date.now() + eta * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FF6A1A]/10 border border-[#FF6A1A]/20 flex items-center justify-center">
              <Truck className="w-6 h-6 text-[#FF6A1A] animate-bounce" />
            </div>
          </div>
          
          {/* Animated progress bar */}
          <div className="mt-4 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              className="bg-[#FF6A1A] h-full rounded-full"
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Map placeholder */}
        <div className="relative h-44 rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80"
            alt="Delivery Map"
            className="w-full h-full object-cover opacity-35 filter brightness-75 select-none pointer-events-none"
          />
          {/* Map Grid Lines Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-[#0a0a0a]/40 pointer-events-none" />
          
          {/* Dotted Delivery route path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 50 120 Q 150 40 250 110 T 360 30"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeDasharray="4 6"
              className="opacity-40"
            />
          </svg>

          {/* Courier animated marker */}
          {step < 3 && (
            <motion.div
              animate={{
                x: step === 0 ? [-100, -50] : step === 1 ? [-50, 40] : [40, 120],
                y: step === 0 ? [30, 0] : step === 1 ? [0, 40] : [40, -30],
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className="absolute w-8 h-8 rounded-full bg-[#FF6A1A] flex items-center justify-center border-2 border-white shadow-lg shadow-[#FF6A1A]/40"
            >
              <Truck size={14} className="text-black" />
            </motion.div>
          )}

          {/* Restaurant Marker */}
          <div className="absolute left-10 bottom-10 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>
          
          {/* Customer destination marker */}
          <div className="absolute right-12 top-8 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-lg">
            <MapPin size={10} className="text-white" />
          </div>
        </div>

        {/* Live Stepper Details */}
        <div className="bg-[#141414] border border-white/10 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs uppercase font-black tracking-wider text-neutral-400 text-left">Status Timeline</h3>
          
          <div className="space-y-4">
            {trackingSteps.map((s, idx) => {
              const completed = step >= idx;
              const active = step === idx;
              const Icon = s.icon;
              
              return (
                <div key={idx} className="flex gap-4 relative">
                  {/* Vertical Line */}
                  {idx < trackingSteps.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 bottom-[-16px] w-[2px] transition ${completed ? "bg-[#FF6A1A]" : "bg-neutral-800"}`}
                    />
                  )}
                  
                  {/* Step Icon Indicator */}
                  <div
                    className={`w-8.5 h-8.5 rounded-full border border-2 flex items-center justify-center z-10 transition ${completed ? "bg-black border-[#FF6A1A] text-[#FF6A1A]" : "bg-neutral-900 border-neutral-800 text-neutral-600"}`}
                  >
                    <Icon size={14} className={active ? "animate-pulse scale-110" : ""} />
                  </div>
                  
                  {/* Step details */}
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-bold transition ${completed ? "text-neutral-100" : "text-neutral-500"}`}>
                      {s.label}
                    </div>
                    <div className={`text-[11px] mt-0.5 transition ${completed ? "text-neutral-400" : "text-neutral-600"}`}>
                      {s.desc}
                    </div>
                  </div>
                  
                  {completed && !active && (
                    <div className="text-[10px] text-[#FF6A1A] font-semibold self-center">Done</div>
                  )}
                  {active && (
                    <span className="text-[9px] bg-[#FF6A1A]/10 border border-[#FF6A1A]/20 px-2 py-0.5 rounded-full font-bold text-[#FF6A1A] self-center animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Agent Card */}
        {step >= 2 && step < 3 && (
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Rider avatar"
              className="w-11 h-11 rounded-full object-cover border border-white/10"
            />
            <div className="flex-1 text-left">
              <div className="text-xs text-neutral-400">Delivery Partner</div>
              <div className="text-sm font-bold text-neutral-100">Jessica Miller</div>
              <div className="text-[10px] text-emerald-400 font-medium">★ 4.9 Rating</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.success("Calling Jessica Miller...")}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                <Phone size={14} className="text-[#FF6A1A]" />
              </button>
              <button
                onClick={() => toast.success("Opening chat with Jessica...")}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#FF6A1A]" />
              </button>
            </div>
          </div>
        )}

        {/* Support Call-to-action */}
        <div className="flex gap-2">
          <button
            onClick={() => nav({ to: "/" })}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer"
          >
            Back to Home
          </button>
          <button
            onClick={() => toast.success("Chatting with customer support...")}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-[#FF6A1A] font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
