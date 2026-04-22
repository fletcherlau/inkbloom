export type WorkflowStage =
  | "ideation"
  | "foundation"
  | "outline"
  | "drafting"
  | "revision"
  | "export";

export interface WorkspaceSummary {
  projectId: string | null;
  projectName: string | null;
}

export type BibleItemType =
  | "braindump"
  | "genre"
  | "style"
  | "synopsis"
  | "characters"
  | "worldbuilding"
  | "outline"
  | "themes"
  | "constraints";

export interface BibleItemInput {
  projectId: string;
  type: BibleItemType;
  title: string;
  content: string;
}

export interface ChapterInput {
  projectId: string;
  volumeKey: string;
  chapterKey: string;
  title: string;
  manuscriptPath: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface BibleItemRecord {
  id: string;
  projectId: string;
  type: BibleItemType;
  title: string;
  content: string;
  status: "draft" | "confirmed";
  createdAt: string;
  updatedAt: string;
}

export interface ChapterRecord {
  id: string;
  projectId: string;
  volumeKey: string;
  chapterKey: string;
  title: string;
  summary: string;
  manuscriptPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStateRecord {
  projectId: string;
  stage: WorkflowStage;
  completionJson: string;
  suggestedNextAction: string;
  updatedAt: string;
}

export interface ChatThreadRecord {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatRole = "user" | "assistant" | "system";
export type ChatMode = "chat" | "task" | "draft";

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  role: ChatRole;
  mode: ChatMode;
  content: string;
  createdAt: string;
}

export type TaskStatus = "queued" | "running" | "succeeded" | "failed";

export interface TaskRecord {
  id: string;
  projectId: string;
  type: string;
  status: TaskStatus;
  inputJson: string;
  outputJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface InkbloomApi {
  listBibleItems(projectId: string, type: BibleItemType): Promise<BibleItemRecord[]>;
  createBibleItem(input: BibleItemInput): Promise<BibleItemRecord>;
  createChapter(input: ChapterInput): Promise<ChapterRecord>;
}

declare global {
  interface Window {
    inkbloom: InkbloomApi;
  }
}
