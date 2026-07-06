# Shopping Assistant Agent

An intelligent, full-stack shopping assistant designed to help users search, analyze, compare, and monitor prices of products in a gorgeous **Frosted Glass** workspace. It integrates the **Gemini 3.5 Flash** model with Google Search Grounding to find live, up-to-date deals and product details.

---
## Prototype
https://remix-shopping-assistant-agent-998145370896.asia-southeast1.run.app


## 🌟 Core & Advanced Features

### 1. User Authentication
* **Seamless Login & Signup**: Sign in with secure, persistent mock session credentials.
* **Pre-seeded Account**: Start immediately with preset username `julianne` and password `password123`.
* **Workspace Synchronization**: Keep custom shopping carts, wishlist items, and price drop watchdogs automatically in sync.

### 2. Deep Product Search
* **Faceted Filtering**: Locate catalog products rapidly by name, brand, category, or real-time sliding price threshold.
* **Smart Dataset**: Pre-populated with premium items (Asus OLED ZenBooks, Dell Ryzen Laptops, Sony WH-1000XM5 ANC, Soundcore Hybrid, Eco-ethical heavyweight cotton hoodies, Keychron keyboards, and Breville burr grinders).

### 3. Price History Trackers & Alerts Watchdog
* **Interactive Line Charts**: Draw beautiful, real-time SVG vector price trend graphics tracking 5-week history.
* **Drop Alert Monitors**: Configure threshold price target watchdogs. Receive notifications right inside the assistant chat as soon as values fall near target benchmarks!

### 4. Interactive Side-by-Side Product Comparison
* **Comparative Matrix**: Review up to 3 selected products simultaneously.
* **Side-by-Side Metrics**: Easily analyze Price differences, Ratings, Reviews, detailed structural Features, and Descriptions.
* **Direct Actions**: Add candidates directly to your Cart or send a customized prompt to the AI agent to ask for pros and cons evaluation.

### 5. Web Speech Voice Search
* **Microphone Voice Detection**: Speak product queries naturally! Converts standard microphone input to textual filters instantly with Web Speech API integration.

### 6. AI Recommendations & Grounding Core
* **Google Search Grounding**: Toggle real-time search index queries to find genuine, live online deals and product reviews.
* **Tailored Personas**: Select specific assistant styles (e.g., Frugal Deal Finder, Tech Spec Analyst, Eco-Ethical Curator, Minimalist Curator) to evaluate products based on your specific values.

---

## 🛠️ Technical Stack
* **Frontend**: React (Vite, TypeScript), Tailwind CSS, Lucide Icons, Custom SVG graphs.
* **Backend**: Node.js, Express.js (integrated with Vite middleware mode).
* **AI Core**: Google GenAI SDK (`@google/genai`), Gemini 3.5 Flash.

---

## 🚀 Setup & Execution Instructions

### 1. Configure the API Secret Key
Ensure your environment variable is set inside AI Studio's **Settings > Secrets**:
```env
GEMINI_API_KEY=your_gemini_api_secret_key_here
```

### 2. Launch Development Mode
Run the following inside your terminal command:
```bash
npm run dev
```
The server will boot on port `3000` with the customized full-stack Express + Vite pipeline.

---

## 🎨 Creative Architecture
The application layout is built with standard CSS glassmorphism. It uses custom SVG elements to construct line charts without bulky external libraries, guaranteeing optimal compile speeds, reliable UI execution, and responsive performance on all desktop and mobile screen sizes.

-----
DEMO LINK:
https://remix-shopping-assistant-agent-998145370896.asia-southeast1.run.app

