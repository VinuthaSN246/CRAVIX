import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { useMemo } from "react";

export const Route = createFileRoute("/order-done")({
  component: OrderDone,
  head: () => ({ meta: [{ title: "Order Confirmed — Flavora Kitchen" }] }),
});

function OrderDone() {
  const nav = useNavigate();
  const confetti = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
      color: ["#FF6A1A", "#ffd166", "#ffffff", "#ff3d00"][i % 4],
      size: 6 + Math.random() * 8,
    })),
    [],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 relative overflow-hidden pb-24">
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: -50, x: `${c.x}%`, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 720 }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: "linear" }}
          style={{ width: c.size, height: c.size, background: c.color }}
          className="absolute rounded-sm"
        />
      ))}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-8xl mb-6 drop-shadow-2xl"
        >
          😍
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold bg-gradient-to-r from-[#FF6A1A] to-[#ffd166] bg-clip-text text-transparent"
        >
          Congratulations!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-neutral-400 mt-3 max-w-xs"
        >
          Your order has been confirmed successfully. Sit back, your meal is on its way.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav({ to: "/" })}
          className="mt-10 w-full max-w-xs bg-[#FF6A1A] hover:bg-[#ff7a30] text-white font-bold py-4 rounded-2xl shadow-2xl shadow-[#FF6A1A]/40"
        >
          OK
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
}
