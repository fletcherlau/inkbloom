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
