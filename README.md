# 🚀 Brand Content Generator using Zapier + Claude AI

Generate on-brand marketing copy across all channels instantly — then send it anywhere via Zapier.

## ✨ Features

- **AI-Powered Content**: Uses Claude AI to generate contextually relevant brand content
- **8 Content Types**: Tagline, About Us, Instagram, Twitter/X, LinkedIn, Email, Blog Intro, Ad Copy
- **Zapier Integration**: Automatically send generated content to Gmail, Slack, Notion, Google Sheets, Airtable, and 6,000+ apps
- **Incoming Webhooks**: Trigger generation from Zapier (e.g., new Google Sheets row → generate content)
- **Export**: Download all content as a .txt file
- **Copy to Clipboard**: One-click copy for each piece

---

## 🏗️ Architecture

```
┌─────────────────┐       POST /api/generate        ┌─────────────────────┐
│   React Frontend│ ──────────────────────────────► │  Express Backend     │
│   (Vite, port   │                                  │  (Node.js, port 5000)│
│    3000)        │ ◄─────────────────────────────── │                      │
└─────────────────┘     { generatedContent }         └──────────┬──────────┘
                                                                │
                                                     ┌──────────▼──────────┐
                                                     │   Anthropic Claude   │
                                                     │   claude-opus-4-5    │
                                                     └──────────┬──────────┘
                                                                │
                                                     ┌──────────▼──────────┐
                                                     │  Zapier Catch Hook   │
                                                     │  (your webhook URL)  │
                                                     └──────────┬──────────┘
                                                                │
                                              ┌─────────────────┴──────────────────┐
                                              │  Any Zapier Action (6,000+ apps)   │
                                              │  Gmail · Slack · Notion · Sheets   │
                                              └────────────────────────────────────┘
```

---

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
- A Zapier account (free tier works)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd brand-content-generator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Start the servers

```bash
# Terminal 1 – Backend
cd backend
npm run dev   # or: npm start

# Terminal 2 – Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

---

## ⚡ Zapier Integration Guide

### Option A: Send content OUT to Zapier (most common)

1. Go to [zapier.com](https://zapier.com) and create a new Zap
2. **Trigger**: "Webhooks by Zapier" → "Catch Hook"
3. Copy the webhook URL
4. **Action**: Choose any app (Gmail, Slack, Notion, Google Sheets, etc.)
5. Map the fields below to your action:

| Field name            | Content                                    |
|-----------------------|--------------------------------------------|
| `brand_name`          | The brand name                             |
| `tagline`             | Generated tagline                          |
| `about`               | About Us section                           |
| `instagram_caption`   | Instagram caption                          |
| `instagram_hashtags`  | Hashtags as space-separated string         |
| `twitter`             | Tweet text                                 |
| `linkedin`            | LinkedIn post                              |
| `email_subject`       | Email subject line                         |
| `email_body`          | Email body                                 |
| `blog_intro`          | Blog introduction                          |
| `ad_headline`         | Ad headline                                |
| `ad_description`      | Ad description                             |
| `ad_cta`              | Ad call to action                          |
| `generated_at`        | ISO timestamp                              |

6. Paste the Zapier webhook URL in the frontend (⚡ Zapier Integration section) or in `.env`

### Option B: Trigger generation FROM Zapier

Use this to auto-generate content when something happens in another app
(e.g., new row in Google Sheets → generate content):

**Zapier Action config:**
- Method: `POST`
- URL: `http://your-server.com/api/zapier/webhook`
- Body (JSON):
```json
{
  "brand_name": "My Brand",
  "industry": "Technology",
  "tone": "Friendly",
  "target_audience": "Young professionals",
  "usp": "The only app that...",
  "keywords": "innovation, speed, simplicity",
  "content_types": "tagline,instagram,twitter,email"
}
```

---

## 📡 API Reference

### `POST /api/generate`

Generate brand content and optionally send to Zapier.

**Request body:**
```json
{
  "brand": {
    "name": "Luminary Co.",
    "industry": "Fashion & Apparel",
    "tone": "Luxurious",
    "targetAudience": "Women aged 25-40 seeking premium sustainable fashion",
    "usp": "Every piece is ethically made and carbon-neutral",
    "keywords": ["sustainable", "luxury", "ethical", "timeless"],
    "socialPlatforms": ["Instagram", "LinkedIn"]
  },
  "contentTypes": ["tagline", "instagram", "twitter", "email", "ad_copy"],
  "zapierWebhookUrl": "https://hooks.zapier.com/hooks/catch/..."
}
```

**Response:**
```json
{
  "success": true,
  "brand": "Luminary Co.",
  "generatedContent": {
    "tagline": "Wear the Change.",
    "instagram": {
      "caption": "Style shouldn't cost the earth...",
      "hashtags": ["#SustainableFashion", "#EthicalStyle", ...]
    },
    "twitter": "Fashion forward, planet first...",
    "email": {
      "subject": "Your wardrobe, reimagined.",
      "body": "..."
    },
    "ad_copy": {
      "headline": "Luxury That Gives Back",
      "description": "Ethically crafted pieces for the conscious woman.",
      "cta": "Shop Now"
    }
  },
  "zapierStatus": "success",
  "tokensUsed": 847
}
```

### `POST /api/zapier/webhook`
Incoming webhook for Zapier-triggered generation. (See Option B above.)

### `GET /api/health`
Health check endpoint.

---

## 🗂️ Project Structure

```
brand-content-generator/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   └── .env.example       # Environment variables template
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx          # Root component + API calls
│       ├── App.module.css
│       ├── index.css        # Global styles & CSS variables
│       └── components/
│           ├── Header.jsx
│           ├── BrandForm.jsx     # Brand input form
│           ├── ContentOutput.jsx # Generated content cards
│           └── StatusBanner.jsx  # Success/error banners
│
└── README.md
```

---

## 🔧 Environment Variables

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| `ANTHROPIC_API_KEY`   | ✅ Yes   | Your Anthropic API key                   |
| `ZAPIER_WEBHOOK_URL`  | No       | Default Zapier hook (overridable per-req)|
| `PORT`                | No       | Backend port (default: 5000)             |

---

## 📝 License

MIT
