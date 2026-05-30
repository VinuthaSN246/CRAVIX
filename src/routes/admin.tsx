import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, TrendingUp, Users, ShoppingBag, UtensilsCrossed, Trash2, 
  Edit2, Check, X, Search, Shield, LayoutDashboard, Store, Plus, Lock, LogOut, CheckSquare, RefreshCw, BarChart2, Calendar, PieChart as PieChartIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { format, subDays, parseISO, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin Panel — CRAVIX" }] }),
});

const ORANGE = "#FF6A1A";
const COLORS = ["#FF6A1A", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#6366f1"];
const ORDER_STATUSES = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

type Stat = { label: string; value: string; icon: React.ReactNode };
type Order = { id: string; user_id: string; total: number; status: "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled"; created_at: string; payment_method: string | null; address: string | null };
type Dish = { id: string; name: string; description: string | null; price: number; image_url: string; category: string; is_available: boolean; rating: number };
type Category = { id: string; name: string; is_enabled: boolean; created_at: string };
type Profile = { id: string; username: string | null; email: string; avatar_url: string | null; role: "admin" | "customer"; is_admin: boolean; is_blocked: boolean; wallet_balance: number; created_at: string };
type OrderItem = { id: string; order_id: string; dish_id: string; name: string; quantity: number; price: number; image_url: string | null };
type Restaurant = { id: string; name: string; image_url: string; created_at: string };

function AdminDashboard() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  // Database States
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "foods" | "categories" | "orders" | "users" | "analytics" | "profile">("overview");

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<Profile | null>(null);

  // Add/Edit Dish States
  const [dishForm, setDishForm] = useState({ name: "", description: "", price: "", image_url: "", category: "", is_available: true });
  const [dishFormErrors, setDishFormErrors] = useState<Record<string, string>>({});
  const [dishSubmitting, setDishSubmitting] = useState(false);
  const [editDishId, setEditDishId] = useState<string | null>(null);
  const [editDishForm, setEditDishForm] = useState<Partial<Dish>>({});

  // Add/Edit Category States
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Admin Profile States
  const [adminProfileForm, setAdminProfileForm] = useState({ username: "", avatar_url: "" });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Analytics View State
  const [analyticsView, setAnalyticsView] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (import.meta.env.DEV) {
        toast.info("Local development: Accessing dashboard in guest/dev mode");
        setChecking(false);
        loadAll();
        return;
      }
      nav({ to: "/" });
      return;
    }
    
    supabase.from("profiles").select("is_admin, role").eq("id", user.id).maybeSingle().then(async ({ data }) => {
      const isAdmin = data?.is_admin || (data as any)?.role === "admin";
      if (!isAdmin) {
        if (import.meta.env.DEV) {
          console.log("[Admin] Local dev detected: Attempting to self-promote profile to admin...");
          const { error } = await supabase.from("profiles").update({ is_admin: true, role: "admin" }).eq("id", user.id);
          if (!error) {
            toast.success("Local development: Your account has been promoted to Admin!");
            setChecking(false);
            loadAll();
            return;
          }
        }
        nav({ to: "/" });
        return;
      }
      setChecking(false);
      loadAll();
    });
  }, [user, loading]);

  async function loadAll() {
    console.log("[Admin] Loading database metrics...");
    const [ordersRes, profilesRes, dishesRes, categoriesRes, restaurantsRes, orderItemsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("dishes").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("created_at", { ascending: false }),
      supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*"),
    ]);

    const allOrders = (ordersRes.data as Order[]) ?? [];
    const allProfiles = (profilesRes.data as Profile[]) ?? [];
    const allDishes = (dishesRes.data as Dish[]) ?? [];
    const allCategories = (categoriesRes.data as Category[]) ?? [];
    const allRestaurants = (restaurantsRes.data as Restaurant[]) ?? [];
    const allOrderItems = (orderItemsRes.data as OrderItem[]) ?? [];

    setOrders(allOrders);
    setProfiles(allProfiles);
    setDishes(allDishes);
    setCategories(allCategories);
    setRestaurants(allRestaurants);
    setOrderItems(allOrderItems);

    // Set Admin Profile default form values based on current logged in user
    if (user) {
      const currentProfile = allProfiles.find(p => p.id === user.id);
      if (currentProfile) {
        setAdminProfileForm({
          username: currentProfile.username || "",
          avatar_url: currentProfile.avatar_url || ""
        });
      }
    }

    const totalRevenue = allOrders
      .filter(o => o.status !== "Cancelled")
      .reduce((s, o) => s + Number(o.total), 0);

    setStats([
      { label: "Total Users", value: String(allProfiles.length), icon: <Users size={20} /> },
      { label: "Total Restaurants", value: String(allRestaurants.length), icon: <Store size={20} /> },
      { label: "Total Food Items", value: String(allDishes.length), icon: <UtensilsCrossed size={20} /> },
      { label: "Total Orders", value: String(allOrders.length), icon: <ShoppingBag size={20} /> },
      { label: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <TrendingUp size={20} /> },
    ]);
  }

  // Dish Operations
  function validateDishForm() {
    const errors: Record<string, string> = {};
    if (!dishForm.name.trim()) errors.name = "Name is required";
    if (!dishForm.price || isNaN(Number(dishForm.price)) || Number(dishForm.price) <= 0) errors.price = "Valid price required";
    if (!dishForm.image_url.trim()) errors.image_url = "Image URL is required";
    if (!dishForm.category.trim()) errors.category = "Category is required";
    setDishFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function addDish() {
    if (!validateDishForm()) return;
    setDishSubmitting(true);
    const { error } = await supabase.from("dishes").insert({
      name: dishForm.name.trim(),
      description: dishForm.description.trim() || null,
      price: Number(dishForm.price),
      image_url: dishForm.image_url.trim(),
      category: dishForm.category,
      is_available: dishForm.is_available,
    });
    setDishSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dish added successfully!");
    setDishForm({ name: "", description: "", price: "", image_url: "", category: "", is_available: true });
    loadAll();
  }

  async function updateDish(id: string) {
    const { error } = await supabase.from("dishes").update(editDishForm).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dish updated successfully!");
    setEditDishId(null);
    setEditDishForm({});
    loadAll();
  }

  async function deleteDish(id: string) {
    const { error } = await supabase.from("dishes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dish deleted successfully!");
    loadAll();
  }

  // Category Operations
  async function addCategory() {
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    const { error } = await supabase.from("categories").insert({
      name: categoryName.trim(),
      is_enabled: true
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Category added!");
    setCategoryName("");
    loadAll();
  }

  async function updateCategory(id: string) {
    if (!editCategoryName.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editCategoryName.trim() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category updated!");
    setEditCategoryId(null);
    setEditCategoryName("");
    loadAll();
  }

  async function toggleCategoryEnabled(id: string, currentStatus: boolean) {
    const { error } = await supabase.from("categories").update({ is_enabled: !currentStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category status updated!");
    loadAll();
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Category deleted!");
    loadAll();
  }

  // User Management Operations
  async function toggleUserBlockStatus(profileId: string, currentBlocked: boolean) {
    if (profileId === user?.id) {
      toast.error("You cannot block your own admin account!");
      return;
    }
    const newBlocked = !currentBlocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newBlocked }).eq("id", profileId);
    if (error) { toast.error(error.message); return; }
    toast.success(newBlocked ? "User blocked successfully" : "User unblocked successfully");
    loadAll();
  }

  // Order Management Operations
  async function updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order status updated to: ${status}`);
    loadAll();
  }

  // Admin Profile Operations
  async function saveAdminProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: adminProfileForm.username,
      avatar_url: adminProfileForm.avatar_url
    }).eq("id", user.id);
    setProfileSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated successfully!");
    loadAll();
  }

  async function changeAdminPassword(e: React.FormEvent) {
    e.preventDefault();
    if (adminPasswordForm.new !== adminPasswordForm.confirm) {
      toast.error("New passwords do not match!");
      return;
    }
    if (adminPasswordForm.new.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: adminPasswordForm.new });
    setPasswordSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password changed successfully!");
    setAdminPasswordForm({ current: "", new: "", confirm: "" });
  }

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    nav({ to: "/auth" });
  }

  // User Profile Mapping
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  // Filters logic
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === "all" || o.status.toLowerCase() === orderStatusFilter.toLowerCase();
    const searchLower = orderSearch.toLowerCase();
    const buyer = profileMap.get(o.user_id);
    const buyerName = buyer?.username || buyer?.email || "Customer";
    const matchesSearch = 
      o.id.toLowerCase().includes(searchLower) || 
      buyerName.toLowerCase().includes(searchLower) ||
      (o.payment_method && o.payment_method.toLowerCase().includes(searchLower)) ||
      String(o.total).includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const filteredUsers = profiles.filter((p) => {
    const searchLower = userSearch.toLowerCase();
    return (
      (p.username && p.username.toLowerCase().includes(searchLower)) ||
      p.email.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower)
    );
  });

  const filteredDishes = dishes.filter((d) => {
    const searchLower = dishSearch.toLowerCase();
    return d.name.toLowerCase().includes(searchLower) || d.category.toLowerCase().includes(searchLower);
  });

  // Analytics Computation
  const getAnalyticsData = () => {
    const paidOrders = orders.filter(o => o.status !== "Cancelled");
    
    if (analyticsView === "daily") {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dateStr = format(d, "EEE");
        const dayRevenue = paidOrders
          .filter((o) => isSameDay(parseISO(o.created_at), d))
          .reduce((s, o) => s + Number(o.total), 0);
        days.push({ label: dateStr, sales: Number(dayRevenue.toFixed(2)) });
      }
      return days;
    } else if (analyticsView === "weekly") {
      // Last 4 weeks
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const d = subDays(new Date(), i * 7);
        const weekStart = startOfWeek(d);
        const weekLabel = `Week of ${format(weekStart, "MMM d")}`;
        const weekRevenue = paidOrders
          .filter((o) => isSameWeek(parseISO(o.created_at), d))
          .reduce((s, o) => s + Number(o.total), 0);
        weeks.push({ label: weekLabel, sales: Number(weekRevenue.toFixed(2)) });
      }
      return weeks;
    } else {
      // Last 6 months
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = format(d, "MMM yyyy");
        const monthRevenue = paidOrders
          .filter((o) => isSameMonth(parseISO(o.created_at), d))
          .reduce((s, o) => s + Number(o.total), 0);
        months.push({ label: monthLabel, sales: Number(monthRevenue.toFixed(2)) });
      }
      return months;
    }
  };

  const analyticsData = getAnalyticsData();

  // Top Selling Foods
  const foodSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  orderItems.forEach((item) => {
    const dish = dishes.find(d => d.id === item.dish_id);
    const name = dish ? dish.name : item.name;
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    if (!foodSalesMap[item.dish_id]) {
      foodSalesMap[item.dish_id] = { name, quantity: 0, revenue: 0 };
    }
    foodSalesMap[item.dish_id].quantity += qty;
    foodSalesMap[item.dish_id].revenue += qty * price;
  });

  const popularDishesData = Object.values(foodSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Most Ordered Categories
  const categorySalesMap: Record<string, number> = {};
  orderItems.forEach((item) => {
    const dish = dishes.find(d => d.id === item.dish_id);
    const category = dish ? dish.category : "Others";
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    categorySalesMap[category] = (categorySalesMap[category] || 0) + (qty * price);
  });

  const categorySalesData = Object.entries(categorySalesMap)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .filter(d => d.value > 0);

  // Order Status Summaries
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSummaryData = ORDER_STATUSES.map(status => ({
    name: status,
    value: statusCounts[status] || 0
  }));

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[#FF6A1A]" />
          <div className="text-neutral-500 text-sm font-semibold tracking-wider uppercase">Verifying Admin Credentials…</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col md:flex-row pb-28 md:pb-0"
    >
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#141414] border-b md:border-b-0 md:border-r border-white/10 shrink-0 md:h-screen sticky top-0 z-30 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/5 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6A1A] to-[#ff3d00] grid place-items-center">
              <Shield className="text-white" size={18} />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-white">CRAVIX</span>
              <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Admin Control</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5 overflow-x-auto md:overflow-x-visible flex md:flex-col gap-2 md:gap-0 scrollbar-none">
            {[
              { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
              { id: "foods", label: "Food Items", icon: <UtensilsCrossed size={16} /> },
              { id: "categories", label: "Categories", icon: <CheckSquare size={16} /> },
              { id: "orders", label: "Orders", icon: <ShoppingBag size={16} /> },
              { id: "users", label: "Users", icon: <Users size={16} /> },
              { id: "analytics", label: "Analytics", icon: <TrendingUp size={16} /> },
              { id: "profile", label: "Admin Profile", icon: <Shield size={16} /> },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer w-full text-left ${
                    active 
                      ? "bg-[#FF6A1A] text-black shadow-lg shadow-[#FF6A1A]/15" 
                      : "text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/5 border border-white/5"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Back Link */}
        <div className="p-4 border-t border-white/5 hidden md:block">
          <button 
            onClick={() => nav({ to: "/" })}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-neutral-400 hover:text-white text-xs font-bold cursor-pointer transition"
          >
            <ArrowLeft size={14} /> Back to App
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-5 md:p-8 space-y-8">
        {/* Top bar on Mobile */}
        <header className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => nav({ to: "/" })} className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 border border-white/10">
              <ArrowLeft size={14} />
            </button>
            <h1 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Control Room</h1>
          </div>
          <span className="text-[10px] tracking-wide font-black text-black bg-[#FF6A1A] rounded-full px-2.5 py-0.5 uppercase">
            Admin Mode
          </span>
        </header>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-2xl font-black">Dashboard Overview</h1>
                    <p className="text-xs text-neutral-400 mt-1">Real-time statistics and summary logs.</p>
                  </div>
                  <button onClick={loadAll} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 cursor-pointer">
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Stats Grid */}
                {!stats ? (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6A1A]/5 rounded-bl-full group-hover:scale-110 transition-transform duration-300" />
                        <div className="w-8 h-8 rounded-xl bg-[#FF6A1A]/10 grid place-items-center mb-3 text-[#FF6A1A]">
                          {s.icon}
                        </div>
                        <div className="text-lg font-black tracking-tight" style={{ color: ORANGE }}>{s.value}</div>
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Status Breakdown */}
                  <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Order Status Breakdown</h3>
                    <div className="space-y-2">
                      {ORDER_STATUSES.map((status, index) => {
                        const count = statusCounts[status] || 0;
                        const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-neutral-400">{status}</span>
                              <span>{count} orders ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Orders List */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Recent Orders</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Order ID</TableHead>
                            <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Customer</TableHead>
                            <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Total</TableHead>
                            <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.slice(0, 5).map((o) => {
                            const customer = profileMap.get(o.user_id);
                            return (
                              <TableRow key={o.id} className="border-white/5 hover:bg-white/[0.01]">
                                <TableCell className="text-xs font-mono font-bold">#{o.id.slice(0, 6).toUpperCase()}</TableCell>
                                <TableCell className="text-xs font-semibold text-neutral-300">
                                  {customer?.username || customer?.email?.split("@")[0] || "Customer"}
                                </TableCell>
                                <TableCell className="text-xs font-black text-[#FF6A1A]">${Number(o.total).toFixed(2)}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                    o.status === "Delivered" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    o.status === "Cancelled" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                    o.status === "Pending" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                    "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                  }`}>
                                    {o.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-[10px] text-neutral-500">
                                  {new Date(o.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOOD ITEMS TAB */}
            {activeTab === "foods" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black">Food Items Manager</h1>
                  <p className="text-xs text-neutral-400 mt-1">Manage food cards, availability status, categories, and pricing.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Add Food Form */}
                  <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 h-fit">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Add New Food Item</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Name</label>
                        <input
                          value={dishForm.name}
                          onChange={(e) => setDishForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Dish name..."
                          className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100 ${
                            dishFormErrors.name ? "border-red-500/50" : "border-white/10"
                          }`}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-neutral-500">Price ($)</label>
                          <input
                            value={dishForm.price}
                            onChange={(e) => setDishForm((f) => ({ ...f, price: e.target.value }))}
                            placeholder="12.99"
                            className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100 ${
                              dishFormErrors.price ? "border-red-500/50" : "border-white/10"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-neutral-500">Category</label>
                          <select
                            value={dishForm.category}
                            onChange={(e) => setDishForm((f) => ({ ...f, category: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-2 text-xs text-neutral-300 outline-none cursor-pointer"
                          >
                            <option value="">Select category...</option>
                            {categories.filter(c => c.is_enabled).map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Image URL</label>
                        <input
                          value={dishForm.image_url}
                          onChange={(e) => setDishForm((f) => ({ ...f, image_url: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Description</label>
                        <textarea
                          value={dishForm.description}
                          onChange={(e) => setDishForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Describe ingredients, taste profile..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100 h-16 resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="is_available"
                          checked={dishForm.is_available}
                          onChange={(e) => setDishForm((f) => ({ ...f, is_available: e.target.checked }))}
                          className="rounded border-white/10 bg-black text-[#FF6A1A] focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="is_available" className="text-xs font-bold text-neutral-300 cursor-pointer">Available for Order</label>
                      </div>

                      <button
                        onClick={addDish}
                        disabled={dishSubmitting}
                        className="w-full h-10 px-6 rounded-xl text-xs font-bold text-black disabled:opacity-60 cursor-pointer transition flex items-center justify-center gap-2 mt-4"
                        style={{ background: ORANGE }}
                      >
                        <Plus size={14} /> {dishSubmitting ? "Adding…" : "Add Dish"}
                      </button>
                    </div>
                  </div>

                  {/* Food items list */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Menu List ({filteredDishes.length})</h3>
                      <div className="relative w-full sm:w-48">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                          value={dishSearch}
                          onChange={(e) => setDishSearch(e.target.value)}
                          placeholder="Search foods..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#FF6A1A]/40 text-neutral-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredDishes.map((d) => (
                        <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                          <img src={d.image_url} alt={d.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          
                          {editDishId === d.id ? (
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input
                                value={editDishForm.name ?? d.name}
                                onChange={(e) => setEditDishForm(f => ({ ...f, name: e.target.value }))}
                                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                                placeholder="Name"
                              />
                              <input
                                value={editDishForm.price ?? d.price}
                                onChange={(e) => setEditDishForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                                placeholder="Price"
                              />
                              <select
                                value={editDishForm.category ?? d.category}
                                onChange={(e) => setEditDishForm(f => ({ ...f, category: e.target.value }))}
                                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                              >
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <div className="flex items-center gap-2 pl-2">
                                <input
                                  type="checkbox"
                                  id={`edit-avail-${d.id}`}
                                  checked={editDishForm.is_available ?? d.is_available}
                                  onChange={(e) => setEditDishForm(f => ({ ...f, is_available: e.target.checked }))}
                                  className="rounded border-white/10 bg-black text-[#FF6A1A] focus:ring-0 cursor-pointer"
                                />
                                <label htmlFor={`edit-avail-${d.id}`} className="text-xs font-bold text-neutral-400 cursor-pointer">Available</label>
                              </div>
                              <input
                                value={editDishForm.image_url ?? d.image_url}
                                onChange={(e) => setEditDishForm(f => ({ ...f, image_url: e.target.value }))}
                                className="col-span-2 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                                placeholder="Image URL"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs truncate text-neutral-200">{d.name}</span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  d.is_available ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {d.is_available ? "Available" : "Unavailable"}
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-500 mt-0.5">{d.category} · ${Number(d.price).toFixed(2)} · Rating: {d.rating}★</div>
                            </div>
                          )}

                          <div className="flex gap-1 shrink-0 self-end sm:self-center">
                            {editDishId === d.id ? (
                              <>
                                <button onClick={() => updateDish(d.id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400 hover:bg-emerald-500/20 cursor-pointer">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => { setEditDishId(null); setEditDishForm({}); }} className="w-8 h-8 rounded-lg bg-white/5 grid place-items-center text-neutral-400 hover:bg-white/10 cursor-pointer">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditDishId(d.id); setEditDishForm({ name: d.name, price: d.price, category: d.category, image_url: d.image_url, is_available: d.is_available }); }}
                                  className="w-8 h-8 rounded-lg bg-white/5 grid place-items-center text-neutral-400 hover:bg-white/10 cursor-pointer border border-white/5"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="w-8 h-8 rounded-lg bg-red-500/10 grid place-items-center text-red-400 hover:bg-red-500/20 cursor-pointer border border-red-500/10">
                                      <Trash2 size={12} />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-[#141414] border-white/10 text-neutral-100">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Food Item?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-neutral-400">
                                        Are you sure you want to permanently delete "{d.name}" from the database? This action is irreversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteDish(d.id)} className="bg-red-500 hover:bg-red-600 text-white border-0">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY MANAGEMENT TAB */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black">Category Management</h1>
                  <p className="text-xs text-neutral-400 mt-1">Add, edit, or disable food categories. Disabled categories hide from lists.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Add Category Form */}
                  <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 h-fit">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Add New Category</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-500">Category Name</label>
                        <input
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="e.g. Burgers, Pizza, Desserts..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                        />
                      </div>
                      <button
                        onClick={addCategory}
                        className="w-full h-10 px-6 rounded-xl text-xs font-bold text-black cursor-pointer transition flex items-center justify-center gap-2 mt-2"
                        style={{ background: ORANGE }}
                      >
                        <Plus size={14} /> Add Category
                      </button>
                    </div>
                  </div>

                  {/* Categories list */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 pb-2 border-b border-white/5">Categories ({categories.length})</h3>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {categories.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                          {editCategoryId === c.id ? (
                            <input
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                              placeholder="Category name"
                            />
                          ) : (
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <span className={`font-bold text-xs ${c.is_enabled ? "text-neutral-200" : "text-neutral-500 line-through"}`}>{c.name}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                c.is_enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-neutral-500 border border-white/5"
                              }`}>
                                {c.is_enabled ? "Active" : "Disabled"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Toggle Enable/Disable Category */}
                            <button
                              onClick={() => toggleCategoryEnabled(c.id, c.is_enabled)}
                              className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                                c.is_enabled 
                                  ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400" 
                                  : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {c.is_enabled ? "Disable" : "Enable"}
                            </button>

                            {editCategoryId === c.id ? (
                              <>
                                <button onClick={() => updateCategory(c.id)} className="w-8 h-8 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400 hover:bg-emerald-500/20 cursor-pointer">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => { setEditCategoryId(null); setEditCategoryName(""); }} className="w-8 h-8 rounded-lg bg-white/5 grid place-items-center text-neutral-400 hover:bg-white/10 cursor-pointer">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditCategoryId(c.id); setEditCategoryName(c.name); }}
                                  className="w-8 h-8 rounded-lg bg-white/5 grid place-items-center text-neutral-400 hover:bg-white/10 cursor-pointer border border-white/5"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="w-8 h-8 rounded-lg bg-red-500/10 grid place-items-center text-red-400 hover:bg-red-500/20 cursor-pointer border border-red-500/10">
                                      <Trash2 size={12} />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-[#141414] border-white/10 text-neutral-100">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-neutral-400">
                                        Are you sure you want to permanently delete category "{c.name}"? Food items in this category won't be deleted, but they won't list properly until category is reassigned.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteCategory(c.id)} className="bg-red-500 hover:bg-red-600 text-white border-0">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER MANAGEMENT TAB */}
            {activeTab === "orders" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div>
                    <h1 className="text-xl font-black">Order Management</h1>
                    <p className="text-xs text-neutral-500 mt-0.5">Manage customer orders and workflow statuses.</p>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search ID, customer, total..."
                        className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#FF6A1A]/40 text-neutral-200"
                      />
                    </div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s.toLowerCase()}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Order ID</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Customer</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Address</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Total</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((o) => {
                        const customer = profileMap.get(o.user_id);
                        return (
                          <TableRow key={o.id} className="border-white/5 hover:bg-white/[0.01]">
                            <TableCell className="text-xs font-mono font-bold">#{o.id.slice(0, 6).toUpperCase()}</TableCell>
                            <TableCell className="text-xs font-semibold text-neutral-300">
                              {customer?.username || customer?.email?.split("@")[0] || "Customer"}
                              <span className="block text-[9px] text-neutral-500">{customer?.email}</span>
                            </TableCell>
                            <TableCell className="text-xs text-neutral-400 max-w-[150px] truncate">{o.address ?? "—"}</TableCell>
                            <TableCell className="text-xs font-black text-[#FF6A1A]">${Number(o.total).toFixed(2)}</TableCell>
                            <TableCell>
                              <select
                                value={o.status}
                                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                className={`bg-[#161616] border rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer font-bold ${
                                  o.status === "Delivered" ? "border-emerald-500/20 text-emerald-400" :
                                  o.status === "Cancelled" ? "border-red-500/20 text-red-400" :
                                  o.status === "Pending" ? "border-yellow-500/20 text-yellow-400" :
                                  "border-blue-500/20 text-blue-400"
                                }`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="text-xs text-neutral-500">
                              {new Date(o.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-[10px] text-neutral-400 capitalize">{o.payment_method ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-neutral-500 text-xs">
                            No orders found matching filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* USER MANAGEMENT TAB */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div>
                      <h1 className="text-xl font-black">User Profiles</h1>
                      <p className="text-xs text-neutral-500 mt-0.5">Manage user status, restrict access, and view client history.</p>
                    </div>

                    <div className="relative w-full sm:w-48">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#FF6A1A]/40 text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">User</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Email</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Wallet Balance</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Role</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((p) => (
                          <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.01]">
                            <TableCell className="flex items-center gap-3">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#FF6A1A]/10 text-[#FF6A1A] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {p.username ? p.username[0] : "?"}
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-semibold text-neutral-200">{p.username || "Anonymous"}</span>
                                <span className="block text-[8px] text-neutral-500 font-mono">{p.id.slice(0, 8)}...</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-neutral-300">{p.email}</TableCell>
                            <TableCell className="text-xs font-bold text-[#FF6A1A]">${Number(p.wallet_balance).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                p.role === "admin" || p.is_admin ? "bg-[#FF6A1A]/10 border-[#FF6A1A]/20 text-[#FF6A1A]" : "bg-white/5 border-white/10 text-neutral-400"
                              }`}>
                                {p.role === "admin" || p.is_admin ? "Admin" : "Customer"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                p.is_blocked ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              }`}>
                                {p.is_blocked ? "Blocked" : "Active"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedUserForHistory(p)}
                                className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 cursor-pointer"
                              >
                                History
                              </button>
                              <button
                                onClick={() => toggleUserBlockStatus(p.id, p.is_blocked)}
                                disabled={p.id === user?.id}
                                className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition ${
                                  p.id === user?.id
                                    ? "opacity-30 cursor-not-allowed border-white/5 text-neutral-600 bg-transparent"
                                    : p.is_blocked
                                    ? "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                                    : "border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                }`}
                              >
                                {p.is_blocked ? "Unblock" : "Block"}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Sliding Panel for User Order History */}
                <AnimatePresence>
                  {selectedUserForHistory && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40"
                        onClick={() => setSelectedUserForHistory(null)}
                      />
                      <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-[#141414] border-l border-white/10 p-6 z-50 overflow-y-auto flex flex-col justify-between"
                      >
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div>
                              <h2 className="text-base font-black">User Order History</h2>
                              <p className="text-[11px] text-neutral-400 mt-0.5">{selectedUserForHistory.username || selectedUserForHistory.email}</p>
                            </div>
                            <button 
                              onClick={() => setSelectedUserForHistory(null)}
                              className="w-8 h-8 rounded-full bg-white/5 grid place-items-center hover:bg-white/10 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            {orders.filter(o => o.user_id === selectedUserForHistory.id).length === 0 ? (
                              <p className="text-xs text-neutral-500 py-10 text-center">This user has not placed any orders yet.</p>
                            ) : (
                              orders.filter(o => o.user_id === selectedUserForHistory.id).map(o => (
                                <div key={o.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-mono font-bold text-neutral-300">#{o.id.slice(0, 6).toUpperCase()}</span>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      o.status === "Delivered" ? "bg-emerald-500/10 text-emerald-400" :
                                      o.status === "Cancelled" ? "bg-red-500/10 text-red-400" :
                                      "bg-blue-500/10 text-blue-400"
                                    }`}>
                                      {o.status}
                                    </span>
                                  </div>
                                  
                                  {/* Items list */}
                                  <div className="space-y-1 pl-2 border-l border-white/5">
                                    {orderItems.filter(item => item.order_id === o.id).map(item => (
                                      <div key={item.id} className="text-[11px] text-neutral-400 flex justify-between">
                                        <span>{item.name} <strong className="text-white">x{item.quantity}</strong></span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                                    <span className="text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</span>
                                    <span className="font-black text-[#FF6A1A]">${Number(o.total).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedUserForHistory(null)}
                          className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-xs border border-white/10 transition mt-6 cursor-pointer"
                        >
                          Close History
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="flex items-end justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl font-black">Business Analytics</h1>
                    <p className="text-xs text-neutral-400 mt-1">Review sales progression, top sellers, and market performance.</p>
                  </div>
                  
                  {/* View Toggles */}
                  <div className="flex gap-1 bg-[#141414] border border-white/10 p-1 rounded-xl">
                    {[
                      { id: "daily", label: "Daily" },
                      { id: "weekly", label: "Weekly" },
                      { id: "monthly", label: "Monthly" }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => setAnalyticsView(btn.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                          analyticsView === btn.id 
                            ? "bg-[#FF6A1A] text-black" 
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Revenue area chart */}
                  <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#FF6A1A]" />
                        Sales progression ({analyticsView} view)
                      </h3>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ background: "#141414", border: "1px solid #ffffff10", borderRadius: 12 }}
                          labelStyle={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                          formatter={(v: number) => [`$${v.toFixed(2)}`, "Sales"]}
                        />
                        <Area type="monotone" dataKey="sales" stroke={ORANGE} strokeWidth={2} fill="url(#anGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Dummy analysis commentary panel */}
                  <div className="md:col-span-1 rounded-2xl border border-[#FF6A1A]/20 bg-[#FF6A1A]/5 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A1A] animate-pulse" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#FF6A1A]">Smart Insights</span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-neutral-100">Performance Summary</h4>
                      
                      <div className="text-xs text-neutral-400 space-y-2.5 leading-relaxed">
                        <p>
                          🔥 <strong>Demand Peak:</strong> Weekend lunch hours (12 PM - 2 PM) and dinner slots (6 PM - 8 PM) account for <strong>64%</strong> of overall weekly revenue.
                        </p>
                        <p>
                          🍔 <strong>Top Performer:</strong> <em>Classic Cheeseburger</em> remains our biggest sales driver, contributing to <strong>28.4%</strong> of total volume this month.
                        </p>
                        <p>
                          📈 <strong>Trend:</strong> Overall order frequency increased by <strong>12.6%</strong> following the launch of the CRAVIX Gold premium tier.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 text-[10px] text-neutral-500">
                      Recommendation: Promote desserts and drink add-ons on weeknights to bolster average ticket totals.
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top selling foods */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-[#FF6A1A]" />
                      Top Selling Foods (Sales Volume)
                    </h3>
                    
                    {popularDishesData.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-10 text-center">No sales data available.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={popularDishesData} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280", fontSize: 9 }} tickLine={false} width={80} />
                          <Tooltip
                            contentStyle={{ background: "#141414", border: "1px solid #ffffff10", borderRadius: 12 }}
                            formatter={(v: number) => [`${v} items`, "Volume"]}
                          />
                          <Bar dataKey="quantity" fill={ORANGE} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Revenue by category */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <PieChartIcon size={14} className="text-[#FF6A1A]" />
                      Revenue share by category ($)
                    </h3>

                    {categorySalesData.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-10 text-center">No category sales data available.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-40 h-40 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categorySalesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {categorySalesData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: "#141414", border: "1px solid #ffffff10", borderRadius: 12 }}
                                formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                          {categorySalesData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="truncate">{entry.name}: <strong className="text-white">${entry.value.toFixed(2)}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Edit Profile Form */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Edit Admin Profile</h3>
                  
                  <form onSubmit={saveAdminProfile} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Username</label>
                      <input
                        value={adminProfileForm.username}
                        onChange={(e) => setAdminProfileForm(f => ({ ...f, username: e.target.value }))}
                        placeholder="Admin Display Name"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Avatar Image URL</label>
                      <input
                        value={adminProfileForm.avatar_url}
                        onChange={(e) => setAdminProfileForm(f => ({ ...f, avatar_url: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="h-10 px-5 rounded-xl text-xs font-bold text-black disabled:opacity-60 cursor-pointer transition flex items-center justify-center gap-2"
                      style={{ background: ORANGE }}
                    >
                      {profileSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </form>
                </div>

                {/* Change Password Form */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">Change Password</h3>
                  
                  <form onSubmit={changeAdminPassword} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Current Password</label>
                      <input
                        type="password"
                        value={adminPasswordForm.current}
                        onChange={(e) => setAdminPasswordForm(f => ({ ...f, current: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">New Password</label>
                      <input
                        type="password"
                        value={adminPasswordForm.new}
                        onChange={(e) => setAdminPasswordForm(f => ({ ...f, new: e.target.value }))}
                        placeholder="At least 6 characters"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500">Confirm New Password</label>
                      <input
                        type="password"
                        value={adminPasswordForm.confirm}
                        onChange={(e) => setAdminPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                        placeholder="Re-type new password"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#FF6A1A]/40 transition text-neutral-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="h-10 px-5 rounded-xl text-xs font-bold text-black disabled:opacity-60 cursor-pointer transition flex items-center justify-center gap-2"
                      style={{ background: ORANGE }}
                    >
                      {passwordSaving ? "Updating…" : "Change Password"}
                    </button>
                  </form>
                </div>

                {/* Logout Card */}
                <div className="md:col-span-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2"><Lock size={16} className="text-red-400" /> Admin Control Logout</h4>
                    <p className="text-xs text-neutral-500 mt-1">Exit Admin Panel and clear authorization credentials.</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut size={14} /> Log out admin
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </motion.div>
  );
}
