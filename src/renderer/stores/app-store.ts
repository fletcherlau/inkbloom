import { useSyncExternalStore } from "react";

import type { BookSummary, GlobalLlmSettings } from "@shared/contracts";

import { workspaceStore } from "./workspace-store";

export type AppView = "home" | "settings" | "workspace";

type AppState = {
  readonly view: AppView;
  readonly books: readonly BookSummary[];
  readonly selectedBookId: string | null;
  readonly llmSettings: GlobalLlmSettings;
  readonly isSavingSettings: boolean;
  readonly isLoading: boolean;
  readonly hasBootstrapped: boolean;
  readonly isBookDialogOpen: boolean;
  readonly editingBookId: string | null;
  readonly deletingBookId: string | null;
};

function createEmptyLlmSettings(): GlobalLlmSettings {
  return {
    provider: "",
    baseUrl: "",
    apiKey: "",
    model: "",
  };
}

function createInitialState(): AppState {
  return {
    view: "home",
    books: [],
    selectedBookId: null,
    llmSettings: createEmptyLlmSettings(),
    isSavingSettings: false,
    isLoading: false,
    hasBootstrapped: false,
    isBookDialogOpen: false,
    editingBookId: null,
    deletingBookId: null,
  };
}

let state = createInitialState();
let snapshot = freezeStateSnapshot(state);

const listeners = new Set<() => void>();

function freezeStateSnapshot(currentState: AppState) {
  return Object.freeze({
    ...currentState,
    books: Object.freeze(currentState.books.map((book) => Object.freeze({ ...book }))),
  });
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(nextState: Partial<AppState>) {
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

function getApi() {
  if (!window.inkbloom) {
    throw new Error("window.inkbloom is not available");
  }

  return window.inkbloom;
}

function sortBooks(books: readonly BookSummary[]) {
  return [...books].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function replaceBook(nextBook: BookSummary) {
  const books = state.books.some((book) => book.id === nextBook.id)
    ? state.books.map((book) => (book.id === nextBook.id ? nextBook : book))
    : [nextBook, ...state.books];

  return sortBooks(books);
}

function sanitizeLlmSettings(settings: GlobalLlmSettings | null | undefined): GlobalLlmSettings {
  return {
    provider: settings?.provider ?? "",
    baseUrl: settings?.baseUrl ?? "",
    apiKey: settings?.apiKey ?? "",
    model: settings?.model ?? "",
  };
}

export const appStore = {
  subscribe,
  getSnapshot,
  async bootstrap() {
    if (state.hasBootstrapped || state.isLoading) {
      return;
    }

    setState({ isLoading: true });

    const [books, llmSettings] = await Promise.all([getApi().listBooks(), getApi().getGlobalLlmSettings()]);

    setState({
      books: sortBooks(books),
      llmSettings: sanitizeLlmSettings(llmSettings),
      isLoading: false,
      hasBootstrapped: true,
    });
  },
  openCreateDialog() {
    setState({
      isBookDialogOpen: true,
      editingBookId: null,
    });
  },
  openEditDialog(book: BookSummary) {
    setState({
      isBookDialogOpen: true,
      editingBookId: book.id,
    });
  },
  closeBookDialog() {
    setState({
      isBookDialogOpen: false,
      editingBookId: null,
    });
  },
  openDeleteDialog(book: BookSummary) {
    setState({ deletingBookId: book.id });
  },
  closeDeleteDialog() {
    setState({ deletingBookId: null });
  },
  openSettings() {
    setState({ view: "settings" });
  },
  goHome() {
    workspaceStore.resetWorkspace();
    setState({
      view: "home",
      selectedBookId: null,
    });
  },
  enterBook(book: BookSummary) {
    workspaceStore.initializeWorkspace({
      projectId: book.id,
      projectName: book.title,
    });
    setState({
      selectedBookId: book.id,
      view: "workspace",
    });
  },
  async createBook(title: string) {
    const created = await getApi().createBook({ title });

    workspaceStore.initializeWorkspace({
      projectId: created.id,
      projectName: created.title,
    });

    setState({
      books: replaceBook(created),
      selectedBookId: created.id,
      view: "workspace",
      isBookDialogOpen: false,
      editingBookId: null,
      hasBootstrapped: true,
    });
  },
  async saveGlobalLlmSettings(input: GlobalLlmSettings) {
    setState({ isSavingSettings: true });

    const saved = await getApi().saveGlobalLlmSettings(input);

    setState({
      llmSettings: sanitizeLlmSettings(saved),
      isSavingSettings: false,
    });
  },
  async updateBook(input: { id: string; title: string }) {
    const updated = await getApi().updateBook(input);

    setState({
      books: replaceBook(updated),
      isBookDialogOpen: false,
      editingBookId: null,
    });
  },
  async deleteBook(id: string) {
    await getApi().deleteBook({ id });

    setState({
      books: state.books.filter((book) => book.id !== id),
      deletingBookId: null,
      selectedBookId: state.selectedBookId === id ? null : state.selectedBookId,
    });
  },
  setBooksForTests(books: readonly BookSummary[]) {
    state = createInitialState();
    snapshot = freezeStateSnapshot(state);
    setState({
      books: sortBooks(books),
      hasBootstrapped: true,
    });
  },
  resetForTests() {
    state = createInitialState();
    snapshot = freezeStateSnapshot(state);
    emitChange();
  },
};

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getSnapshot()),
    () => selector(freezeStateSnapshot(createInitialState())),
  );
}
