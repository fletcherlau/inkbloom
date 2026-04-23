import type { ChatActionMode, ChatContext } from "./context-service";
import { buildChatContext } from "./context-service";
import { runSkill } from "./skill-service";

export interface SendChatTurnInput {
  mode: ChatActionMode;
  content: string;
  context?: Partial<ChatContext>;
}

export type SaveTarget = "story-bible" | "chapter" | "task";

export async function sendChatTurn(input: SendChatTurnInput) {
  const content = input.content.trim();
  const context = buildChatContext(input);
  const skillResult = await runSkill({
    mode: input.mode,
    content,
    context,
  });

  return {
    assistantMessage: {
      role: "assistant" as const,
      content: skillResult.summary,
    },
    saveTargets: ["story-bible", "chapter", "task"] as const satisfies readonly SaveTarget[],
    skillResult,
  };
}
