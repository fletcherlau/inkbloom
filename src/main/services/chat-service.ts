import { openProjectDatabase } from "../database/schema";
import { ProjectRepository } from "../database/repositories/project-repository";
import { sendAnthropicMessage } from "./anthropic-service";
import { buildChatContext } from "./context-service";
import type { ChatActionMode, ChatContext } from "./context-service";
import { createKimiAcpService } from "./kimi-acp-service";
import { createSettingsService } from "./settings-service";
import { runSkill } from "./skill-service";

export interface SendChatTurnInput {
  mode: ChatActionMode;
  content: string;
  projectId?: string;
  context?: Partial<ChatContext>;
}

export type SaveTarget = "story-bible" | "chapter" | "task";

function buildModeInstruction(mode: ChatActionMode) {
  switch (mode) {
    case "organize":
      return "请把用户输入整理成更清晰、可继续推进的创作材料。";
    case "check":
      return "请从角色、设定、时间线和文风一致性角度检查用户内容。";
    case "task":
      return "请把用户需求拆成可执行的下一步，并明确推荐动作。";
    case "explore":
    default:
      return "请发散多个有区分度的创作方向，并保持中文表达自然。";
  }
}

function mapModeToSkill(mode: ChatActionMode) {
  switch (mode) {
    case "organize":
      return "capture_braindump" as const;
    case "check":
      return "consistency_check" as const;
    case "task":
      return "next_step_guide" as const;
    case "explore":
    default:
      return "shape_synopsis" as const;
  }
}

function buildKimiCliPrompt(input: { mode: ChatActionMode; content: string; context: ChatContext }) {
  const sections = [
    "你是 Inkbloom 的中文小说创作助手。",
    buildModeInstruction(input.mode),
    `当前创作阶段：${input.context.stage}`,
    `当前 Story Bible 焦点：${input.context.activeBibleType}`,
  ];

  if (input.context.chapterTitle) {
    sections.push(`当前章节：${input.context.chapterTitle}`);
  }

  if (input.context.styleSummary) {
    sections.push(`风格要求：${input.context.styleSummary}`);
  }

  if (input.context.characters && input.context.characters.length > 0) {
    sections.push(`角色关注点：${input.context.characters.join("、")}`);
  }

  sections.push("请直接输出最终回答，不要解释你使用了什么工具。");
  sections.push("用户输入：");
  sections.push(input.content);

  return sections.join("\n\n");
}

export function createChatService(
  dbPath: string,
  options?: {
    settingsService?: ReturnType<typeof createSettingsService>;
    kimiAcpService?: ReturnType<typeof createKimiAcpService>;
  },
) {
  const database = openProjectDatabase(dbPath);
  const projectRepository = new ProjectRepository(database);
  const settingsService = options?.settingsService ?? createSettingsService(dbPath);
  const kimiAcpService = options?.kimiAcpService ?? createKimiAcpService();

  return {
    async sendChatTurn(input: SendChatTurnInput) {
      const content = input.content.trim();
      const context = buildChatContext(input);
      const settings = settingsService.getGlobalLlmSettings();

      if (settings.provider.trim() === "anthropic-compatible") {
        const summary = await sendAnthropicMessage({
          settings,
          prompt: buildKimiCliPrompt({
            mode: input.mode,
            content,
            context,
          }),
        });

        return {
          assistantMessage: {
            role: "assistant" as const,
            content: summary,
          },
          saveTargets: ["story-bible", "chapter", "task"] as const satisfies readonly SaveTarget[],
          skillResult: {
            skill: mapModeToSkill(input.mode),
            summary,
            payload: {
              provider: "anthropic-compatible",
            },
          },
        };
      }

      if (settings.provider.trim() === "kimi-cli") {
        const projectRoot = input.projectId
          ? projectRepository.findById(input.projectId)?.rootPath
          : process.cwd();
        const summary = await kimiAcpService.generateReply({
          settings,
          prompt: buildKimiCliPrompt({
            mode: input.mode,
            content,
            context,
          }),
          workDir: projectRoot ?? process.cwd(),
        });

        return {
          assistantMessage: {
            role: "assistant" as const,
            content: summary,
          },
          saveTargets: ["story-bible", "chapter", "task"] as const satisfies readonly SaveTarget[],
          skillResult: {
            skill: mapModeToSkill(input.mode),
            summary,
            payload: {
              provider: "kimi-cli",
            },
          },
        };
      }

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
    },
  };
}
