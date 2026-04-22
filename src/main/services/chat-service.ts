import type { ChatActionMode, ChatContext } from "./context-service";
import { buildChatContext } from "./context-service";
import { runSkill } from "./skill-service";

export interface SendChatTurnInput {
  mode: ChatActionMode;
  content: string;
  context?: Partial<ChatContext>;
}

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
    skillResult,
  };
}
