import { describe, expect, it } from "vitest";

import { runSkill } from "./skill-service";
import { buildChatContext, buildConsistencyContext } from "./context-service";

describe("context service", () => {
  it("includes characters, style, and current chapter in consistency checks", () => {
    const context = buildConsistencyContext({
      characters: ["Lin", "Qiao"],
      styleSummary: "冷峻、第三人称限知",
      chapterTitle: "第一章",
    });

    expect(context).toContain("Lin");
    expect(context).toContain("第三人称限知");
    expect(context).toContain("第一章");
  });

  it("preserves consistency fields when building normalized chat context", () => {
    const context = buildChatContext({
      mode: "check",
      context: {
        characters: ["Lin", "Qiao"],
        styleSummary: "冷峻、第三人称限知",
        chapterTitle: "第一章",
      },
    });

    expect(context.characters).toEqual(["Lin", "Qiao"]);
    expect(context.styleSummary).toBe("冷峻、第三人称限知");
    expect(context.chapterTitle).toBe("第一章");
  });

  it("passes normalized consistency fields through the check skill flow", async () => {
    const result = await runSkill({
      mode: "check",
      content: "看看这一章有没有设定漂移",
      context: {
        characters: ["Lin", "Qiao"],
        styleSummary: "冷峻、第三人称限知",
        chapterTitle: "第一章",
      },
    });

    expect(result.skill).toBe("consistency_check");
    expect(result.payload.consistencyContext).toContain("Lin");
    expect(result.payload.consistencyContext).toContain("第三人称限知");
    expect(result.payload.consistencyContext).toContain("第一章");
  });
});
