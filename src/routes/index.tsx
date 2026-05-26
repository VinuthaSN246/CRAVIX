import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Search, ShoppingCart, Star, MapPin, Clock, Truck, ChefHat, Leaf,
  ArrowRight, Phone, Mail, Instagram, Facebook, Twitter, Menu as MenuIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Site,
  head: () => ({
    meta: [
      { title: "Flavora Kitchen — Premium Food Delivery" },
      { name: "description", content: "Flavora Kitchen delivers chef-crafted meals to your door. Fresh ingredients, bold flavors, lightning fast delivery." },
      { property: "og:title", content: "Flavora Kitchen — Premium Food Delivery" },
      { property: "og:description", content: "Chef-crafted meals delivered in 30 minutes." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const ORANGE = "#FF6A1A";

const IMG = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=900&fit=crop",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&h=900&fit=crop",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=900&fit=crop",
  chicken: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=900&h=900&fit=crop",
  steak: "https://images.unsplash.com/photo-1558030006-450675393462?w=900&h=900&fit=crop",
  shawarma: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=900&h=900&fit=crop",
  dessert: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&h=900&fit=crop",
  salad: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=900&h=900&fit=crop",
  pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&h=900&fit=crop",
  cake: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&h=900&fit=crop",
  tacos: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=900&fit=crop",
  ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900&h=900&fit=crop",
  hero: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1400&h=1400&fit=crop",
  chef: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=900&h=1100&fit=crop",
  kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",
  avatar1: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  avatar2: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  avatar3: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
};

function Site() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans antialiased overflow-x-hidden">
      <Nav />
      <Hero />
      <Stats />
      <Categories />
      <Popular />
      <About />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─────────────── Nav ─────────────── */
function Nav() {
  const [open, setOpen] = useState(false);
  const links = ["Home", "Menu", "About", "Reviews", "Contact"];
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)` }}>
            <ChefHat className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-bold tracking-tight">Flavora<span style={{ color: ORANGE }}>.</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-9 text-sm text-neutral-300">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/cart" className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition">
            <ShoppingCart className="w-4 h-4" />
          </Link>
          <Link to="/profile" className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition text-xs font-bold">
            Me
          </Link>
          <Link
            to="/cart"
            className="hidden sm:inline-flex items-center gap-2 px-5 h-11 rounded-full font-semibold text-sm text-black"
            style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)`, boxShadow: `0 10px 30px -10px ${ORANGE}` }}
          >
            Order Now <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="md:hidden w-10 h-10 grid place-items-center" onClick={() => setOpen(!open)}>
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 flex flex-col gap-3 bg-black/90">
          {links.map(l => <a key={l} href={`#${l.toLowerCase()}`} className="py-2 text-neutral-300">{l}</a>)}
        </div>
      )}
    </header>
  );
}

/* ─────────────── Hero ─────────────── */
function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* glow */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-30" style={{ background: ORANGE }} />
      <div className="absolute top-40 -left-40 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 bg-amber-500" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs tracking-wider uppercase text-neutral-300 mb-6">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ORANGE }} />
            Now delivering in your area
          </span>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
            Crave it.<br />
            <span style={{ background: `linear-gradient(135deg, ${ORANGE}, #ffb37a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Order it.
            </span><br />
            Devour it.
          </h1>
          <p className="mt-6 text-lg text-neutral-400 max-w-md leading-relaxed">
            Chef-crafted meals from the best kitchens in town, delivered hot to your door in under 30 minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="flex-1 flex items-center gap-2 px-4 h-14 rounded-full bg-white/5 border border-white/10">
              <Search className="w-4 h-4 text-neutral-400" />
              <input placeholder="Search for dishes…" className="bg-transparent flex-1 outline-none text-sm placeholder:text-neutral-500" />
            </div>
            <button
              className="h-14 px-7 rounded-full font-semibold text-black text-sm whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)`, boxShadow: `0 15px 40px -10px ${ORANGE}` }}
            >
              Find Food
            </button>
          </div>

          <div className="mt-10 flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold">4.9<span style={{ color: ORANGE }}>★</span></div>
              <div className="text-xs text-neutral-500">50K+ reviews</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex -space-x-3">
              {[IMG.avatar1, IMG.avatar2, IMG.avatar3].map((a, i) => (
                <img key={i} src={a} alt="" className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] object-cover" />
              ))}
            </div>
            <div className="text-sm text-neutral-400">Trusted by <span className="text-white font-semibold">120K+</span> foodies</div>
          </div>
        </motion.div>

        {/* Hero image with orbiting dishes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative h-[500px] md:h-[600px]"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(from 0deg, transparent, ${ORANGE}33, transparent)` }}
          />
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-8 rounded-full overflow-hidden border-4 border-white/10"
            style={{ boxShadow: `0 40px 100px -20px ${ORANGE}66` }}
          >
            <img src={IMG.hero} alt="Signature burger" className="w-full h-full object-cover" />
          </motion.div>

          {/* orbiting badges */}
          {[
            { img: IMG.pizza, x: "0%", y: "10%", d: 4 },
            { img: IMG.sushi, x: "85%", y: "20%", d: 5 },
            { img: IMG.ramen, x: "5%", y: "70%", d: 4.5 },
            { img: IMG.dessert, x: "80%", y: "75%", d: 5.5 },
          ].map((o, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className="absolute w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ left: o.x, top: o.y, background: "#1a1a1a" }}
            >
              <img src={o.img} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}

          {/* floating delivery badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10"
          >
            <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: ORANGE }}>
              <Truck className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Delivery in</div>
              <div className="font-bold">25 minutes</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Stats ─────────────── */
function Stats() {
  const stats = [
    { v: "500+", l: "Dishes on menu" },
    { v: "120K+", l: "Happy customers" },
    { v: "25 min", l: "Avg delivery" },
    { v: "50+", l: "Partner chefs" },
  ];
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center md:text-left"
          >
            <div className="text-3xl md:text-4xl font-black" style={{ color: ORANGE }}>{s.v}</div>
            <div className="text-sm text-neutral-400 mt-1">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Categories ─────────────── */
function Categories() {
  const cats = [
    { img: IMG.burger, n: "Burgers" },
    { img: IMG.pizza, n: "Pizza" },
    { img: IMG.sushi, n: "Sushi" },
    { img: IMG.pasta, n: "Pasta" },
    { img: IMG.salad, n: "Salads" },
    { img: IMG.dessert, n: "Desserts" },
  ];
  return (
    <section id="menu" className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: ORANGE }}>Categories</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Find your craving</h2>
        </div>
        <a href="#popular" className="text-sm text-neutral-400 hover:text-white inline-flex items-center gap-2">
          View all menu <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {cats.map((c, i) => (
          <motion.a
            key={c.n}
            href="#popular"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            className="group relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]"
          >
            <img src={c.img} alt={c.n} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 font-bold">{c.n}</div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Popular dishes ─────────────── */
type Dish = { id: string; name: string; description: string | null; price: number; image_url: string; rating: number };

function Popular() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("dishes").select("id, name, description, price, image_url, rating").then(({ data }) => setDishes((data as any) ?? []));
  }, []);

  async function addToCart(d: Dish) {
    if (!user) { nav({ to: "/auth" }); return; }
    setAdding(d.id);
    const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("dish_id", d.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      const { error } = await supabase.from("cart_items").insert({ user_id: user.id, dish_id: d.id, quantity: 1 });
      if (error) { toast.error(error.message); setAdding(null); return; }
    }
    toast.success(`${d.name} added to cart`);
    setAdding(null);
  }

  return (
    <section id="popular" className="max-w-7xl mx-auto px-6 pb-24">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: ORANGE }}>Popular dishes</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Tonight's favorites</h2>
        </div>
        <Link to="/cart" className="hidden sm:inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white">View cart <ArrowRight className="w-4 h-4" /></Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 3) * 0.08 }}
            whileHover={{ y: -8 }}
            className="group relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <motion.img
                src={d.image_url}
                alt={d.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                animate={{ y: [0, -4, 0] }}
                transition={{ y: { repeat: Infinity, duration: 4 + (i % 3), ease: "easeInOut" } }}
              />
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-xs">
                <Star className="w-3 h-3 fill-current" style={{ color: ORANGE }} /> {d.rating}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg">{d.name}</h3>
              <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{d.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500">From</span>
                  <div className="text-xl font-black" style={{ color: ORANGE }}>${Number(d.price).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => addToCart(d)}
                  disabled={false}
                  className="h-11 px-5 rounded-full font-semibold text-sm text-black inline-flex items-center gap-2 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)` }}
                >
                  {adding === d.id ? "Adding…" : <>Add <ShoppingCart className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── About ─────────────── */
function About() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
      <div className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10">
        <img src={IMG.chef} alt="Our chef" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
          <div className="w-12 h-12 rounded-full grid place-items-center" style={{ background: ORANGE }}>
            <ChefHat className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="font-bold">Marco Aurelio</div>
            <div className="text-xs text-neutral-400">Executive Chef · 15 yrs</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: ORANGE }}>About Flavora</div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
          Real chefs.<br />Real ingredients.<br />Real fast.
        </h2>
        <p className="mt-6 text-neutral-400 leading-relaxed">
          Every dish on Flavora is prepared by a vetted chef using locally-sourced, seasonal ingredients.
          No reheating. No shortcuts. Just real food, packed with care and delivered the moment it's ready.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {[
            { i: Leaf, t: "Fresh ingredients", d: "Sourced daily from local farms" },
            { i: ChefHat, t: "Top chefs", d: "Hand-picked culinary talent" },
            { i: Clock, t: "Always on time", d: "25-min average delivery" },
            { i: MapPin, t: "Track live", d: "Watch your order in real time" },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <Icon className="w-5 h-5 mb-2" style={{ color: ORANGE }} />
              <div className="font-semibold">{t}</div>
              <div className="text-xs text-neutral-400 mt-1">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How it works ─────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Choose your meal", d: "Browse 500+ dishes from top kitchens near you." },
    { n: "02", t: "We cook it fresh", d: "Your order is prepared the moment it hits the kitchen." },
    { n: "03", t: "Delivered hot", d: "Tracked, insulated, and on your table in 25 minutes." },
  ];
  return (
    <section className="bg-gradient-to-b from-transparent via-white/[0.02] to-transparent border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: ORANGE }}>How it works</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Three taps to dinner</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative p-8 rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 text-[120px] font-black opacity-5 leading-none">{s.n}</div>
              <div className="text-sm font-bold mb-4" style={{ color: ORANGE }}>STEP {s.n}</div>
              <h3 className="text-2xl font-bold mb-3">{s.t}</h3>
              <p className="text-neutral-400">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Testimonials ─────────────── */
function Testimonials() {
  const reviews = [
    { n: "Sarah K.", a: IMG.avatar3, t: "Food Blogger", q: "The truffle pizza arrived hotter than at the actual restaurant. Bonkers." },
    { n: "James L.", a: IMG.avatar1, t: "Designer", q: "I cancelled my other delivery apps. Flavora is just on another level." },
    { n: "Mia R.", a: IMG.avatar2, t: "Photographer", q: "Tracking is gorgeous, food is gorgeous, my mood is gorgeous. 10/10." },
  ];
  return (
    <section id="reviews" className="max-w-7xl mx-auto px-6 py-24">
      <div className="mb-12">
        <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: ORANGE }}>Reviews</div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Loved by foodies</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <motion.div
            key={r.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-3xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-current" style={{ color: ORANGE }} />
              ))}
            </div>
            <p className="text-lg leading-relaxed">"{r.q}"</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={r.a} alt="" className="w-11 h-11 rounded-full object-cover" />
              <div>
                <div className="font-semibold">{r.n}</div>
                <div className="text-xs text-neutral-400">{r.t}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── CTA ─────────────── */
function CTA() {
  return (
    <section id="contact" className="max-w-7xl mx-auto px-6 py-16">
      <div className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-16" style={{ background: `linear-gradient(135deg, ${ORANGE}, #ff8a3d)` }}>
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center text-black">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
              Hungry now?<br />Get $10 off your first order.
            </h2>
            <p className="mt-4 text-black/70 max-w-md">Download the Flavora app or order on web. Free delivery on orders over $25.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button className="h-14 px-7 rounded-full font-bold bg-black text-white">Download App</button>
            <button className="h-14 px-7 rounded-full font-bold bg-white/20 backdrop-blur border border-black/10">Order on web</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Footer ─────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: ORANGE }}>
              <ChefHat className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold">Flavora<span style={{ color: ORANGE }}>.</span></span>
          </div>
          <p className="text-sm text-neutral-400">Chef-crafted meals delivered fast. Real food, real fast.</p>
          <div className="flex gap-3 mt-5">
            {[Instagram, Facebook, Twitter].map((I, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full grid place-items-center bg-white/5 hover:bg-white/10">
                <I className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {[
          { h: "Explore", l: ["Menu", "Categories", "Chefs", "Gift cards"] },
          { h: "Company", l: ["About us", "Careers", "Press", "Blog"] },
          { h: "Contact", l: ["help@flavora.com", "+1 (555) 010-2024", "24/7 support"] },
        ].map((col) => (
          <div key={col.h}>
            <h4 className="font-bold mb-4">{col.h}</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              {col.l.map(item => <li key={item}><a href="#" className="hover:text-white">{item}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-neutral-500">
        © 2026 Flavora Kitchen. Crafted with appetite.
      </div>
    </footer>
  );
}
