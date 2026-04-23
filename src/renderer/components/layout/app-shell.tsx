import { ChapterPanel } from "../chapters/chapter-panel";
import { StoryBiblePanel } from "../bible/story-bible-panel";
import { ChatPanel } from "../chat/chat-panel";
import { WorkflowSidebar } from "../workflow/workflow-sidebar";
import { useWorkspaceStore, workspaceStore } from "../../stores/workspace-store";

export function AppShell() {
  const projectName = useWorkspaceStore((state) => state.projectName);
  const workflowStage = useWorkspaceStore((state) => state.workflowStage);
  const selectedBibleType = useWorkspaceStore((state) => state.selectedBibleType);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const draftMessage = useWorkspaceStore((state) => state.draftMessage);
  const messages = useWorkspaceStore((state) => state.messages);

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
          <p style={styles.intro}>打开作品或创建新项目以开始创作。</p>
          <ChatPanel
            messages={messages}
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
  intro: {
    margin: "0 0 1rem",
    color: "#6b6257",
  },
};
