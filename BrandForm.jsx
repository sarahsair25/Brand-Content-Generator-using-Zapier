import { useState } from "react";
import styles from "./BrandForm.module.css";

const TONE_OPTIONS = [
  "Professional", "Friendly", "Playful", "Inspirational",
  "Luxurious", "Minimalist", "Bold", "Witty", "Empathetic",
];

const CONTENT_TYPES = [
  { id: "tagline",    label: "Tagline",         icon: "🏷️" },
  { id: "about",      label: "About Us",         icon: "🏢" },
  { id: "instagram",  label: "Instagram",        icon: "📸" },
  { id: "twitter",    label: "Twitter/X",        icon: "🐦" },
  { id: "linkedin",   label: "LinkedIn",         icon: "💼" },
  { id: "email",      label: "Email Campaign",   icon: "📧" },
  { id: "blog_intro", label: "Blog Intro",       icon: "✍️" },
  { id: "ad_copy",    label: "Ad Copy",          icon: "📣" },
];

const INDUSTRIES = [
  "Technology", "Fashion & Apparel", "Food & Beverage", "Health & Wellness",
  "Finance", "Education", "Travel & Hospitality", "Real Estate", "E-commerce",
  "Non-profit", "Entertainment", "Beauty & Cosmetics", "Sports & Fitness",
  "B2B Services", "Other",
];

export default function BrandForm({ onGenerate, loading }) {
  const [brand, setBrand] = useState({
    name: "",
    industry: "",
    tone: "Professional",
    targetAudience: "",
    usp: "",
    keywords: "",
    socialPlatforms: [],
  });
  const [selectedTypes, setSelectedTypes] = useState(["tagline", "instagram", "twitter"]);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [showZapier, setShowZapier] = useState(false);

  function updateBrand(field, value) {
    setBrand((prev) => ({ ...prev, [field]: value }));
  }

  function toggleContentType(id) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const keywordsArray = brand.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    onGenerate({
      brand: { ...brand, keywords: keywordsArray },
      contentTypes: selectedTypes,
      zapierWebhookUrl: zapierWebhookUrl || undefined,
    });
  }

  const isValid =
    brand.name.trim() &&
    brand.industry &&
    brand.targetAudience.trim() &&
    selectedTypes.length > 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.sectionTitle}>Brand Details</h2>

      {/* Brand Name */}
      <div className={styles.field}>
        <label>Brand Name *</label>
        <input
          type="text"
          placeholder="e.g. Luminary Co."
          value={brand.name}
          onChange={(e) => updateBrand("name", e.target.value)}
          required
        />
      </div>

      {/* Industry */}
      <div className={styles.field}>
        <label>Industry *</label>
        <select
          value={brand.industry}
          onChange={(e) => updateBrand("industry", e.target.value)}
          required
        >
          <option value="">Select industry…</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Tone */}
      <div className={styles.field}>
        <label>Tone of Voice *</label>
        <div className={styles.toneGrid}>
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              className={`${styles.toneChip} ${brand.tone === tone ? styles.toneActive : ""}`}
              onClick={() => updateBrand("tone", tone)}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div className={styles.field}>
        <label>Target Audience *</label>
        <input
          type="text"
          placeholder="e.g. Millennial women aged 25-35 interested in sustainable fashion"
          value={brand.targetAudience}
          onChange={(e) => updateBrand("targetAudience", e.target.value)}
          required
        />
      </div>

      {/* USP */}
      <div className={styles.field}>
        <label>Unique Selling Proposition (USP)</label>
        <textarea
          placeholder="What makes your brand different? e.g. 100% organic materials, same-day delivery, 24/7 expert support…"
          value={brand.usp}
          onChange={(e) => updateBrand("usp", e.target.value)}
          rows={3}
        />
      </div>

      {/* Keywords */}
      <div className={styles.field}>
        <label>Keywords <span className={styles.hint}>(comma-separated)</span></label>
        <input
          type="text"
          placeholder="e.g. sustainable, innovative, community, growth"
          value={brand.keywords}
          onChange={(e) => updateBrand("keywords", e.target.value)}
        />
      </div>

      {/* Content Types */}
      <div className={styles.divider} />
      <h2 className={styles.sectionTitle}>Content to Generate</h2>
      <div className={styles.contentGrid}>
        {CONTENT_TYPES.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`${styles.contentChip} ${selectedTypes.includes(id) ? styles.contentActive : ""}`}
            onClick={() => toggleContentType(id)}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      {selectedTypes.length === 0 && (
        <p className={styles.errorHint}>Select at least one content type</p>
      )}

      {/* Zapier Integration (collapsible) */}
      <div className={styles.divider} />
      <button
        type="button"
        className={styles.zapierToggle}
        onClick={() => setShowZapier((v) => !v)}
      >
        <span>⚡ Zapier Integration</span>
        <span style={{ marginLeft: "auto", opacity: 0.6, fontSize: 12 }}>
          {showZapier ? "▲ hide" : "▼ configure"}
        </span>
      </button>

      {showZapier && (
        <div className={styles.zapierPanel}>
          <p className={styles.zapierInfo}>
            Paste your Zapier <strong>Catch Hook</strong> URL to automatically send
            generated content to email, Slack, Notion, Google Sheets, and more.
          </p>
          <div className={styles.field}>
            <label>Zapier Webhook URL</label>
            <input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={zapierWebhookUrl}
              onChange={(e) => setZapierWebhookUrl(e.target.value)}
            />
          </div>
          <div className={styles.zapierSteps}>
            <p><strong>Setup steps:</strong></p>
            <ol>
              <li>Create a new Zap in Zapier</li>
              <li>Choose <em>Webhooks by Zapier</em> → <em>Catch Hook</em> as trigger</li>
              <li>Copy the webhook URL and paste it above</li>
              <li>Add any action (Gmail, Slack, Notion, Sheets, etc.)</li>
              <li>Map the fields: <code>tagline</code>, <code>instagram_caption</code>, <code>email_subject</code>, etc.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className={styles.divider} />
      <button
        type="submit"
        className={styles.generateBtn}
        disabled={!isValid || loading}
      >
        {loading ? "Generating…" : "✨ Generate Content"}
      </button>
    </form>
  );
}
