import type { WorkflowSignals, WorkflowSnapshot } from "@shared/contracts";

function buildCompletion(signals: WorkflowSignals): WorkflowSnapshot["completion"] {
  return {
    synopsis: signals.hasSynopsis,
    characters: signals.hasCharacters,
    outline: signals.hasOutline,
    drafting: signals.chapterCount > 0,
  };
}

export function getWorkflowSnapshot(signals: WorkflowSignals): WorkflowSnapshot {
  if (!signals.hasSynopsis || !signals.hasCharacters) {
    return {
      stage: "foundation",
      suggestedAction: "先固定故事梗概和主要角色，再继续扩大结构。",
      completion: buildCompletion(signals),
    };
  }

  if (!signals.hasOutline) {
    return {
      stage: "outline",
      suggestedAction: "把当前梗概推进成卷、幕、章级结构。",
      completion: buildCompletion(signals),
    };
  }

  if (signals.chapterCount === 0) {
    return {
      stage: "drafting",
      suggestedAction: "开始试写第一章，先验证角色声音和开篇张力。",
      completion: buildCompletion(signals),
    };
  }

  return {
    stage: "drafting",
    suggestedAction: "继续推进章节写作，并在关键节点执行一致性检查。",
    completion: buildCompletion(signals),
  };
}
