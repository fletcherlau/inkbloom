import { useEffect } from "react";

import { HomeScreen } from "./components/home/home-screen";
import { AppShell } from "./components/layout/app-shell";
import { SettingsScreen } from "./components/settings/settings-screen";
import { appStore, useAppStore } from "./stores/app-store";

export function App() {
  const view = useAppStore((state) => state.view);
  const books = useAppStore((state) => state.books);
  const isLoading = useAppStore((state) => state.isLoading);
  const llmSettings = useAppStore((state) => state.llmSettings);
  const isSavingSettings = useAppStore((state) => state.isSavingSettings);
  const isBookDialogOpen = useAppStore((state) => state.isBookDialogOpen);
  const editingBookId = useAppStore((state) => state.editingBookId);
  const deletingBookId = useAppStore((state) => state.deletingBookId);

  useEffect(() => {
    void appStore.bootstrap();
  }, []);

  const editingBook = books.find((book) => book.id === editingBookId) ?? null;
  const deletingBook = books.find((book) => book.id === deletingBookId) ?? null;
  const isLlmConfigured = Boolean(llmSettings.provider && llmSettings.apiKey && llmSettings.model);

  if (view === "settings") {
    return (
      <SettingsScreen
        settings={llmSettings}
        isSaving={isSavingSettings}
        onSave={appStore.saveGlobalLlmSettings}
        onGoHome={appStore.goHome}
      />
    );
  }

  if (view === "workspace") {
    return <AppShell />;
  }

  return (
    <>
      {!isLlmConfigured ? (
        <div style={styles.homeNoticeWrap}>
          <p style={styles.homeNotice}>AI 功能暂不可用，先到全局设置补齐 provider、API Key 和 model。</p>
        </div>
      ) : null}
      <HomeScreen
        books={books}
        isLoading={isLoading}
        isCreateDialogOpen={isBookDialogOpen && editingBook === null}
        editingBook={editingBook}
        deletingBook={deletingBook}
        onOpenCreateDialog={appStore.openCreateDialog}
        onOpenEditDialog={appStore.openEditDialog}
        onCloseBookDialog={appStore.closeBookDialog}
        onSubmitBook={(title) =>
          editingBook ? appStore.updateBook({ id: editingBook.id, title }) : appStore.createBook(title)
        }
        onEnterBook={appStore.enterBook}
        onOpenDeleteDialog={appStore.openDeleteDialog}
        onCloseDeleteDialog={appStore.closeDeleteDialog}
        onConfirmDelete={() => (deletingBook ? appStore.deleteBook(deletingBook.id) : Promise.resolve())}
        onOpenSettings={appStore.openSettings}
      />
    </>
  );
}

const styles = {
  homeNoticeWrap: {
    position: "fixed" as const,
    top: "1rem",
    right: "1rem",
    zIndex: 10,
    maxWidth: "min(28rem, calc(100vw - 2rem))",
  },
  homeNotice: {
    margin: 0,
    padding: "0.9rem 1rem",
    borderRadius: "1rem",
    background: "rgba(188, 114, 67, 0.12)",
    color: "#6b3f24",
    boxShadow: "0 10px 24px rgba(85, 63, 43, 0.08)",
  },
};
