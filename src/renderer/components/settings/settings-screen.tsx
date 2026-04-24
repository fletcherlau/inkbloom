import { useEffect, useState } from "react";

import type { GlobalLlmSettings, LlmConnectionTestResult } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const backendOptions = [
  { value: "openai-compatible", label: "OpenAI-Compatible HTTP", description: "适合 Moonshot / OpenAI 兼容网关 / 其他 REST 模型接口。" },
  { value: "anthropic-compatible", label: "Anthropic-Compatible HTTP", description: "适合 Kimi Code 的 Anthropic Messages 协议接入。" },
  { value: "kimi-cli", label: "Kimi CLI ACP", description: "通过本机 `kimi acp` 连接 Kimi Code CLI。" },
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

  useEffect(() => {
    setDraft(props.settings);
  }, [props.settings]);

  function normalizeDraftSettings() {
    if (isKimiCliMode) {
      return { ...draft, model: draft.model.trim() || DEFAULT_KIMI_MODEL, baseUrl: draft.baseUrl.trim() || DEFAULT_KIMI_BASE_URL };
    }
    if (isAnthropicMode) {
      return { ...draft, model: draft.model.trim() || DEFAULT_KIMI_MODEL, baseUrl: draft.baseUrl.trim() || DEFAULT_ANTHROPIC_BASE_URL };
    }
    return draft;
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
      if (!result.ok) setNotice("测试连接失败，请检查当前后端配置。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setTestResult({
        ok: false, status: null,
        endpoint: isKimiCliMode ? "kimi acp" : isAnthropicMode ? `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/v1/messages` : `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/chat/completions`,
        protocol: isKimiCliMode ? "kimi-cli-acp" : isAnthropicMode ? "anthropic-messages" : "openai-chat-completions",
        message: `测试连接失败：${message}`,
      });
      setNotice("测试连接失败，请检查当前后端配置。");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground tracking-[0.12em] uppercase font-medium">AI Backend</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">AI 后端设置</h1>
            <p className="mt-1 text-muted-foreground">选择要调用的 AI 后端，再填写对应配置。</p>
          </div>
          <Button variant="outline" onClick={props.onGoHome}>返回首页</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isKimiCliMode ? "当前模式会调用本机 Kimi CLI ACP server；测试连接会走 `kimi acp` 会话，而不是直接请求 HTTP 接口。"
              : isAnthropicMode ? "当前测试按 Anthropic Messages `POST /v1/messages` 规范发起请求。"
              : "当前测试按 OpenAI-compatible `POST /chat/completions` 规范发起请求。"}
          </p>

          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI 后端</Label>
              <Select
                name="provider"
                value={draft.provider}
                onValueChange={(value) => {
                  setDraft({ ...draft, provider: value });
                  setNotice(null);
                  setTestResult(null);
                }}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="请选择后端" />
                </SelectTrigger>
                <SelectContent>
                  {backendOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {backendOptions.find((option) => option.value === draft.provider)?.description ?? "选择后端后，这里会显示对应配置项。"}
              </p>
            </div>

            {isKimiCliMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="默认 kimi-for-coding" value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" placeholder="可留空，默认使用 https://api.kimi.com/coding/v1" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            ) : isAnthropicMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" placeholder="可留空，默认使用 https://api.kimi.com/coding/" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="默认 kimi-for-coding" value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" placeholder="例如 https://api.moonshot.cn/v1" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            )}
          </Card>

          {testResult && (
            <Card className={`p-4 ${testResult.ok ? "bg-green-950/30 border-green-900" : "bg-red-950/30 border-red-900"}`}>
              <p className={`font-bold ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                {testResult.ok ? "连接成功" : "连接失败"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: {testResult.endpoint}{testResult.status === null ? "" : ` | HTTP ${testResult.status}`}
              </p>
            </Card>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{notice ?? "保存后会停留在当前页面，你可以继续修改或返回首页。"}</p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => void handleTestConnection()} disabled={isTesting}>
                {isTesting ? "测试中..." : "测试连接"}
              </Button>
              <Button type="submit" disabled={props.isSaving}>
                {props.isSaving ? "保存中..." : "保存设置"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
