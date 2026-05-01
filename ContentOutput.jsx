import { useState } from "react";
import styles from "./ContentOutput.module.css";

/**
 * Renders a single content card with a copy button.
 */
function ContentCard({ title, icon, children, copyText }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        <h3 className={styles.cardTitle}>{title}</h3>
        <button
          className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
          onClick={handleCopy}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

/**
 * Renders all content returned by the API.
 */
export default function ContentOutput({ content }) {
  if (!content) return null;

  const {
    tagline, about, instagram, twitter, linkedin,
    email, blog_intro, ad_copy,
  } = content;

  // Export all content as a single text file
  function exportAll() {
    const lines = [];
    if (tagline) lines.push(`TAGLINE\n${tagline}`);
    if (about) lines.push(`ABOUT US\n${about}`);
    if (instagram) lines.push(`INSTAGRAM CAPTION\n${instagram.caption}\n\nHASHTAGS\n${instagram.hashtags?.join(" ")}`);
    if (twitter) lines.push(`TWITTER/X\n${twitter}`);
    if (linkedin) lines.push(`LINKEDIN\n${linkedin}`);
    if (email) lines.push(`EMAIL\nSubject: ${email.subject}\n\n${email.body}`);
    if (blog_intro) lines.push(`BLOG INTRO\n${blog_intro}`);
    if (ad_copy) lines.push(`AD COPY\nHeadline: ${ad_copy.headline}\nDescription: ${ad_copy.description}\nCTA: ${ad_copy.cta}`);

    const blob = new Blob([lines.join("\n\n" + "─".repeat(40) + "\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brand-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Generated Content</h2>
        <button className={styles.exportBtn} onClick={exportAll}>
          ⬇ Export All
        </button>
      </div>

      <div className={styles.grid}>
        {tagline && (
          <ContentCard title="Tagline" icon="🏷️" copyText={tagline}>
            <p className={styles.taglineText}>"{tagline}"</p>
          </ContentCard>
        )}

        {about && (
          <ContentCard title="About Us" icon="🏢" copyText={about}>
            <p className={styles.bodyText}>{about}</p>
          </ContentCard>
        )}

        {twitter && (
          <ContentCard title="Twitter / X Post" icon="🐦" copyText={twitter}>
            <p className={styles.bodyText}>{twitter}</p>
            <CharCount text={twitter} limit={280} />
          </ContentCard>
        )}

        {instagram && (
          <ContentCard
            title="Instagram"
            icon="📸"
            copyText={`${instagram.caption}\n\n${instagram.hashtags?.join(" ")}`}
          >
            <p className={styles.bodyText}>{instagram.caption}</p>
            {instagram.hashtags && (
              <div className={styles.hashtags}>
                {instagram.hashtags.map((tag) => (
                  <span key={tag} className={styles.hashtag}>{tag}</span>
                ))}
              </div>
            )}
          </ContentCard>
        )}

        {linkedin && (
          <ContentCard title="LinkedIn Post" icon="💼" copyText={linkedin}>
            <p className={styles.bodyText}>{linkedin}</p>
          </ContentCard>
        )}

        {email && (
          <ContentCard
            title="Email Campaign"
            icon="📧"
            copyText={`Subject: ${email.subject}\n\n${email.body}`}
          >
            <div className={styles.emailSubject}>
              <span className={styles.label}>Subject</span>
              <span>{email.subject}</span>
            </div>
            <p className={styles.bodyText}>{email.body}</p>
          </ContentCard>
        )}

        {blog_intro && (
          <ContentCard title="Blog Introduction" icon="✍️" copyText={blog_intro}>
            <p className={styles.bodyText}>{blog_intro}</p>
          </ContentCard>
        )}

        {ad_copy && (
          <ContentCard
            title="Ad Copy"
            icon="📣"
            copyText={`Headline: ${ad_copy.headline}\nDescription: ${ad_copy.description}\nCTA: ${ad_copy.cta}`}
          >
            <div className={styles.adGrid}>
              <AdField label="Headline" value={ad_copy.headline} limit={60} />
              <AdField label="Description" value={ad_copy.description} limit={90} />
              <AdField label="Call to Action" value={ad_copy.cta} limit={20} accent />
            </div>
          </ContentCard>
        )}
      </div>
    </div>
  );
}

function CharCount({ text, limit }) {
  const count = text?.length || 0;
  const over = count > limit;
  return (
    <div className={styles.charCount} style={{ color: over ? "var(--error)" : "var(--muted)" }}>
      {count}/{limit} characters{over ? " — over limit!" : ""}
    </div>
  );
}

function AdField({ label, value, limit, accent }) {
  return (
    <div className={styles.adField}>
      <span className={styles.label}>{label}</span>
      <span className={accent ? styles.adCta : styles.adValue}>{value}</span>
      <span className={styles.charCount}>{value?.length}/{limit} chars</span>
    </div>
  );
}
