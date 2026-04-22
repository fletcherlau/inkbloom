import { describe, expect, it } from "vitest";

import { runSkill } from "./skill-service";

describe("skill routing", () => {
  it("routes organize mode to capture_braindump", async () => {
    const result = await runSkill({
      mode: "organize",
      content: "一个失忆杀手在海边小镇醒来。",
      context: { activeBibleType: "braindump" },
    });

    expect(result.skill).toBe("capture_braindump");
    expect(result.summary).toContain("灵感已整理");
  });

  it("routes task mode to next_step_guide when the request asks for next steps", async () => {
    const result = await runSkill({
      mode: "task",
      content: "我下一步应该干什么？",
      context: { stage: "foundation" },
    });

    expect(result.skill).toBe("next_step_guide");
  });
});
