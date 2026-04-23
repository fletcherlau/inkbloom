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

export interface WorkflowSignals {
  hasSynopsis: boolean;
  hasCharacters: boolean;
  hasOutline: boolean;
  chapterCount: number;
}

export interface WorkflowSnapshot {
  stage: WorkflowStage;
  suggestedAction: string;
  completion: {
    synopsis: boolean;
    characters: boolean;
    outline: boolean;
    drafting: boolean;
  };
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

export interface BookSummary {
  id: string;
  title: string;
  rootPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalLlmSettings {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface CreateBookInput {
  title: string;
}

export interface UpdateBookInput {
  id: string;
  title: string;
}

export interface DeleteBookInput {
  id: string;
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
  listBooks(): Promise<BookSummary[]>;
  createBook(input: CreateBookInput): Promise<BookSummary>;
  updateBook(input: UpdateBookInput): Promise<BookSummary>;
  deleteBook(input: DeleteBookInput): Promise<void>;
  getGlobalLlmSettings(): Promise<GlobalLlmSettings>;
  saveGlobalLlmSettings(input: GlobalLlmSettings): Promise<GlobalLlmSettings>;
  listBibleItems(projectId: string, type: BibleItemType): Promise<BibleItemRecord[]>;
  createBibleItem(input: BibleItemInput): Promise<BibleItemRecord>;
  createChapter(input: ChapterInput): Promise<ChapterRecord>;
  getWorkflowSnapshot(signals: WorkflowSignals): Promise<WorkflowSnapshot>;
}

declare global {
  interface Window {
    inkbloom: InkbloomApi;
  }
}
