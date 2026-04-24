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
  const isBackendConfigured = Boolean(llmSettings.provider && llmSettings.apiKey);

  if (view === "settings") {
    return (
      <SettingsScreen
        settings={llmSettings}
        isSaving={isSavingSettings}
        onSave={appStore.saveGlobalLlmSettings}
        onTestConnection={appStore.testGlobalLlmConnection}
        onGoHome={appStore.goHome}
      />
    );
  }

  if (view === "workspace") {
    return <AppShell />;
  }

  return (
    <>
      {!isBackendConfigured && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <p className="p-4 rounded-lg bg-amber-950/30 text-amber-400 text-sm shadow-lg">
            AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。
          </p>
        </div>
      )}
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
