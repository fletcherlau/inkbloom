import { useEffect, useState } from "react";

import type { GlobalLlmSettings, LlmConnectionTestResult } from "@shared/contracts";

const backendOptions = [
  {
    value: "openai-compatible",
    label: "OpenAI-Compatible HTTP",
    description: "适合 Moonshot / OpenAI 兼容网关 / 其他 REST 模型接口。",
  },
  {
    value: "anthropic-compatible",
    label: "Anthropic-Compatible HTTP",
    description: "适合 Kimi Code 的 Anthropic Messages 协议接入。",
  },
  {
    value: "kimi-cli",
    label: "Kimi CLI ACP",
    description: "通过本机 `kimi acp` 连接 Kimi Code CLI。",
  },
] as const;

const DEFAULT_KIMI_MODEL = "kimi-for-coding";
const DEFAULT_KIMI_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_ANTHROPIC_BASE_URL = "https://api.kimi.com/coding/";

export function SettingsScreen(props: {
  settings: GlobalLlmSettings;
  isSaving: boolean;
  onSave: (settings: GlobalLlmSettings) => Promise<void>;
  onTestConnection: (settings: GlobalLlmSettings) => Promise<LlmConnectionTestResult>;
  onGoHome: () => void;
}) {
  const [draft, setDraft] = useState<GlobalLlmSettings>(props.settings);
  const [notice, setNotice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<LlmConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const isKimiCliMode = draft.provider.trim() === "kimi-cli";
  const isAnthropicMode = draft.provider.trim() === "anthropic-compatible";
  const backendLabel =
    backendOptions.find((option) => option.value === draft.provider)?.label ?? "未选择后端";

  useEffect(() => {
    setDraft(props.settings);
  }, [props.settings]);

  function normalizeDraftSettings() {
    if (!isKimiCliMode) {
      if (!isAnthropicMode) {
        return draft;
      }

      return {
        ...draft,
        model: draft.model.trim() || DEFAULT_KIMI_MODEL,
        baseUrl: draft.baseUrl.trim() || DEFAULT_ANTHROPIC_BASE_URL,
      };
    }

    return {
      ...draft,
      model: draft.model.trim() || DEFAULT_KIMI_MODEL,
      baseUrl: draft.baseUrl.trim() || DEFAULT_KIMI_BASE_URL,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTestResult(null);
    const normalizedDraft = normalizeDraftSettings();

    try {
      await props.onSave(normalizedDraft);
      setDraft(normalizedDraft);
      setNotice("已保存 AI 后端设置。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setNotice(`保存失败：${message}`);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setNotice(null);
    setTestResult(null);
    const normalizedDraft = normalizeDraftSettings();

    try {
      const result = await props.onTestConnection(normalizedDraft);
      setDraft(normalizedDraft);
      setTestResult(result);
      if (!result.ok) {
        setNotice("测试连接失败，请检查当前后端配置。");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setTestResult({
        ok: false,
        status: null,
        endpoint: isKimiCliMode
          ? "kimi acp"
          : isAnthropicMode
            ? `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/v1/messages`
            : `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/chat/completions`,
        protocol: isKimiCliMode
          ? "kimi-cli-acp"
          : isAnthropicMode
            ? "anthropic-messages"
            : "openai-chat-completions",
        message: `测试连接失败：${message}`,
      });
      setNotice("测试连接失败，请检查当前后端配置。");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>AI Backend</p>
            <h1 style={styles.title}>AI 后端设置</h1>
            <p style={styles.copy}>先选择要调用的 AI 后端，再填写对应配置。当前选中：{backendLabel}。</p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={props.onGoHome}>
            返回首页
          </button>
        </header>

        <form style={styles.form} onSubmit={handleSubmit}>
          <p style={styles.protocolHint}>
            {isKimiCliMode
              ? "当前模式会调用本机 Kimi CLI ACP server；测试连接会走 `kimi acp` 会话，而不是直接请求 HTTP 接口。"
              : isAnthropicMode
                ? "当前测试按 Anthropic Messages `POST /v1/messages` 规范发起请求。"
                : "当前测试按 OpenAI-compatible `POST /chat/completions` 规范发起请求。"}
          </p>
          <label style={styles.field}>
            <span style={styles.label}>AI 后端</span>
            <select
              style={styles.select}
              value={draft.provider}
              onChange={(event) => {
                setDraft({ ...draft, provider: event.target.value });
                setNotice(null);
                setTestResult(null);
              }}
            >
              <option value="">请选择后端</option>
              {backendOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p style={styles.backendDescription}>
            {backendOptions.find((option) => option.value === draft.provider)?.description ??
              "选择后端后，这里会显示对应配置项。"}
          </p>

          {isKimiCliMode ? (
            <>
              <label style={styles.field}>
                <span style={styles.label}>API Key</span>
                <input
                  style={styles.input}
                  type="password"
                  value={draft.apiKey}
                  onChange={(event) => {
                    setDraft({ ...draft, apiKey: event.target.value });
                    setNotice(null);
                    setTestResult(null);
                  }}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Model</span>
                <input
                  style={styles.input}
                  placeholder="默认 kimi-for-coding"
                  value={draft.model}
                  onChange={(event) => {
                    setDraft({ ...draft, model: event.target.value });
                    setNotice(null);
                    setTestResult(null);
                  }}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Base URL</span>
                <input
                  style={styles.input}
                  placeholder="可留空，默认使用 https://api.kimi.com/coding/v1"
                  value={draft.baseUrl}
                  onChange={(event) => {
                    setDraft({ ...draft, baseUrl: event.target.value });
                    setNotice(null);
                    setTestResult(null);
                  }}
                />
              </label>
            </>
          ) : isAnthropicMode ? (
            <>
              <label style={styles.field}>
                <span style={styles.label}>Base URL</span>
                <input
                  style={styles.input}
                  placeholder="可留空，默认使用 https://api.kimi.com/coding/"
                  value={draft.baseUrl}
                  onChange={(event) => {
                    setDraft({ ...draft, baseUrl: event.target.value });
                    setNotice(null);
                    setTestResult(null);
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
                    setTestResult(null);
                  }}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Model</span>
                <input
                  style={styles.input}
                  placeholder="默认 kimi-for-coding"
                  value={draft.model}
                  onChange={(event) => {
                    setDraft({ ...draft, model: event.target.value });
                    setNotice(null);
                    setTestResult(null);
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <label style={styles.field}>
                <span style={styles.label}>Base URL</span>
                <input
                  style={styles.input}
                  placeholder="例如 https://api.moonshot.cn/v1"
                  value={draft.baseUrl}
                  onChange={(event) => {
                    setDraft({ ...draft, baseUrl: event.target.value });
                    setNotice(null);
                    setTestResult(null);
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
                    setTestResult(null);
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
                    setTestResult(null);
                  }}
                />
              </label>
            </>
          )}

          {testResult ? (
            <section
              aria-live="polite"
              style={{
                ...styles.testResult,
                ...(testResult.ok ? styles.testResultSuccess : styles.testResultFailure),
              }}
            >
              <p style={styles.testResultTitle}>{testResult.ok ? "连接成功" : "连接失败"}</p>
              <p style={styles.testResultCopy}>{testResult.message}</p>
              <p style={styles.testResultMeta}>
                Endpoint: {testResult.endpoint}
                {testResult.status === null ? "" : ` | HTTP ${testResult.status}`}
              </p>
            </section>
          ) : null}

          <div style={styles.footer}>
            <p aria-live="polite" style={styles.notice}>
              {notice ?? "保存后会停留在当前页面，你可以继续修改或返回首页。"}
            </p>
            <div style={styles.actions}>
              <button type="button" style={styles.secondaryActionButton} onClick={() => void handleTestConnection()} disabled={isTesting}>
                {isTesting ? "测试中..." : "测试连接"}
              </button>
              <button type="submit" style={styles.primaryButton} disabled={props.isSaving}>
                {props.isSaving ? "保存中..." : "保存设置"}
              </button>
            </div>
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
  protocolHint: {
    margin: 0,
    color: "#7a6250",
    fontSize: "0.92rem",
  },
  field: {
    display: "grid",
    gap: "0.45rem",
  },
  backendDescription: {
    margin: "-0.25rem 0 0",
    color: "#6f6255",
    fontSize: "0.92rem",
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
  select: {
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
  actions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
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
  secondaryActionButton: {
    borderRadius: "999px",
    border: "1px solid #bda88f",
    background: "#fffdf9",
    color: "#2f2721",
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
  testResult: {
    display: "grid",
    gap: "0.4rem",
    padding: "0.95rem 1rem",
    borderRadius: "1rem",
  },
  testResultSuccess: {
    background: "rgba(84, 136, 103, 0.12)",
    color: "#244a33",
  },
  testResultFailure: {
    background: "rgba(180, 82, 66, 0.12)",
    color: "#6f2b21",
  },
  testResultTitle: {
    margin: 0,
    fontWeight: 700,
  },
  testResultCopy: {
    margin: 0,
    lineHeight: 1.6,
  },
  testResultMeta: {
    margin: 0,
    fontSize: "0.9rem",
  },
};
