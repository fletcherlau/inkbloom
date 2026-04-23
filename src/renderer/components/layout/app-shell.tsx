import { appStore, useAppStore } from "../../stores/app-store";
import { ChapterPanel } from "../chapters/chapter-panel";
import { StoryBiblePanel } from "../bible/story-bible-panel";
import { ChatPanel } from "../chat/chat-panel";
import { WorkflowSidebar } from "../workflow/workflow-sidebar";
import { useWorkspaceStore, workspaceStore } from "../../stores/workspace-store";

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
    <main style={styles.shell}>
      <h1 style={styles.appTitle}>Inkbloom</h1>
      <div style={styles.columns}>
        <StoryBiblePanel
          projectName={projectName}
          selectedType={selectedBibleType}
          onSelectType={workspaceStore.setSelectedBibleType}
        />
        <section aria-label="chat-column" style={styles.centerColumn}>
          <header style={styles.workspaceHeader}>
            <div style={styles.workspaceMeta}>
              <p style={styles.workspaceEyebrow}>当前作品</p>
              <h2 style={styles.workspaceTitle}>{projectName}</h2>
            </div>
            <button type="button" style={styles.returnButton} onClick={appStore.goHome}>
              返回首页
            </button>
          </header>
          {!isBackendConfigured ? (
            <p style={styles.notice}>AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。</p>
          ) : null}
          <p style={styles.intro}>打开作品或创建新项目以开始创作。</p>
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

const styles = {
  shell: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f4ecdf 0%, #efe5d4 100%)",
    color: "#2f2721",
  },
  appTitle: {
    position: "absolute" as const,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden" as const,
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap" as const,
    border: 0,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr) 320px",
    minHeight: "100vh",
  },
  centerColumn: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    gap: "1rem",
    padding: "1.75rem",
    minWidth: 0,
  },
  workspaceHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "start",
    flexWrap: "wrap" as const,
  },
  workspaceMeta: {
    display: "grid",
    gap: "0.35rem",
  },
  workspaceEyebrow: {
    margin: 0,
    color: "#8b7359",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontSize: "0.72rem",
  },
  workspaceTitle: {
    margin: 0,
    fontSize: "1.8rem",
  },
  returnButton: {
    borderRadius: "999px",
    border: "1px solid #bda88f",
    background: "rgba(255, 255, 255, 0.72)",
    color: "#2f2721",
    padding: "0.8rem 1.1rem",
    cursor: "pointer",
  },
  notice: {
    margin: 0,
    padding: "0.9rem 1rem",
    borderRadius: "1rem",
    background: "rgba(188, 114, 67, 0.12)",
    color: "#6b3f24",
  },
  intro: {
    margin: "0 0 1rem",
    color: "#6b6257",
  },
};
