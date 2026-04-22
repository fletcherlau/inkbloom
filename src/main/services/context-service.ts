import type { BibleItemType, WorkflowStage } from "@shared/contracts";

export type ChatActionMode = "organize" | "explore" | "check" | "task";

export interface ChatContext {
  activeBibleType: BibleItemType;
  stage: WorkflowStage;
}

export function buildChatContext(input: {
  mode: ChatActionMode;
  context?: Partial<ChatContext>;
}): ChatContext {
  return {
    activeBibleType: input.context?.activeBibleType ?? getDefaultBibleType(input.mode),
    stage: input.context?.stage ?? "foundation",
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
