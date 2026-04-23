import { useEffect } from "react";

import { HomeScreen } from "./components/home/home-screen";
import { AppShell } from "./components/layout/app-shell";
import { appStore, useAppStore } from "./stores/app-store";

export function App() {
  const view = useAppStore((state) => state.view);
  const books = useAppStore((state) => state.books);
  const isLoading = useAppStore((state) => state.isLoading);
  const isBookDialogOpen = useAppStore((state) => state.isBookDialogOpen);
  const editingBookId = useAppStore((state) => state.editingBookId);
  const deletingBookId = useAppStore((state) => state.deletingBookId);

  useEffect(() => {
    void appStore.bootstrap();
  }, []);

  const editingBook = books.find((book) => book.id === editingBookId) ?? null;
  const deletingBook = books.find((book) => book.id === deletingBookId) ?? null;

  if (view === "settings") {
    return (
      <main style={styles.settingsPage}>
        <section style={styles.settingsCard}>
          <h1 style={styles.settingsTitle}>设置</h1>
          <p style={styles.settingsCopy}>全局 LLM 设置界面会在 Task 4 完整接入，这里先保留顶层路由占位。</p>
          <button type="button" style={styles.backButton} onClick={appStore.goHome}>
            返回首页
          </button>
        </section>
      </main>
    );
  }

  if (view === "workspace") {
    return <AppShell />;
  }

  return (
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
  );
}

const styles = {
  settingsPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(180deg, #f1e9dd 0%, #eadfce 100%)",
    padding: "1.5rem",
  },
  settingsCard: {
    width: "min(32rem, 100%)",
    display: "grid",
    gap: "1rem",
    padding: "1.5rem",
    borderRadius: "1.2rem",
    background: "rgba(255, 250, 244, 0.88)",
    boxShadow: "0 22px 55px rgba(85, 63, 43, 0.08)",
  },
  settingsTitle: {
    margin: 0,
    color: "#2f2721",
  },
  settingsCopy: {
    margin: 0,
    color: "#66584a",
    lineHeight: 1.7,
  },
  backButton: {
    justifySelf: "start" as const,
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.8rem 1.2rem",
    cursor: "pointer",
  },
};
