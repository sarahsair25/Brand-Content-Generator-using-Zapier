/**
 * Brand Content Generator - Backend Server
 * Express API that:
 *  1. Receives brand info from the frontend
 *  2. Calls Claude AI to generate content
 *  3. Sends the result to a Zapier webhook (to trigger email/Slack/Notion/etc.)
 *  4. Returns the generated content back to the frontend
 */

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Build a system prompt that instructs Claude to act as a brand copywriter.
 */
function buildSystemPrompt(brand) {
  return `You are an expert brand copywriter and marketing strategist.
You write compelling, on-brand content that perfectly captures a brand's voice, values, and target audience.
Always produce content that is original, engaging, and conversion-focused.
Respond ONLY with valid JSON (no markdown fences) matching the exact schema requested.`;
}

/**
 * Build the user prompt for each content type.
 * Returns a string that tells Claude exactly what to generate and in what JSON shape.
 */
function buildUserPrompt(brand, contentTypes) {
  const { name, industry, tone, targetAudience, usp, keywords, socialPlatforms } = brand;

  const contentInstructions = contentTypes.map((type) => {
    switch (type) {
      case "tagline":
        return `"tagline": "<A punchy 1-line brand tagline for ${name}>"`;
      case "about":
        return `"about": "<A 150-word 'About Us' section for ${name}>"`;
      case "instagram":
        return `"instagram": { "caption": "<engaging IG caption>", "hashtags": ["<hashtag1>", "<hashtag2>", ...5 total] }`;
      case "twitter":
        return `"twitter": "<tweet under 280 chars>"`;
      case "linkedin":
        return `"linkedin": "<professional LinkedIn post 100-200 words>"`;
      case "email":
        return `"email": { "subject": "<email subject line>", "body": "<email body 150-200 words>" }`;
      case "blog_intro":
        return `"blog_intro": "<blog post introduction paragraph 100-150 words>"`;
      case "ad_copy":
        return `"ad_copy": { "headline": "<ad headline max 60 chars>", "description": "<ad description max 90 chars>", "cta": "<call to action max 20 chars>" }`;
      default:
        return null;
    }
  }).filter(Boolean);

  return `Generate brand content for the following brand:

Brand Name: ${name}
Industry: ${industry}
Tone of Voice: ${tone}
Target Audience: ${targetAudience}
Unique Selling Proposition (USP): ${usp}
Keywords to include: ${keywords.join(", ")}
${socialPlatforms?.length ? `Social Platforms: ${socialPlatforms.join(", ")}` : ""}

Generate ONLY the following content types and respond in this exact JSON format:
{
  ${contentInstructions.join(",\n  ")}
}

Make sure all content:
- Reflects the brand tone: ${tone}
- Speaks to: ${targetAudience}
- Highlights the USP: ${usp}
- Naturally incorporates keywords where appropriate
- Feels authentic, not generic`;
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

/**
 * POST /api/generate
 * Body: { brand: BrandObject, contentTypes: string[], zapierWebhookUrl?: string }
 */
app.post("/api/generate", async (req, res) => {
  const { brand, contentTypes, zapierWebhookUrl } = req.body;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!brand || !brand.name || !brand.industry || !brand.tone) {
    return res.status(400).json({ error: "Missing required brand fields: name, industry, tone" });
  }
  if (!contentTypes || contentTypes.length === 0) {
    return res.status(400).json({ error: "Select at least one content type" });
  }

  try {
    // ── Call Claude AI ────────────────────────────────────────────────────────
    console.log(`[generate] Generating content for brand: ${brand.name}`);
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: buildSystemPrompt(brand),
      messages: [{ role: "user", content: buildUserPrompt(brand, contentTypes) }],
    });

    // Extract and parse the JSON response
    const rawText = message.content[0].text.trim();
    let generatedContent;
    try {
      // Strip any accidental markdown fences just in case
      const cleaned = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      generatedContent = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[generate] JSON parse error:", parseErr.message);
      return res.status(500).json({ error: "AI returned invalid JSON. Try again.", raw: rawText });
    }

    // ── Send to Zapier ────────────────────────────────────────────────────────
    let zapierStatus = null;
    const webhookUrl = zapierWebhookUrl || process.env.ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        console.log(`[zapier] Sending to webhook: ${webhookUrl}`);
        const zapierPayload = {
          brand_name: brand.name,
          industry: brand.industry,
          generated_at: new Date().toISOString(),
          content_types: contentTypes,
          ...generatedContent,
          // Flatten nested objects for Zapier's field mapping
          instagram_caption: generatedContent.instagram?.caption,
          instagram_hashtags: generatedContent.instagram?.hashtags?.join(" "),
          email_subject: generatedContent.email?.subject,
          email_body: generatedContent.email?.body,
          ad_headline: generatedContent.ad_copy?.headline,
          ad_description: generatedContent.ad_copy?.description,
          ad_cta: generatedContent.ad_copy?.cta,
        };

        await axios.post(webhookUrl, zapierPayload, {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });
        zapierStatus = "success";
        console.log("[zapier] Webhook delivered successfully");
      } catch (zapierErr) {
        zapierStatus = "failed";
        console.error("[zapier] Webhook failed:", zapierErr.message);
        // Don't fail the whole request if Zapier fails
      }
    }

    // ── Respond ───────────────────────────────────────────────────────────────
    return res.json({
      success: true,
      brand: brand.name,
      generatedContent,
      zapierStatus,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (err) {
    console.error("[generate] Error:", err.message);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/zapier/webhook
 * Receives incoming data FROM Zapier (e.g., when a new row appears in Google Sheets)
 * and auto-generates content for that brand.
 */
app.post("/api/zapier/webhook", async (req, res) => {
  console.log("[zapier-incoming] Received payload:", req.body);

  // Zapier sends flat fields — map them to our brand object
  const { brand_name, industry, tone, target_audience, usp, keywords, content_types } = req.body;

  if (!brand_name || !industry) {
    return res.status(400).json({ error: "Missing brand_name or industry from Zapier" });
  }

  const brand = {
    name: brand_name,
    industry,
    tone: tone || "professional",
    targetAudience: target_audience || "general audience",
    usp: usp || "",
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
  };

  const types = content_types
    ? content_types.split(",").map((t) => t.trim())
    : ["tagline", "instagram", "twitter"];

  // Reuse internal logic by making an internal API call
  try {
    const internalRes = await axios.post(`http://localhost:${PORT}/api/generate`, {
      brand,
      contentTypes: types,
    });
    return res.json(internalRes.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/health
 * Simple health check.
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Brand Content Generator API running on http://localhost:${PORT}`);
  console.log(`   Anthropic API Key: ${process.env.ANTHROPIC_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`   Zapier Webhook:    ${process.env.ZAPIER_WEBHOOK_URL ? "✓ set" : "not configured (optional)"}`);
});
