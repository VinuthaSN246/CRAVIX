// Local Mock Database for CRAVIX Food Delivery App
// Stores seed data in localStorage to enable offline development and demo mode.

export interface MockProfile {
  id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  wallet_balance: number;
  is_admin: boolean;
  role: "admin" | "customer";
  is_blocked: boolean;
  created_at: string;
}

export interface MockRestaurant {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

export interface MockDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string;
  rating: number;
  category: string;
  is_available: boolean;
  ingredients?: string[];
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  created_at: string;
}

export interface MockCategory {
  id: string;
  name: string;
  is_enabled: boolean;
  created_at: string;
}

export interface MockOrder {
  id: string;
  user_id: string;
  total: number;
  status: "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  address: string | null;
  payment_method: string | null;
  created_at: string;
}

export interface MockOrderItem {
  id: string;
  order_id: string;
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface MockFavorite {
  id: string;
  user_id: string;
  dish_id: string;
  created_at: string;
}

export interface MockReview {
  id: string;
  user_id: string;
  dish_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface MockCartItem {
  id: string;
  user_id: string;
  dish_id: string;
  quantity: number;
  created_at: string;
}

// Keys for localStorage
const KEYS = {
  PROFILES: "cravix_mock_profiles",
  RESTAURANTS: "cravix_mock_restaurants",
  DISHES: "cravix_mock_dishes",
  CATEGORIES: "cravix_mock_categories",
  ORDERS: "cravix_mock_orders",
  ORDER_ITEMS: "cravix_mock_order_items",
  FAVORITES: "cravix_mock_favorites",
  REVIEWS: "cravix_mock_reviews",
  CART_ITEMS: "cravix_mock_cart_items",
  SESSION: "cravix_mock_session",
};

// Seed Data
const SEED_PROFILES: MockProfile[] = [
  {
    id: "mock-admin-uuid-1111",
    username: "System Admin",
    email: "admin@gmail.com",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    wallet_balance: 1000.00,
    is_admin: true,
    role: "admin",
    is_blocked: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-customer-uuid-2222",
    username: "John Doe",
    email: "john@gmail.com",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    wallet_balance: 350.00,
    is_admin: false,
    role: "customer",
    is_blocked: false,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-customer-uuid-3333",
    username: "Sarah Connor",
    email: "sarah@gmail.com",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    wallet_balance: 120.50,
    is_admin: false,
    role: "customer",
    is_blocked: false,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-customer-uuid-4444",
    username: "Michael Scott",
    email: "michael@gmail.com",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    wallet_balance: 85.00,
    is_admin: false,
    role: "customer",
    is_blocked: true, // Seeding a blocked user to test block/unblock features!
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const SEED_RESTAURANTS: MockRestaurant[] = [
  { id: "rest-1", name: "Burger Queen", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", created_at: new Date().toISOString() },
  { id: "rest-2", name: "Pizzeria Napoli", image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500", created_at: new Date().toISOString() },
  { id: "rest-3", name: "Sushi House", image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500", created_at: new Date().toISOString() },
  { id: "rest-4", name: "La Trattoria", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500", created_at: new Date().toISOString() },
  { id: "rest-5", name: "Sweet Treats Co.", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500", created_at: new Date().toISOString() }
];

const SEED_CATEGORIES: MockCategory[] = [
  { id: "cat-1", name: "Burgers", is_enabled: true, created_at: new Date().toISOString() },
  { id: "cat-2", name: "Pizza", is_enabled: true, created_at: new Date().toISOString() },
  { id: "cat-3", name: "Sushi", is_enabled: true, created_at: new Date().toISOString() },
  { id: "cat-4", name: "Pasta", is_enabled: true, created_at: new Date().toISOString() },
  { id: "cat-5", name: "Salads", is_enabled: true, created_at: new Date().toISOString() },
  { id: "cat-6", name: "Desserts", is_enabled: true, created_at: new Date().toISOString() }
];

const SEED_DISHES: MockDish[] = [
  {
    id: "dish-1",
    name: "Classic Cheeseburger",
    description: "Premium beef patty, cheddar cheese, lettuce, tomato, special cravix sauce on brioche bun.",
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    rating: 4.8,
    category: "Burgers",
    is_available: true,
    ingredients: ["Beef Patty", "Cheddar", "Lettuce", "Tomato", "Cravix Sauce", "Brioche Bun"],
    nutrition: { calories: 650, protein: "35g", carbs: "45g", fat: "28g" },
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-2",
    name: "Truffle Mushroom Burger",
    description: "Beef patty, Swiss cheese, sautéed wild mushrooms, truffle aioli.",
    price: 15.49,
    image_url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500",
    rating: 4.9,
    category: "Burgers",
    is_available: true,
    ingredients: ["Beef Patty", "Swiss Cheese", "Mushrooms", "Truffle Aioli"],
    nutrition: { calories: 720, protein: "38g", carbs: "42g", fat: "34g" },
    created_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-3",
    name: "Pepperoni Passion Pizza",
    description: "Double pepperoni, mozzarella, signature tomato base, hot honey drizzle.",
    price: 16.99,
    image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
    rating: 4.7,
    category: "Pizza",
    is_available: true,
    ingredients: ["Pepperoni", "Mozzarella", "Tomato Base", "Hot Honey"],
    nutrition: { calories: 880, protein: "40g", carbs: "78g", fat: "32g" },
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-4",
    name: "Truffle Burrata Margherita",
    description: "Creamy burrata, fresh basil, cherry tomatoes, white truffle oil.",
    price: 18.99,
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
    rating: 4.9,
    category: "Pizza",
    is_available: true,
    ingredients: ["Burrata", "Basil", "Cherry Tomatoes", "Truffle Oil"],
    nutrition: { calories: 790, protein: "28g", carbs: "82g", fat: "26g" },
    created_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-5",
    name: "Dragon Sushi Roll",
    description: "Eel and cucumber inside, avocado and unagi sauce outside, sprinkled with sesame.",
    price: 14.99,
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500",
    rating: 4.6,
    category: "Sushi",
    is_available: true,
    ingredients: ["Eel", "Cucumber", "Avocado", "Rice", "Nori", "Unagi Sauce"],
    nutrition: { calories: 420, protein: "18g", carbs: "55g", fat: "12g" },
    created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-6",
    name: "Salmon Nigiri Platter",
    description: "6 pieces of premium fresh Atlantic salmon over vinegared sushi rice.",
    price: 17.50,
    image_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500",
    rating: 4.8,
    category: "Sushi",
    is_available: true,
    ingredients: ["Atlantic Salmon", "Sushi Rice", "Wasabi", "Pickled Ginger"],
    nutrition: { calories: 340, protein: "24g", carbs: "40g", fat: "8g" },
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-7",
    name: "Truffle Mushroom Tagliatelle",
    description: "Fresh hand-rolled pasta, wild mushrooms, creamy white truffle butter sauce, parmigiano.",
    price: 19.99,
    image_url: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500",
    rating: 4.9,
    category: "Pasta",
    is_available: true,
    ingredients: ["Tagliatelle", "Mushrooms", "Truffle Butter", "Parmigiano-Reggiano"],
    nutrition: { calories: 680, protein: "22g", carbs: "70g", fat: "26g" },
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-8",
    name: "Quinoa Avocado Crunch Salad",
    description: "Organic quinoa, diced avocado, baby spinach, cucumber, edamame, citrus vinaigrette.",
    price: 11.49,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
    rating: 4.5,
    category: "Salads",
    is_available: true,
    ingredients: ["Quinoa", "Avocado", "Baby Spinach", "Cucumber", "Edamame", "Citrus Vinaigrette"],
    nutrition: { calories: 320, protein: "10g", carbs: "28g", fat: "16g" },
    created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "dish-9",
    name: "Lava Chocolate Cake",
    description: "Rich dark chocolate cake with a warm, molten liquid chocolate center. Served with vanilla bean ice cream.",
    price: 8.99,
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
    rating: 4.9,
    category: "Desserts",
    is_available: true,
    ingredients: ["Dark Chocolate", "Flour", "Butter", "Sugar", "Vanilla Ice Cream"],
    nutrition: { calories: 540, protein: "6g", carbs: "62g", fat: "22g" },
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Generate mock historical orders for analytics charts
const generateMockOrders = (): { orders: MockOrder[]; items: MockOrderItem[] } => {
  const orders: MockOrder[] = [];
  const items: MockOrderItem[] = [];
  const userIds = ["mock-customer-uuid-2222", "mock-customer-uuid-3333"];
  const paymentMethods = ["card", "wallet", "cash"];
  const statuses: MockOrder["status"][] = ["Delivered", "Delivered", "Delivered", "Preparing", "Pending", "Cancelled"];

  // Generate 25 orders over the last 30 days
  for (let i = 0; i < 25; i++) {
    const orderId = `mock-order-${i + 100}`;
    const daysAgo = 29 - i; // evenly distributed
    const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000);
    const userId = userIds[i % userIds.length];
    
    // Choose 1-3 random dishes for this order
    const dishCount = 1 + (i % 3);
    let orderTotal = 0;
    
    for (let j = 0; j < dishCount; j++) {
      const dishIdx = (i + j * 2) % SEED_DISHES.length;
      const dish = SEED_DISHES[dishIdx];
      const quantity = 1 + (j % 2);
      const price = dish.price;
      orderTotal += price * quantity;
      
      items.push({
        id: `mock-item-${i}-${j}`,
        order_id: orderId,
        dish_id: dish.id,
        name: dish.name,
        price,
        quantity,
        image_url: dish.image_url
      });
    }

    orders.push({
      id: orderId,
      user_id: userId,
      total: Number(orderTotal.toFixed(2)),
      status: i === 24 ? "Pending" : i === 23 ? "Preparing" : i % 8 === 0 ? "Cancelled" : "Delivered",
      address: "123 Foodie Lane, Cravix City",
      payment_method: paymentMethods[i % paymentMethods.length],
      created_at: orderDate.toISOString()
    });
  }

  return { orders, items };
};

const mockOrderData = generateMockOrders();

// Helper to initialize local storage
export const initMockDb = () => {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(KEYS.PROFILES)) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
  }
  if (!localStorage.getItem(KEYS.RESTAURANTS)) {
    localStorage.setItem(KEYS.RESTAURANTS, JSON.stringify(SEED_RESTAURANTS));
  }
  if (!localStorage.getItem(KEYS.CATEGORIES)) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
  }
  if (!localStorage.getItem(KEYS.DISHES)) {
    localStorage.setItem(KEYS.DISHES, JSON.stringify(SEED_DISHES));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(mockOrderData.orders));
  }
  if (!localStorage.getItem(KEYS.ORDER_ITEMS)) {
    localStorage.setItem(KEYS.ORDER_ITEMS, JSON.stringify(mockOrderData.items));
  }
  if (!localStorage.getItem(KEYS.FAVORITES)) {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.REVIEWS)) {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CART_ITEMS)) {
    localStorage.setItem(KEYS.CART_ITEMS, JSON.stringify([]));
  }
};

// Typed getters/setters for localStorage
export const getProfiles = (): MockProfile[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.PROFILES) || "[]");
};

export const saveProfiles = (profiles: MockProfile[]) => {
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
};

export const getRestaurants = (): MockRestaurant[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.RESTAURANTS) || "[]");
};

export const saveRestaurants = (rests: MockRestaurant[]) => {
  localStorage.setItem(KEYS.RESTAURANTS, JSON.stringify(rests));
};

export const getDishes = (): MockDish[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.DISHES) || "[]");
};

export const saveDishes = (dishes: MockDish[]) => {
  localStorage.setItem(KEYS.DISHES, JSON.stringify(dishes));
};

export const getCategories = (): MockCategory[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || "[]");
};

export const saveCategories = (cats: MockCategory[]) => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
};

export const getOrders = (): MockOrder[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.ORDERS) || "[]");
};

export const saveOrders = (orders: MockOrder[]) => {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
};

export const getOrderItems = (): MockOrderItem[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.ORDER_ITEMS) || "[]");
};

export const saveOrderItems = (items: MockOrderItem[]) => {
  localStorage.setItem(KEYS.ORDER_ITEMS, JSON.stringify(items));
};

export const getFavorites = (): MockFavorite[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.FAVORITES) || "[]");
};

export const saveFavorites = (favs: MockFavorite[]) => {
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
};

export const getReviews = (): MockReview[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.REVIEWS) || "[]");
};

export const saveReviews = (reviews: MockReview[]) => {
  localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
};

export const getCartItems = (): MockCartItem[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem(KEYS.CART_ITEMS) || "[]");
};

export const saveCartItems = (items: MockCartItem[]) => {
  localStorage.setItem(KEYS.CART_ITEMS, JSON.stringify(items));
};

function projectFields(obj: Record<string, unknown>, fields: string): Record<string, unknown> {
  if (fields.trim() === "*") return { ...obj };
  const result: Record<string, unknown> = {};
  for (const field of splitSelectColumns(fields)) {
    if (field in obj) result[field] = obj[field];
  }
  return result;
}

function resolveForeignRow(
  row: Record<string, unknown>,
  foreignTable: string,
  fields: string,
  parentTable: string,
): unknown {
  if (parentTable === "cart_items" && foreignTable === "dishes") {
    const dish = getDishes().find((d) => d.id === row.dish_id);
    return dish ? projectFields(dish as unknown as Record<string, unknown>, fields) : null;
  }
  if (parentTable === "orders" && foreignTable === "order_items") {
    return getOrderItems()
      .filter((item) => item.order_id === row.id)
      .map((item) => (fields.trim() === "*" ? item : projectFields(item as unknown as Record<string, unknown>, fields)));
  }
  return null;
}

function splitSelectColumns(columns: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of columns) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function resolveSelectProjection(rows: any[], columns: string, tableName: string): any[] {
  if (!columns || columns === "*") {
    const nestedMatch = columns.match(/(\w+)\(\*\)/);
    if (nestedMatch) {
      const relationName = nestedMatch[1];
      return rows.map((row) => ({
        ...row,
        [relationName]: resolveForeignRow(row, relationName, "*", tableName),
      }));
    }
    return rows;
  }

  const nestedOnly = columns.match(/^(.+?),?\s*(\w+)\(\*\)$/);
  if (nestedOnly) {
    const [, baseCols, relationName] = nestedOnly;
    const base = baseCols.trim() === "*" ? rows : resolveSelectProjection(rows, baseCols, tableName);
    return base.map((row) => ({
      ...row,
      [relationName]: resolveForeignRow(row, relationName, "*", tableName),
    }));
  }

  if (!columns.includes(":") && !columns.includes("(")) {
    return rows.map((row) => projectFields(row, columns));
  }

  const parts = splitSelectColumns(columns);
  return rows.map((row) => {
    const projected: Record<string, unknown> = {};
    for (const part of parts) {
      const joinMatch = part.match(/^(\w+):(\w+)\(([^)]+)\)$/);
      if (joinMatch) {
        const [, alias, foreignTable, fields] = joinMatch;
        projected[alias] = resolveForeignRow(row, foreignTable, fields, tableName);
      } else if (part === "*") {
        Object.assign(projected, row);
      } else {
        projected[part] = row[part];
      }
    }
    return projected;
  });
}

function performInsert(tableName: string, payload: any): { data: any[] | null; error: any } {
  initMockDb();
  const rows = Array.isArray(payload) ? payload : [payload];

  switch (tableName) {
    case "profiles": {
      const current = getProfiles();
      const added = rows.map((r) => ({
        id: r.id || `mock-uid-${Math.random().toString(36).substr(2, 9)}`,
        username: r.username || null,
        email: r.email || "",
        avatar_url: r.avatar_url || null,
        wallet_balance: r.wallet_balance ?? 350.0,
        is_admin: r.is_admin ?? false,
        role: r.role ?? "customer",
        is_blocked: r.is_blocked ?? false,
        created_at: new Date().toISOString(),
      }));
      saveProfiles([...current, ...added]);
      return { data: added, error: null };
    }
    case "dishes": {
      const current = getDishes();
      const added = rows.map((r) => ({
        id: r.id || `mock-dish-${Math.random().toString(36).substr(2, 9)}`,
        name: r.name,
        description: r.description || null,
        price: Number(r.price),
        image_url: r.image_url,
        rating: r.rating ?? 4.8,
        category: r.category,
        is_available: r.is_available ?? true,
        ingredients: r.ingredients || [],
        nutrition: r.nutrition || null,
        created_at: new Date().toISOString(),
      }));
      saveDishes([...current, ...added]);
      return { data: added, error: null };
    }
    case "categories": {
      const current = getCategories();
      const added = rows.map((r) => ({
        id: r.id || `mock-cat-${Math.random().toString(36).substr(2, 9)}`,
        name: r.name,
        is_enabled: r.is_enabled ?? true,
        created_at: new Date().toISOString(),
      }));
      saveCategories([...current, ...added]);
      return { data: added, error: null };
    }
    case "orders": {
      const current = getOrders();
      const added = rows.map((r) => ({
        id: r.id || `mock-order-${Math.random().toString(36).substr(2, 9)}`,
        user_id: r.user_id,
        total: Number(r.total),
        status: r.status ?? "Pending",
        address: r.address || null,
        payment_method: r.payment_method || null,
        created_at: new Date().toISOString(),
      }));
      saveOrders([...current, ...added]);
      return { data: added, error: null };
    }
    case "order_items": {
      const current = getOrderItems();
      const added = rows.map((r) => ({
        id: r.id || `mock-item-${Math.random().toString(36).substr(2, 9)}`,
        order_id: r.order_id,
        dish_id: r.dish_id,
        name: r.name,
        price: Number(r.price),
        quantity: Number(r.quantity),
        image_url: r.image_url || null,
      }));
      saveOrderItems([...current, ...added]);
      return { data: added, error: null };
    }
    case "favorites": {
      const current = getFavorites();
      const added = rows.map((r) => ({
        id: r.id || `mock-fav-${Math.random().toString(36).substr(2, 9)}`,
        user_id: r.user_id,
        dish_id: r.dish_id,
        created_at: new Date().toISOString(),
      }));
      saveFavorites([...current, ...added]);
      return { data: added, error: null };
    }
    case "reviews": {
      const current = getReviews();
      const added = rows.map((r) => ({
        id: r.id || `mock-rev-${Math.random().toString(36).substr(2, 9)}`,
        user_id: r.user_id,
        dish_id: r.dish_id,
        order_id: r.order_id,
        rating: Number(r.rating),
        comment: r.comment || null,
        created_at: new Date().toISOString(),
      }));
      saveReviews([...current, ...added]);
      return { data: added, error: null };
    }
    case "cart_items": {
      const current = getCartItems();
      const added = rows.map((r) => ({
        id: r.id || `mock-cart-${Math.random().toString(36).substr(2, 9)}`,
        user_id: r.user_id,
        dish_id: r.dish_id,
        quantity: Number(r.quantity ?? 1),
        created_at: new Date().toISOString(),
      }));
      saveCartItems([...current, ...added]);
      return { data: added, error: null };
    }
    default:
      return { data: null, error: { message: `Mock Insert not implemented for ${tableName}` } };
  }
}

function getTableRows(tableName: string): any[] {
  switch (tableName) {
    case "profiles":
      return getProfiles();
    case "restaurants":
      return getRestaurants();
    case "dishes":
      return getDishes();
    case "categories":
      return getCategories();
    case "orders":
      return getOrders();
    case "order_items":
      return getOrderItems();
    case "favorites":
      return getFavorites();
    case "reviews":
      return getReviews();
    case "cart_items":
      return getCartItems();
    case "dish_addons":
      return [];
    default:
      return [];
  }
}

function saveTableRows(tableName: string, rows: any[]) {
  switch (tableName) {
    case "profiles":
      saveProfiles(rows);
      break;
    case "dishes":
      saveDishes(rows);
      break;
    case "categories":
      saveCategories(rows);
      break;
    case "orders":
      saveOrders(rows);
      break;
    case "order_items":
      saveOrderItems(rows);
      break;
    case "favorites":
      saveFavorites(rows);
      break;
    case "reviews":
      saveReviews(rows);
      break;
    case "cart_items":
      saveCartItems(rows);
      break;
  }
}

// Simulation of Supabase queries (fluent builder interface)
export class MockQueryBuilder {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Simplified query runner — must be sync so callers can chain .eq/.limit/.order before awaiting.
  select(columns: string = "*", options?: { count?: "exact" }) {
    initMockDb();
    const data = getTableRows(this.tableName);
    const count = options?.count === "exact" ? data.length : null;
    return new MockFilterBuilder(data, count, columns, this.tableName, options?.count === "exact");
  }

  insert(payload: any) {
    return new MockInsertBuilder(this.tableName, payload);
  }

  update(payload: any) {
    return new MockUpdateBuilder(this.tableName, payload);
  }

  delete() {
    return new MockDeleteBuilder(this.tableName);
  }
}

class MockInsertBuilder {
  private tableName: string;
  private payload: any;

  constructor(tableName: string, payload: any) {
    this.tableName = tableName;
    this.payload = payload;
  }

  select(_columns: string = "*") {
    return this;
  }

  async single() {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    const rows = data ?? [];
    if (rows.length === 0) return { data: null, error: { message: "JSON object not found" } };
    return { data: rows[0], error: null };
  }

  private async execute() {
    const { data, error } = performInsert(this.tableName, this.payload);
    return { data, error };
  }

  then(onfulfilled?: (value: { data: any; error: any }) => any) {
    return this.execute().then(onfulfilled);
  }
}

class MockFilterBuilder {
  private data: any[];
  private count: number | null;
  private selectColumns: string;
  private tableName: string;
  private countExact: boolean;

  constructor(
    data: any[],
    count: number | null = null,
    selectColumns: string = "*",
    tableName: string = "",
    countExact: boolean = false,
  ) {
    this.data = data;
    this.count = count;
    this.selectColumns = selectColumns;
    this.tableName = tableName;
    this.countExact = countExact;
  }

  private buildResult() {
    const projected = resolveSelectProjection(this.data, this.selectColumns, this.tableName);
    return {
      data: projected,
      count: this.countExact ? this.data.length : this.count,
      error: null,
    };
  }

  eq(column: string, value: any) {
    this.data = this.data.filter(row => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.data = this.data.filter(row => row[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.data = this.data.filter(row => values.includes(row[column]));
    return this;
  }

  order(column: string, option?: { ascending?: boolean }) {
    const asc = option?.ascending !== false;
    this.data = [...this.data].sort((a, b) => {
      const va = a[column];
      const vb = b[column];
      if (typeof va === "string") {
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return asc ? va - vb : vb - va;
    });
    return this;
  }

  limit(count: number) {
    this.data = this.data.slice(0, count);
    return this;
  }

  async maybeSingle() {
    const { data, count, error } = this.buildResult();
    return { data: data.length > 0 ? data[0] : null, count, error };
  }

  async single() {
    const { data, count, error } = this.buildResult();
    if (data.length === 0) {
      return { data: null, count, error: { message: "JSON object not found" } };
    }
    return { data: data[0], count, error };
  }

  then(onfulfilled?: (value: { data: any[]; count: number | null; error: any }) => any) {
    return Promise.resolve(this.buildResult()).then(onfulfilled);
  }
}

class MockUpdateBuilder {
  private tableName: string;
  private payload: any;
  private filters: { column: string; value: any }[] = [];

  constructor(tableName: string, payload: any) {
    this.tableName = tableName;
    this.payload = payload;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  async then(onfulfilled?: (value: { data: any; error: any }) => any) {
    initMockDb();
    let updatedRows: any[] = [];
    const dbRows = getTableRows(this.tableName);

    const modified = dbRows.map((row) => {
      const matches = this.filters.every((f) => row[f.column] === f.value);
      if (matches) {
        const updated = { ...row, ...this.payload };
        if (updated.price !== undefined) updated.price = Number(updated.price);
        if (updated.wallet_balance !== undefined) updated.wallet_balance = Number(updated.wallet_balance);
        if (updated.quantity !== undefined) updated.quantity = Number(updated.quantity);
        updatedRows.push(updated);
        return updated;
      }
      return row;
    });

    saveTableRows(this.tableName, modified);

    const result = { data: updatedRows, error: null };
    return Promise.resolve(result).then(onfulfilled);
  }
}

class MockDeleteBuilder {
  private tableName: string;
  private filters: { column: string; value: any }[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  async then(onfulfilled?: (value: { data: any; error: any }) => any) {
    initMockDb();
    const dbRows = getTableRows(this.tableName);
    const remainingRows: any[] = [];
    const deletedRows: any[] = [];

    dbRows.forEach((row) => {
      const matches = this.filters.every((f) => row[f.column] === f.value);
      if (matches) {
        deletedRows.push(row);
      } else {
        remainingRows.push(row);
      }
    });

    saveTableRows(this.tableName, remainingRows);

    const result = { data: deletedRows, error: null };
    return Promise.resolve(result).then(onfulfilled);
  }
}
