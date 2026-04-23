import { buildChatContext, buildConsistencyContext } from "./context-service";
import type { ChatActionMode, ChatContext } from "./context-service";

export interface SkillRequest {
  mode: ChatActionMode;
  content: string;
  context?: Partial<ChatContext>;
}

export interface SkillResult {
  skill: "capture_braindump" | "next_step_guide" | "consistency_check" | "shape_synopsis";
  summary: string;
  payload: Record<string, string>;
}

export async function runSkill(request: SkillRequest): Promise<SkillResult> {
  const content = request.content.trim();
  const context = buildChatContext(request);

  if (request.mode === "organize") {
    return {
      skill: "capture_braindump",
      summary: "灵感已整理，可保存到 Braindump 或继续提炼为梗概。",
      payload: {
        title: "新灵感条目",
        content,
        targetType: context.activeBibleType,
      },
    };
  }

  if (request.mode === "task" && content.includes("下一步")) {
    return {
      skill: "next_step_guide",
      summary: "建议先补齐梗概和角色，再决定是否进入大纲阶段。",
      payload: {
        stage: context.stage,
        suggestedAction: "先固定故事梗概和主要角色。",
      },
    };
  }

  if (request.mode === "check") {
    const consistencyContext = buildConsistencyContext({
      characters: context.characters ?? [],
      styleSummary: context.styleSummary ?? "待补充",
      chapterTitle: context.chapterTitle ?? "当前章节",
    });

    return {
      skill: "consistency_check",
      summary: "已进入轻量一致性检查模式，可先判断是否要保存到 Story Bible、章节或转成任务继续处理。",
      payload: {
        focus: "角色、设定与时间线",
        consistencyContext,
      },
    };
  }

  return {
    skill: "shape_synopsis",
    summary: "我先帮你把当前想法收敛成可继续推进的梗概。",
    payload: {
      synopsis: content,
    },
  };
}
