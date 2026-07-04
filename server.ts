import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please set your Gemini API Key in Settings > Secrets."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Persistent JSON File Database (db.json active)
import { loadDb, saveDb } from "./db-manager";

const db = loadDb();
const USERS = db.users;
const PRODUCTS = db.products;
const CARTS = db.carts;
const WISHLISTS = db.wishlists;
const PRICE_ALERTS = db.price_alerts;

function persistChanges() {
  saveDb({
    users: USERS,
    products: PRODUCTS,
    carts: CARTS,
    wishlists: WISHLISTS,
    price_alerts: PRICE_ALERTS
  });
}


// ---------------- USER AUTH ENDPOINTS ----------------

app.post("/api/auth/signup", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const exists = USERS.some((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "User already exists with that username or email." });
  }

  const newUser = { id: `usr-${Date.now()}`, username, email, password };
  USERS.push(newUser);

  // Initialize their stores
  CARTS[username] = [];
  WISHLISTS[username] = [];
  PRICE_ALERTS[username] = [];

  persistChanges();

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    token: "mock-jwt-token-for-" + newUser.username
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = USERS.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    token: "mock-jwt-token-for-" + user.username
  });
});

app.post("/api/auth/profile", (req, res) => {
  const { username, email } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username key is required to match profile" });
  }

  const user = USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (email) user.email = email;
  persistChanges();
  res.json({ id: user.id, username: user.username, email: user.email });
});


// ---------------- PRODUCT SEARCH ENDPOINTS ----------------

app.get("/api/products", (req, res) => {
  const { q, category, minPrice, maxPrice, brand } = req.query;
  let results = [...PRODUCTS];

  if (q) {
    const term = String(q).toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }

  if (category) {
    results = results.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (brand) {
    results = results.filter((p) => p.brand.toLowerCase() === String(brand).toLowerCase());
  }

  if (minPrice) {
    results = results.filter((p) => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter((p) => p.price <= Number(maxPrice));
  }

  res.json(results);
});

app.get("/api/products/:id", (req, res) => {
  const product = PRODUCTS.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});


// ---------------- CART OPERATIONS ----------------

app.get("/api/cart", (req, res) => {
  const username = String(req.query.username || "julianne");
  const cart = CARTS[username] || [];
  res.json(cart);
});

app.post("/api/cart", (req, res) => {
  const username = String(req.body.username || "julianne");
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }

  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (!CARTS[username]) {
    CARTS[username] = [];
  }

  const existingItem = CARTS[username].find((item) => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += Number(quantity || 1);
  } else {
    CARTS[username].push({
      id: `cart-${Date.now()}`,
      productId,
      quantity: Number(quantity || 1),
      product
    });
  }

  persistChanges();
  res.json(CARTS[username]);
});

app.put("/api/cart", (req, res) => {
  const username = String(req.body.username || "julianne");
  const { cartItemId, quantity } = req.body;

  if (!CARTS[username]) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const item = CARTS[username].find((item) => item.id === cartItemId);
  if (item) {
    item.quantity = Math.max(1, Number(quantity));
  }

  persistChanges();
  res.json(CARTS[username]);
});

app.delete("/api/cart", (req, res) => {
  const username = String(req.query.username || "julianne");
  const cartItemId = String(req.query.cartItemId);

  if (CARTS[username]) {
    CARTS[username] = CARTS[username].filter((item) => item.id !== cartItemId);
  }

  persistChanges();
  res.json(CARTS[username] || []);
});


// ---------------- WISHLIST OPERATIONS ----------------

app.get("/api/wishlist", (req, res) => {
  const username = String(req.query.username || "julianne");
  const list = WISHLISTS[username] || [];
  const wishlistProducts = PRODUCTS.filter((p) => list.includes(p.id));
  res.json(wishlistProducts);
});

app.post("/api/wishlist", (req, res) => {
  const username = String(req.body.username || "julianne");
  const { productId } = req.body;

  if (!WISHLISTS[username]) {
    WISHLISTS[username] = [];
  }

  if (!WISHLISTS[username].includes(productId)) {
    WISHLISTS[username].push(productId);
  }

  persistChanges();
  const wishlistProducts = PRODUCTS.filter((p) => WISHLISTS[username].includes(p.id));
  res.json(wishlistProducts);
});

app.delete("/api/wishlist", (req, res) => {
  const username = String(req.query.username || "julianne");
  const productId = String(req.query.productId);

  if (WISHLISTS[username]) {
    WISHLISTS[username] = WISHLISTS[username].filter((id) => id !== productId);
  }

  persistChanges();
  const wishlistProducts = PRODUCTS.filter((p) => (WISHLISTS[username] || []).includes(p.id));
  res.json(wishlistProducts);
});


// ---------------- PRICE ALERTS ----------------

app.get("/api/alerts", (req, res) => {
  const username = String(req.query.username || "julianne");
  res.json(PRICE_ALERTS[username] || []);
});

app.post("/api/alerts", (req, res) => {
  const username = String(req.body.username || "julianne");
  const { productId, targetPrice } = req.body;

  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (!PRICE_ALERTS[username]) {
    PRICE_ALERTS[username] = [];
  }

  const newAlert = {
    id: `alert-${Date.now()}`,
    productId,
    targetPrice: Number(targetPrice),
    currentPrice: product.price,
    productName: product.name,
    active: true
  };

  PRICE_ALERTS[username].push(newAlert);
  persistChanges();
  res.json(PRICE_ALERTS[username]);
});

app.delete("/api/alerts", (req, res) => {
  const username = String(req.query.username || "julianne");
  const alertId = String(req.query.alertId);

  if (PRICE_ALERTS[username]) {
    PRICE_ALERTS[username] = PRICE_ALERTS[username].filter((a) => a.id !== alertId);
  }

  persistChanges();
  res.json(PRICE_ALERTS[username] || []);
});


// ---------------- AI CHAT & RECOM ENGINE ----------------

app.post("/api/shopping/chat", async (req, res) => {
  try {
    const { message, history, persona, useSearch } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    // Contextual system prompt for recommendations using seed products
    let personaInstruction = "";
    if (persona === "frugal") {
      personaInstruction = "You are a Frugal Deal Finder. Focus extensively on price-to-performance, sales, coupons, and budget-friendly alternatives. Highlight our active catalog options where users can save most.";
    } else if (persona === "tech-spec") {
      personaInstruction = "You are an expert Tech Spec Analyst. Emphasize technical details, performance benchmarks, core construction material, and compatibility metrics.";
    } else if (persona === "eco") {
      personaInstruction = "You are an Eco-Friendly curator. Prioritize organic materials, circular economy indexes, and carbon footprints.";
    } else if (persona === "minimalist") {
      personaInstruction = "You are a Minimalist Curator. Recommend versatile, space-efficient, multi-purpose items with superior design values.";
    } else {
      personaInstruction = "You are a clever, friendly Shopping Assistant Agent.";
    }

    // Embed current catalogue details so the model can make real product matches!
    const productCatalogContext = PRODUCTS.map(p => `
- ID: "${p.id}", Name: "${p.name}", Brand: "${p.brand}", Price: $${p.price} (Original: $${p.originalPrice}), Category: "${p.category}", Rating: ${p.rating}, Key Features: [${p.features.join(", ")}]. Description: ${p.description}
    `).join("\n");

    const systemInstruction = `
${personaInstruction}

You are helping users discover items. You have access to our direct inventory list (listed below). When appropriate, recommend matches from this direct catalog by their exact ID and name.

=== DIRECT CATALOG INVENTORY ===
${productCatalogContext}
================================

Guidelines:
1. Speak in a helpful, conversational tone. Use Markdown extensively for styling (bold names, structured bullet-point evaluation, lists).
2. If the user asks for recommendations (e.g. "laptop for coding" or "best audio under $100"), explicitly mention matching products from the DIRECT CATALOG. Describe WHY they are perfect fits.
3. Keep answers concise, highly human, and professional. Avoid repeating system details. Include external suggestions if our catalog does not cover the user's specific request.
`;

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const config: any = { systemInstruction };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let response;
    let fallbackUsed = false;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config,
      });
    } catch (err: any) {
      if (useSearch) {
        console.warn("Search grounding failed, retrying without search grounding. Error:", err.message);
        fallbackUsed = true;
        const fallbackConfig = { ...config };
        delete fallbackConfig.tools;
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: fallbackConfig,
        });
      } else {
        throw err;
      }
    }

    let text = response.text || "No response received.";
    if (fallbackUsed) {
      text += "\n\n*(Note: Real-time Google Search grounding was bypassed because the current API key search quota is limited or exceeded. Showing standard assistant recommendation instead.)*";
    }

    let searchResults: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      searchResults = chunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || "Web Search Source",
          url: chunk.web.uri,
        }));
    }

    res.json({ text, searchResults });
  } catch (error: any) {
    console.error("Error in /api/shopping/chat:", error);
    res.status(500).json({ error: error.message || "Failed to process chat response." });
  }
});

// Prompt Optimization ("give brompt")
app.post("/api/shopping/optimize-prompt", async (req, res) => {
  try {
    const { rawPrompt } = req.body;
    if (!rawPrompt) {
      return res.status(400).json({ error: "rawPrompt is required" });
    }

    const ai = getGeminiClient();

    const promptText = `
Take this raw shopping intent and optimize it for a professional prompt evaluation block: "${rawPrompt}"
Analyze and reply with raw JSON matching:
{
  "optimizedPrompt": "Professional level detailed search query specifying material, thresholds, standards, certifications",
  "category": "Inferred short category",
  "recommendedAspects": ["Aspect A", "Aspect B", "Aspect C", "Aspect D"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedPrompt: { type: Type.STRING },
            category: { type: Type.STRING },
            recommendedAspects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["optimizedPrompt", "category", "recommendedAspects"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/shopping/optimize-prompt:", error);
    res.status(500).json({ error: error.message || "Failed to optimize." });
  }
});

// Product Deeper Analysis
app.post("/api/shopping/analyze-product", async (req, res) => {
  try {
    const { productQuery } = req.body;
    if (!productQuery) {
      return res.status(400).json({ error: "productQuery is required" });
    }

    const ai = getGeminiClient();

    let response;
    let fallbackUsed = false;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Perform an expert product analysis for: "${productQuery}". Match parameters, estimate price ranges, list 3 pros, 3 cons, target audience and critical evaluation criteria. Use search grounding to fetch live pricing and recent model feedback.`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a Consumer Reports Product Analyst. Keep your insights clean, structured with Markdown headings, lists, and deep technical clarity.",
        },
      });
    } catch (err: any) {
      console.warn("Analyze product search grounding failed, retrying without search grounding. Error:", err.message);
      fallbackUsed = true;
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Perform an expert product analysis for: "${productQuery}". Match parameters, estimate price ranges, list 3 pros, 3 cons, target audience and critical evaluation criteria. Evaluate from your knowledge base.`,
        config: {
          systemInstruction: "You are a Consumer Reports Product Analyst. Keep your insights clean, structured with Markdown headings, lists, and deep technical clarity.",
        },
      });
    }

    let text = response.text || "No analysis generated.";
    if (fallbackUsed) {
      text += "\n\n*(Note: Real-time Google Search grounding was bypassed because the current API key search quota is limited or exceeded. Showing standard analysis recommendation instead.)*";
    }

    let searchResults: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      searchResults = chunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || "Web Search Source",
          url: chunk.web.uri,
        }));
    }

    res.json({ analysis: text, searchResults });
  } catch (error: any) {
    console.error("Error in /api/shopping/analyze-product:", error);
    res.status(500).json({ error: error.message || "Failed to analyze." });
  }
});


// Serve environment
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error starting server:", err);
});
