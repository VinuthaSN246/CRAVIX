import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
  head: () => ({ meta: [{ title: "Favorites — Flavora Kitchen" }] }),
});

function Favorites() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-28">
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <Link to="/" className="w-10 h-10 grid place-items-center rounded-full bg-white/5"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-bold">Favorites</h1>
      </header>
      <div className="text-center py-24 px-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/5 grid place-items-center mb-4">
          <Heart className="text-[#FF6A1A]" size={32} />
        </div>
        <h2 className="text-lg font-bold">No favorites yet</h2>
        <p className="text-sm text-neutral-400 mt-1">Tap the heart on a dish to save it here.</p>
      </div>
      <BottomNav />
    </div>
  );
}
