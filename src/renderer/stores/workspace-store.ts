import { useSyncExternalStore } from "react";

import type { BibleItemType, WorkflowStage } from "@shared/contracts";

export type ChatActionMode = "organize" | "explore" | "check" | "task";

export interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
}

type WorkspaceState = {
  readonly projectId: string | null;
  readonly projectName: string;
  readonly workflowStage: WorkflowStage;
  readonly selectedBibleType: BibleItemType;
  readonly selectedMode: ChatActionMode;
  readonly draftMessage: string;
  readonly messages: readonly ChatMessage[];
};

function createInitialState(
  overrides: Partial<Pick<WorkspaceState, "projectId" | "projectName">> = {},
): WorkspaceState {
  return {
    projectId: overrides.projectId ?? null,
    projectName: overrides.projectName ?? "未命名作品",
    workflowStage: "foundation",
    selectedBibleType: "synopsis",
    selectedMode: "organize",
    draftMessage: "",
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: "从这里开始推进你的设定、梗概和章节想法。",
      },
    ],
  };
}

let state = createInitialState();
let snapshot = freezeStateSnapshot(state);

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(nextState: Partial<WorkspaceState>) {
  state = { ...state, ...nextState };
  snapshot = freezeStateSnapshot(state);
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function freezeStateSnapshot(currentState: WorkspaceState) {
  const messages = currentState.messages.map((message) => Object.freeze({ ...message }));

  return Object.freeze({
    ...currentState,
    messages: Object.freeze(messages),
  });
}

export const workspaceStore = {
  getSnapshot,
  subscribe,
  initializeWorkspace(input: { projectId: string; projectName: string }) {
    state = createInitialState(input);
    snapshot = freezeStateSnapshot(state);
    emitChange();
  },
  setSelectedBibleType(selectedBibleType: BibleItemType) {
    setState({ selectedBibleType });
  },
  setSelectedMode(selectedMode: ChatActionMode) {
    setState({ selectedMode });
  },
  setDraftMessage(draftMessage: string) {
    setState({ draftMessage });
  },
  sendMessage(input: { mode: ChatActionMode; content: string }) {
    const trimmedContent = input.content.trim();

    if (!trimmedContent) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...state.messages,
      {
        id: `user-${state.messages.length + 1}`,
        role: "user",
        content: trimmedContent,
      },
      {
        id: `assistant-${state.messages.length + 2}`,
        role: "assistant",
        content: `已记录为${modeLabels[input.mode]}请求，后续任务会在这里继续展开。`,
      },
    ];

    setState({
      messages: nextMessages,
      draftMessage: "",
    });
  },
  resetForTests() {
    state = createInitialState();
    snapshot = freezeStateSnapshot(state);
    emitChange();
  },
};

export const modeLabels: Record<ChatActionMode, string> = {
  organize: "整理",
  explore: "发散",
  check: "检查",
  task: "转任务",
};

export function useWorkspaceStore<T>(selector: (state: WorkspaceState) => T): T {
  return useSyncExternalStore(
    workspaceStore.subscribe,
    () => selector(workspaceStore.getSnapshot()),
    () => selector(freezeStateSnapshot(createInitialState())),
  );
}
