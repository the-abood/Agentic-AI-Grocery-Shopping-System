# 🛒 GroceryMind — Autonomous AI Grocery Shopping Agent

GroceryMind is a fully autonomous AI-powered grocery shopping agent built with React. You tell it what you want to cook in plain English, and the agent handles everything — identifying ingredients, searching Tesco for real products, selecting the best packs, and completing checkout — all without any further input from you.

-----

## 🤖 What makes it agentic?

Most AI apps just answer questions. GroceryMind is an **AI agent** — it perceives your request, makes decisions, takes actions, and adapts when things go wrong.

|Capability    |How                                                                                      |
|--------------|-----------------------------------------------------------------------------------------|
|**Perception**|Understands natural language — recipe, people count, allergies, budget — from one message|
|**Planning**  |Builds a multi-step plan automatically before acting                                     |
|**Action**    |Calls Tesco API, selects products, builds cart, processes payment                        |
|**Adaptation**|Auto-retries failed searches, substitutes unavailable ingredients                        |
|**Autonomy**  |User types once — agent handles everything else                                          |

-----

## ✨ Features

- 🧠 **Natural language input** — say “biryani for 4, I’m allergic to nuts” and the agent infers everything
- 🔍 **Real Tesco products** — live product search with real prices and images
- ⚖️ **Intelligent pack selection** — picks the best pack by quantity needed, budget, Clubcard deals, and rating
- 🔄 **Auto substitution** — if a product isn’t found, the agent finds an alternative automatically
- 💰 **Budget mode** — tell the agent your budget and it picks economical options
- 🔵 **Clubcard deals** — prioritises products with Tesco Clubcard discounts
- ⭐ **Star ratings** — shows real Tesco product ratings
- 🛒 **Review step** — see what the agent picked before confirming
- 💳 **Autonomous payment** — agent completes checkout automatically
- 📦 **Delivery confirmation** — full order summary with estimated delivery time
- 📊 **Live agent log** — real-time feed showing every decision the agent makes

-----

## 🛠️ Tech stack

|Layer       |Technology                  |
|------------|----------------------------|
|Frontend    |React                       |
|AI / LLM    |Groq (Llama 3.3 70B)        |
|Grocery data|Tesco API via RapidAPI      |
|Styling     |Custom CSS with Google Fonts|

-----

## 🚀 Getting started

### Prerequisites

- Node.js v18 or higher
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A RapidAPI key with Tesco API access (free at [rapidapi.com](https://rapidapi.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/grocerymind.git
cd grocerymind

# Install dependencies
npm install
```

### Environment setup

Create a `.env` file in the root of the project:

```
REACT_APP_GEMINI_KEY=your_groq_api_key_here
REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
```

On macOS, also add them to your `~/.zshrc`:

```bash
export REACT_APP_GEMINI_KEY=your_groq_api_key_here
export REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
```

Then run:

```bash
source ~/.zshrc
npm start
```

The app will open at `http://localhost:3000`.

-----

## 📁 Project structure

```
grocerymind/
├── src/
│   ├── components/
│   │   ├── ChatBox.jsx        ← AI agent chat interface
│   │   ├── Cart.jsx           ← Review cart with skeleton loading
│   │   └── PaymentForm.jsx    ← Payment screen
│   ├── services/
│   │   ├── gemini.js          ← Groq AI API calls (getIngredients, getSubstitute, getBestPack)
│   │   └── tesco.js           ← Tesco product search with caching and fallbacks
│   ├── App.jsx                ← Main app with screen routing and live agent log
│   └── App.css                ← All styles
├── .env                       ← API keys (never commit this)
└── README.md
```

-----

## 🔄 How the agent works

```
User types ONE message
        ↓
Agent infers recipe, people, allergies, budget
        ↓
Groq LLM generates ingredient list (max 7 items)
        ↓
Tesco API searched in parallel for all ingredients
        ↓
If not found → auto retry with fallback query
If still not found → Groq suggests substitute → retry
        ↓
Groq selects best pack per ingredient
(by quantity needed → Clubcard → price → rating)
        ↓
Review cart shown to user
        ↓
User confirms → Agent completes payment autonomously
        ↓
Order confirmed with delivery details
```

-----

## 🧠 Agent decision making

### Pack selection priority

|Priority|No budget stated               |Budget stated                  |
|--------|-------------------------------|-------------------------------|
|1st     |Nearest quantity to recipe need|Nearest quantity to recipe need|
|2nd     |Clubcard discount available    |Cheapest option                |
|3rd     |Mid-range price                |Clubcard as bonus              |
|4th     |Rating as tiebreaker           |Rating as tiebreaker           |

### Fallback strategy

```
Search "masala" → no results
        ↓
Retry with fallback: "spice"
        ↓
Still no results → ask Groq for substitute
        ↓
Groq suggests "curry powder" → search again
        ↓
Found → add to cart with substitution badge
```

-----

## 📸 App flow

|Screen     |Description                                  |
|-----------|---------------------------------------------|
|💬 Chat     |User types request — agent shows live plan   |
|🔴 Live log |Real-time feed of every agent action         |
|👀 Review   |User sees selected products, can remove items|
|💳 Payment  |Agent pays autonomously with animated steps  |
|✅ Confirmed|Order summary with delivery details          |

-----

## ⚙️ Configuration

### Change the user profile

In `ChatBox.jsx` update the `USER_PROFILE` object:

```js
const USER_PROFILE = {
  name: 'Your Name',
  address: 'Your Address',
  card: '**** **** **** 4242',
};
```

### Change the AI model

In `gemini.js` update the model in `callGroq`:

```js
model: 'llama-3.3-70b-versatile'  // or any other Groq model
```

### Add more Tesco search fallbacks

In `tesco.js` add to the `FALLBACKS` object:

```js
const FALLBACKS = {
  'yourIngredient': 'fallbackWord',
  // ...
};
```

-----

## 🔑 API keys

|Key             |Where to get it                             |Free tier                         |
|----------------|--------------------------------------------|----------------------------------|
|Groq            |[console.groq.com](https://console.groq.com)|Generous free tier, no daily limit|
|RapidAPI / Tesco|[rapidapi.com](https://rapidapi.com)        |Free tier available               |


> ⚠️ Never commit your `.env` file to GitHub. It is already in `.gitignore` by default in Create React App.

-----

## 👨‍💻 Built by

Abdullah Bin Omar — University of Salford

Built as a demonstration of agentic AI applied to real-world grocery shopping.

-----

## 📄 Licence

MIT — free to use and modify.
