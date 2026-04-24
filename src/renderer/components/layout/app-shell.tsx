import { appStore } from "../../stores/app-store";
import { useAppStore } from "../../stores/app-store";
import { ChapterPanel } from "../chapters/chapter-panel";
import { StoryBiblePanel } from "../bible/story-bible-panel";
import { ChatPanel } from "../chat/chat-panel";
import { WorkflowSidebar } from "../workflow/workflow-sidebar";
import { useWorkspaceStore, workspaceStore } from "../../stores/workspace-store";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const projectId = useWorkspaceStore((state) => state.projectId);
  const projectName = useWorkspaceStore((state) => state.projectName);
  const workflowStage = useWorkspaceStore((state) => state.workflowStage);
  const selectedBibleType = useWorkspaceStore((state) => state.selectedBibleType);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const draftMessage = useWorkspaceStore((state) => state.draftMessage);
  const messages = useWorkspaceStore((state) => state.messages);
  const llmSettings = useAppStore((state) => state.llmSettings);
  const isBackendConfigured = Boolean(llmSettings.provider && llmSettings.apiKey);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <h1 className="sr-only">Inkbloom</h1>
      <div className="grid grid-cols-[280px_1fr_320px] min-h-screen">
        <StoryBiblePanel
          projectName={projectName}
          selectedType={selectedBibleType}
          onSelectType={workspaceStore.setSelectedBibleType}
        />
        <section aria-label="chat-column" className="grid grid-rows-[auto_1fr_auto] gap-4 p-7 min-w-0">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase">当前作品</p>
              <h2 className="text-xl font-semibold text-foreground">{projectName}</h2>
            </div>
            <Button variant="outline" onClick={appStore.goHome}>返回首页</Button>
          </header>
          {!isBackendConfigured && (
            <p className="p-3 rounded-lg bg-amber-950/30 text-amber-400 text-sm">
              AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。
            </p>
          )}
          <p className="text-muted-foreground mb-1">打开作品或创建新项目以开始创作。</p>
          <ChatPanel
            messages={messages}
            projectId={projectId}
            draftMessage={draftMessage}
            selectedMode={selectedMode}
            onDraftChange={workspaceStore.setDraftMessage}
            onModeChange={workspaceStore.setSelectedMode}
            onSend={workspaceStore.sendMessage}
          />
          <ChapterPanel
            title="第一章草稿"
            relativeManuscriptPath="volume-01/chapter-001.md"
            initialContent="# 第一章\n\n在这里继续起草本章正文。"
          />
        </section>
        <WorkflowSidebar stage={workflowStage} />
      </div>
    </main>
  );
}
