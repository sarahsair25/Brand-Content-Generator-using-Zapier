import { useState } from "react";
import BrandForm from "./components/BrandForm";
import ContentOutput from "./components/ContentOutput";
import Header from "./components/Header";
import StatusBanner from "./components/StatusBanner";
import styles from "./App.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zapierStatus, setZapierStatus] = useState(null);

  async function handleGenerate({ brand, contentTypes, zapierWebhookUrl }) {
    setLoading(true);
    setError(null);
    setResult(null);
    setZapierStatus(null);

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, contentTypes, zapierWebhookUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setResult(data.generatedContent);
      setZapierStatus(data.zapierStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.main}>
        {/* Left panel: form */}
        <section className={styles.formPanel}>
          <BrandForm onGenerate={handleGenerate} loading={loading} />
        </section>

        {/* Right panel: output */}
        <section className={styles.outputPanel}>
          {error && (
            <StatusBanner type="error" message={`Error: ${error}`} />
          )}
          {zapierStatus && (
            <StatusBanner
              type={zapierStatus === "success" ? "success" : "warning"}
              message={
                zapierStatus === "success"
                  ? "✓ Content sent to Zapier successfully!"
                  : "⚠ Zapier webhook failed (content still generated)"
              }
            />
          )}
          {loading && <LoadingState />}
          {!loading && result && <ContentOutput content={result} />}
          {!loading && !result && !error && <EmptyState />}
        </section>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
        opacity: 0.5,
        textAlign: "center",
        padding: "60px 20px",
      }}
    >
      <div style={{ fontSize: 56 }}>✨</div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
        Your brand content will appear here
      </p>
      <p style={{ color: "var(--muted)", maxWidth: 300, fontSize: 14 }}>
        Fill in your brand details and select the content types you need, then click Generate.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 20,
        padding: "60px 20px",
      }}
    >
      <div className="spinner" style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid var(--border)",
        borderTopColor: "var(--accent)",
        animation: "spin 0.9s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>
        Crafting your brand content…
      </p>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>Claude AI is working its magic</p>
    </div>
  );
}
