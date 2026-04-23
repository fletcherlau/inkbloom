import { useEffect, useState } from "react";

import type { GlobalLlmSettings } from "@shared/contracts";

export function SettingsScreen(props: {
  settings: GlobalLlmSettings;
  isSaving: boolean;
  onSave: (settings: GlobalLlmSettings) => Promise<void>;
  onGoHome: () => void;
}) {
  const [draft, setDraft] = useState<GlobalLlmSettings>(props.settings);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(props.settings);
  }, [props.settings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSave(draft);
    setNotice("已保存全局 AI 设置。");
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Global LLM</p>
            <h1 style={styles.title}>全局 AI 设置</h1>
            <p style={styles.copy}>这些配置会作为全局默认值，供首页进入的写作工作区统一复用。</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={props.onGoHome}>
            返回首页
          </button>
        </header>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.field}>
            <span style={styles.label}>Provider</span>
            <input
              style={styles.input}
              value={draft.provider}
              onChange={(event) => {
                setDraft({ ...draft, provider: event.target.value });
                setNotice(null);
              }}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Base URL</span>
            <input
              style={styles.input}
              value={draft.baseUrl}
              onChange={(event) => {
                setDraft({ ...draft, baseUrl: event.target.value });
                setNotice(null);
              }}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>API Key</span>
            <input
              style={styles.input}
              type="password"
              value={draft.apiKey}
              onChange={(event) => {
                setDraft({ ...draft, apiKey: event.target.value });
                setNotice(null);
              }}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Model</span>
            <input
              style={styles.input}
              value={draft.model}
              onChange={(event) => {
                setDraft({ ...draft, model: event.target.value });
                setNotice(null);
              }}
            />
          </label>

          <div style={styles.footer}>
            <p aria-live="polite" style={styles.notice}>
              {notice ?? "保存后会停留在当前页面，你可以继续修改或返回首页。"}
            </p>
            <button type="submit" style={styles.primaryButton} disabled={props.isSaving}>
              {props.isSaving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, #f1e9dd 0%, #eadfce 100%)",
    padding: "1.5rem",
  },
  card: {
    width: "min(42rem, 100%)",
    display: "grid",
    gap: "1.5rem",
    padding: "1.5rem",
    borderRadius: "1.2rem",
    background: "rgba(255, 250, 244, 0.9)",
    boxShadow: "0 22px 55px rgba(85, 63, 43, 0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "start",
    flexWrap: "wrap" as const,
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.75rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#8b7359",
  },
  title: {
    margin: "0.35rem 0 0",
    color: "#2f2721",
  },
  copy: {
    margin: "0.75rem 0 0",
    color: "#66584a",
    lineHeight: 1.7,
  },
  form: {
    display: "grid",
    gap: "1rem",
  },
  field: {
    display: "grid",
    gap: "0.45rem",
  },
  label: {
    color: "#4d4034",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    borderRadius: "0.9rem",
    border: "1px solid #cfbca9",
    background: "#fffdf9",
    padding: "0.9rem 1rem",
    color: "#2f2721",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "center",
    flexWrap: "wrap" as const,
    marginTop: "0.5rem",
  },
  notice: {
    margin: 0,
    color: "#66584a",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.85rem 1.3rem",
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: "999px",
    border: "1px solid #bda88f",
    background: "rgba(255, 255, 255, 0.72)",
    color: "#2f2721",
    padding: "0.85rem 1.3rem",
    cursor: "pointer",
  },
};
