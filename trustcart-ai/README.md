# TrustCart AI 🛒🛡️

> **“Before You Buy, Know the Risk.”**  
> AI-powered online product risk analysis directly inside your browser.

TrustCart AI is a production-grade Chrome Extension (Manifest V3) that evaluates risk signals on online shopping pages before purchase. Rather than blindly prompting an LLM with subjective questions like *"Is this a scam?"*, TrustCart AI extracts verifiable structured signals—such as pricing markdown anomalies, review text duplication, storefront tenure, and return policies—and executes a transparent, explainable scoring engine augmented by Google Gemini.

---

## 🌟 Key Features

* **Multi-Layer Page Extractor**: Reads JSON-LD Schema.org product data, OpenGraph metadata, and resilient DOM selectors without bypassing website anti-bot protections.
* **Deterministic Risk Scoring Engine**: Calculates an explainable Trust Score (0–100) across 5 core dimensions:
  * **Price Risk (20%)**: Flags extreme markdowns (>85%), artificial MRP inflation, or negative prices without misclassifying standard sales.
  * **Review Risk (25%)**: Detects repetitive phrasing, sentiment skew, and rating volume anomalies via lexical overlap algorithms.
  * **Seller Risk (25%)**: Audits storefront identity, tenure, and marketplace verification status.
  * **Policy Risk (15%)**: Assesses return windows (e.g. 7–30 days vs "Final Sale / No returns") and warranty clarity.
  * **Description Risk (15%)**: Identifies absolute claims ("100% miracle cure", "guaranteed overnight") and missing technical specs.
* **Google Gemini AI Integration**: Server-side proxy using `@google/genai` and `gemini-3.8-flash` returning strict, validated JSON with actionable recommendations and explainability points.
* **Risk Categorization**:
  * `80–100`: **LOW RISK** (Emerald)
  * `60–79`: **MODERATE RISK** (Amber)
  * `40–59`: **HIGH RISK** (Orange)
  * `0–39`: **VERY HIGH RISK** (Red)
* **Explain My Score**: Transparent "Why this score?" breakdown detailing the exact signals driving the rating.
* **Side Panel & Dashboard**: Chrome Side Panel for continuous inspection and a full Analytics Dashboard with scan history, saved items, and side-by-side product comparisons.
* **Local Privacy First**: Uses `chrome.storage.local`. Never collects user passwords, personal messages, or payment info.

---

## ⚙️ Architecture

```
trustcart-ai/
│
├── manifest.json              # Chrome Manifest V3 configuration
│
├── popup/                    # Fast action popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── sidepanel/                # In-depth persistent side panel
│   ├── sidepanel.html
│   ├── sidepanel.css
│   └── sidepanel.js
│
├── content/                  # DOM & Schema extraction scripts
│   ├── extractor.js          # JSON-LD, Meta, and Microdata parser
│   └── content.js            # Tab message coordinator
│
├── background/               # Manifest V3 service worker
│   └── service-worker.js     # Badge state, lifecycle, and sidepanel triggers
│
├── utils/                    # Core mathematical & validation engine
│   ├── scoring.js            # Transparent weighted scoring formula
│   ├── validation.js         # XSS sanitization & schema validation
│   └── storage.js            # chrome.storage.local abstraction
│
├── ai/                       # Backend client & prompts
│   ├── analyzer.js           # API caller with deterministic fallback
│   └── prompts.js            # Strict JSON schema prompt generator
│
├── assets/icons/             # 16px, 48px, 128px extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── dashboard/                # Analytics, history & comparisons
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
│
└── README.md
```

---

## 🧠 Risk Scoring Engine Formula

The Trust Score is calculated deterministically from extracted attributes:

$$\text{Overall Risk} = (\text{PriceRisk} \times 0.20) + (\text{ReviewRisk} \times 0.25) + (\text{SellerRisk} \times 0.25) + (\text{PolicyRisk} \times 0.15) + (\text{DescriptionRisk} \times 0.15)$$

$$\text{Trust Score} = \max(0, \min(100, 100 - \text{Overall Risk}))$$

```javascript
// Located in utils/scoring.js
const totalWeightedRisk = 
  priceRisk.score * 0.20 +
  reviewRisk.score * 0.25 +
  sellerRisk.score * 0.25 +
  policyRisk.score * 0.15 +
  descriptionRisk.score * 0.15;

const trustScore = Math.round(100 - totalWeightedRisk);
```

---

## 🚀 Installation & Chrome Extension Setup

### 1. Start the AI Backend
```bash
# Install dependencies
npm install

# Run backend server
npm run dev
# The backend will start on http://localhost:3000
```

### 2. Load Extension in Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `trustcart-ai/` folder inside this project directory.
5. TrustCart AI will appear in your Chrome toolbar. Pin it for quick access!

---

## 🔑 Environment Variables

Create a `.env` file in the project root:
```env
# Google Gemini API Key for deep linguistic and pattern analysis
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Port (defaults to 3000)
PORT=3000
```
*Note: If `GEMINI_API_KEY` is omitted, TrustCart AI automatically uses its robust built-in deterministic heuristic scoring engine.*

---

## 🛍️ Testing the Extension

### Test on Real Websites
1. Visit any product page on Amazon, Flipkart, Myntra, or Shopify stores.
2. Click the **TrustCart AI** shield icon.
3. The extension detects the product name, price, and store automatically.
4. Click **Analyze Product** to view the score, risk categories, and AI explanations.

### Test with Demo Mode
If you are on a blank or unsupported page, the popup will provide a **"Load Demo Product"** button that lets you test a sample 74% discounted wireless headset with all risk signals populated.

---

## 🔒 Privacy & Compliance

* **Zero Personal Data Collection**: TrustCart AI does **not** read cookies, saved passwords, payment credentials, personal messages, or form inputs.
* **Public Data Only**: Extraction is strictly restricted to publicly accessible product details visible in the DOM (title, price, published reviews, seller bio).
* **Safe Extraction**: Does not attempt to bypass CAPTCHA, bypass paywalls, or scrape private user data.

---

## ⚠️ Disclaimer

> **This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.**  
> TrustCart AI provides automated decision support based on publicly available signals. Consumers should always exercise sound judgment when shopping online.

---

## 📄 License
Apache-2.0 License.
