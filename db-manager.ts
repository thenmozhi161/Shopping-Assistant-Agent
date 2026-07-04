import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");

export interface Database {
  users: any[];
  products: any[];
  carts: { [username: string]: any[] };
  wishlists: { [username: string]: string[] };
  price_alerts: { [username: string]: any[] };
}

// Default Seed Data matching the initial server state
const initialProducts = [
  {
    id: "prod-1",
    name: "ZenBook Coder Pro 14",
    brand: "Asus",
    price: 1199,
    originalPrice: 1349,
    category: "Laptops",
    rating: 4.8,
    reviewsCount: 142,
    features: ["Intel Core i7 13th Gen", "16GB LPDDR5 RAM", "1TB NVMe SSD", "14.5\" OLED 120Hz Screen", "Military-grade Aluminum Case"],
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80",
    description: "The ultimate laptop engineered specifically for code compilers, docker container virtualization, and multiple IDE runtimes. Designed with eye-care OLED technology for long night-shift sessions.",
    priceHistory: [
      { date: "May 01", price: 1349 },
      { date: "May 15", price: 1299 },
      { date: "Jun 01", price: 1299 },
      { date: "Jun 15", price: 1249 },
      { date: "Jul 01", price: 1199 }
    ],
    stock: 24
  },
  {
    id: "prod-2",
    name: "Inspiron 15 Dev Edition",
    brand: "Dell",
    price: 549,
    originalPrice: 599,
    category: "Laptops",
    rating: 4.4,
    reviewsCount: 88,
    features: ["AMD Ryzen 5", "16GB DDR4 RAM", "512GB SSD", "15.6\" FHD Anti-glare", "Spill-resistant Keyboard"],
    imageUrl: "https://images.unsplash.com/photo-1496181130204-755241524eab?w=400&q=80",
    description: "Budget-friendly compilation station tailored for computer science students and freelance developers. Excellent value-to-performance ratio with highly upgradeable memory sockets.",
    priceHistory: [
      { date: "May 01", price: 599 },
      { date: "May 15", price: 589 },
      { date: "Jun 01", price: 569 },
      { date: "Jun 15", price: 549 },
      { date: "Jul 01", price: 549 }
    ],
    stock: 15
  },
  {
    id: "prod-3",
    name: "Sony WH-1000XM5 ANC",
    brand: "Sony",
    price: 348,
    originalPrice: 399,
    category: "Audio",
    rating: 4.9,
    reviewsCount: 520,
    features: ["Industry-leading ANC", "30-Hour Battery Life", "Speak-to-Chat", "Multipoint Bluetooth 5.2", "LDAC Hi-Res Audio"],
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    description: "Immersive over-ear noise-cancelling headphones that isolate typing noise and office chatter perfectly. Features adaptive environmental noise cancellation.",
    priceHistory: [
      { date: "May 01", price: 399 },
      { date: "May 15", price: 379 },
      { date: "Jun 01", price: 379 },
      { date: "Jun 15", price: 358 },
      { date: "Jul 01", price: 348 }
    ],
    stock: 40
  },
  {
    id: "prod-4",
    name: "Soundcore Life Q30 Hybrid",
    brand: "Anker",
    price: 79,
    originalPrice: 89,
    category: "Audio",
    rating: 4.5,
    reviewsCount: 310,
    features: ["Hybrid Active Noise Cancellation", "40-Hour Playtime", "NFC Fast Pairing", "Custom EQ App Settings", "Memory Foam Earcups"],
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80",
    description: "Highly rated budget over-ear headphones featuring multi-mode active noise isolation, detailed highs, and a comfortable design ideal for casual work environments.",
    priceHistory: [
      { date: "May 01", price: 89 },
      { date: "May 15", price: 89 },
      { date: "Jun 01", price: 84 },
      { date: "Jun 15", price: 79 },
      { date: "Jul 01", price: 79 }
    ],
    stock: 50
  },
  {
    id: "prod-5",
    name: "EcoThread Organic Cotton Hoodie",
    brand: "EcoStyle",
    price: 65,
    originalPrice: 85,
    category: "Apparel",
    rating: 4.7,
    reviewsCount: 95,
    features: ["100% GOTS Certified Cotton", "Fair Trade Certified", "Non-toxic Natural Dyes", "Durably Double-Stitched", "Carbon-neutral Supply Chain"],
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
    description: "Ultra-soft, sustainably sourced premium heavyweight hoodie. Crafted ethically with high structural durability to combat fast-fashion waste cycle.",
    priceHistory: [
      { date: "May 01", price: 85 },
      { date: "May 15", price: 75 },
      { date: "Jun 01", price: 75 },
      { date: "Jun 15", price: 65 },
      { date: "Jul 01", price: 65 }
    ],
    stock: 12
  },
  {
    id: "prod-6",
    name: "Barista Conical Burr Grinder",
    brand: "Breville",
    price: 199,
    originalPrice: 249,
    category: "Kitchen",
    rating: 4.6,
    reviewsCount: 115,
    features: ["Stainless Steel Conical Burrs", "60 Precise Grind Settings", "Electronic Dosing Timer", "12oz Hopper with Smart Lock", "Low Heat Retention System"],
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    description: "Professional-grade electric burr grinder focusing on uniform particle distribution. Prevents thermal degradation of coffee bean essential oils during high-speed grinding.",
    priceHistory: [
      { date: "May 01", price: 249 },
      { date: "May 15", price: 229 },
      { date: "Jun 01", price: 219 },
      { date: "Jun 15", price: 199 },
      { date: "Jul 01", price: 199 }
    ],
    stock: 8
  },
  {
    id: "prod-7",
    name: "Keychron K2 wireless V2",
    brand: "Keychron",
    price: 89,
    originalPrice: 99,
    category: "PC Accessories",
    rating: 4.7,
    reviewsCount: 204,
    features: ["Hot-Swappable Switches", "Gateron G Pro Brown Switches", "Double-shot PBT Keycaps", "Wired/Bluetooth 5.1", "4000mAh Massive Battery"],
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80",
    description: "75% layout compact mechanical keyboard delivering superior tactile feedback. Designed to integrate seamlessly with both macOS and Windows architectures.",
    priceHistory: [
      { date: "May 01", price: 99 },
      { date: "May 15", price: 95 },
      { date: "Jun 01", price: 89 },
      { date: "Jun 15", price: 89 },
      { date: "Jul 01", price: 89 }
    ],
    stock: 30
  }
];

const initialUsers = [
  { id: "usr-1", username: "julianne", email: "thenmozhivsb23@gmail.com", password: "password123" }
];

const initialCarts = {
  "julianne": [
    { id: "cart-1", productId: "prod-3", quantity: 1, product: initialProducts[2] }
  ]
};

const initialWishlists = {
  "julianne": ["prod-1", "prod-7"]
};

const initialPriceAlerts = {
  "julianne": [
    { id: "alert-1", productId: "prod-1", targetPrice: 1100, currentPrice: 1199, productName: "ZenBook Coder Pro 14", active: true }
  ]
};

// Singleton storage cache in memory to minimize heavy synchronous I/O
let cachedDb: Database | null = null;

export function loadDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  // Ensure directories exist or standard path checking
  if (!fs.existsSync(DB_FILE)) {
    const data: Database = {
      users: initialUsers,
      products: initialProducts,
      carts: initialCarts,
      wishlists: initialWishlists,
      price_alerts: initialPriceAlerts,
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to seed db.json", e);
    }
    cachedDb = data;
    return data;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    cachedDb = JSON.parse(raw);
    return cachedDb!;
  } catch (err) {
    console.error("Error parsing db.json, returning default states", err);
    return {
      users: initialUsers,
      products: initialProducts,
      carts: initialCarts,
      wishlists: initialWishlists,
      price_alerts: initialPriceAlerts,
    };
  }
}

export function saveDb(data: Database): void {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save changes to db.json", err);
  }
}
