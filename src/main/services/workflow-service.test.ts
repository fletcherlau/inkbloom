import { describe, expect, it } from "vitest";

import { getWorkflowSnapshot } from "./workflow-service";

describe("workflow guidance", () => {
  it("keeps a project in foundation when synopsis is missing", () => {
    const snapshot = getWorkflowSnapshot({
      hasSynopsis: false,
      hasCharacters: true,
      hasOutline: false,
      chapterCount: 0,
    });

    expect(snapshot.stage).toBe("foundation");
    expect(snapshot.suggestedAction).toContain("先固定故事梗概");
  });

  it("moves to drafting when outline and chapter scaffolds exist", () => {
    const snapshot = getWorkflowSnapshot({
      hasSynopsis: true,
      hasCharacters: true,
      hasOutline: true,
      chapterCount: 1,
    });

    expect(snapshot.stage).toBe("drafting");
  });

  it("moves to outline when synopsis and characters exist but outline is missing", () => {
    const snapshot = getWorkflowSnapshot({
      hasSynopsis: true,
      hasCharacters: true,
      hasOutline: false,
      chapterCount: 0,
    });

    expect(snapshot.stage).toBe("outline");
    expect(snapshot.suggestedAction).toContain("卷、幕、章级结构");
    expect(snapshot.completion).toEqual({
      synopsis: true,
      characters: true,
      outline: false,
      drafting: false,
    });
  });
});
