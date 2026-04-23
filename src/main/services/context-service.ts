import type { BibleItemType, WorkflowStage } from "@shared/contracts";

export type ChatActionMode = "organize" | "explore" | "check" | "task";

export interface ConsistencyContextInput {
  characters: string[];
  styleSummary: string;
  chapterTitle: string;
}

export interface ChatContext {
  activeBibleType: BibleItemType;
  stage: WorkflowStage;
  characters?: string[];
  styleSummary?: string;
  chapterTitle?: string;
}

export function buildChatContext(input: {
  mode: ChatActionMode;
  context?: Partial<ChatContext>;
}): ChatContext {
  return {
    activeBibleType: input.context?.activeBibleType ?? getDefaultBibleType(input.mode),
    stage: input.context?.stage ?? "foundation",
    characters: input.context?.characters,
    styleSummary: input.context?.styleSummary,
    chapterTitle: input.context?.chapterTitle,
  };
}

function getDefaultBibleType(mode: ChatActionMode): BibleItemType {
  switch (mode) {
    case "organize":
      return "braindump";
    case "check":
      return "constraints";
    case "task":
      return "outline";
    case "explore":
    default:
      return "synopsis";
  }
}

export function buildConsistencyContext(input: ConsistencyContextInput) {
  return [
    `角色: ${input.characters.join(", ")}`,
    `风格: ${input.styleSummary}`,
    `章节: ${input.chapterTitle}`,
  ].join("\n");
}
