import type { BookSummary } from "@shared/contracts";

import { BookDialog } from "./book-dialog";
import { BookGrid } from "./book-grid";
import { DeleteBookDialog } from "./delete-book-dialog";
import { HomeHeader } from "./home-header";

export function HomeScreen(props: {
  books: readonly BookSummary[];
  isLoading: boolean;
  isCreateDialogOpen: boolean;
  editingBook: BookSummary | null;
  deletingBook: BookSummary | null;
  onOpenCreateDialog: () => void;
  onOpenEditDialog: (book: BookSummary) => void;
  onCloseBookDialog: () => void;
  onSubmitBook: (title: string) => Promise<void>;
  onEnterBook: (book: BookSummary) => void;
  onOpenDeleteDialog: (book: BookSummary) => void;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => Promise<void>;
  onOpenSettings: () => void;
}) {
  const isBookDialogOpen = props.isCreateDialogOpen || props.editingBook !== null;

  return (
    <main style={styles.page}>
      <div style={styles.backdrop} aria-hidden="true" />
      <section style={styles.panel}>
        <HomeHeader
          onOpenCreateDialog={props.onOpenCreateDialog}
          onOpenSettings={props.onOpenSettings}
        />

        {props.isLoading ? (
          <p style={styles.status}>正在加载书架...</p>
        ) : props.books.length === 0 ? (
          <section style={styles.emptyState}>
            <p style={styles.emptyEyebrow}>Fresh Shelf</p>
            <h2 style={styles.emptyTitle}>新建第一本书</h2>
            <p style={styles.emptyCopy}>你的书架还是空的。先创建一本书，再进入创作工作区。</p>
            <button style={styles.primaryButton} type="button" onClick={props.onOpenCreateDialog}>
              新建书籍
            </button>
          </section>
        ) : (
          <BookGrid
            books={props.books}
            onEnterBook={props.onEnterBook}
            onOpenEditDialog={props.onOpenEditDialog}
            onOpenDeleteDialog={props.onOpenDeleteDialog}
          />
        )}
      </section>

      <BookDialog
        isOpen={isBookDialogOpen}
        book={props.editingBook}
        onClose={props.onCloseBookDialog}
        onSubmit={props.onSubmitBook}
      />
      <DeleteBookDialog
        book={props.deletingBook}
        onClose={props.onCloseDeleteDialog}
        onConfirm={props.onConfirmDelete}
      />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative" as const,
    overflow: "hidden" as const,
    background: "linear-gradient(180deg, #f1e9dd 0%, #eadfce 100%)",
    color: "#2f2721",
  },
  backdrop: {
    position: "absolute" as const,
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(201,129,77,0.24), transparent 32%), radial-gradient(circle at bottom right, rgba(111,62,48,0.18), transparent 34%)",
  },
  panel: {
    position: "relative" as const,
    zIndex: 1,
    display: "grid",
    gap: "1.5rem",
    padding: "min(6vw, 3rem)",
  },
  status: {
    margin: 0,
    color: "#66584a",
  },
  emptyState: {
    display: "grid",
    gap: "0.8rem",
    justifyItems: "start" as const,
    padding: "2rem",
    borderRadius: "1.4rem",
    background: "rgba(255, 250, 244, 0.88)",
    border: "1px solid rgba(99, 79, 62, 0.12)",
    boxShadow: "0 22px 55px rgba(85, 63, 43, 0.08)",
  },
  emptyEyebrow: {
    margin: 0,
    color: "#8b7359",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    fontSize: "0.72rem",
  },
  emptyTitle: {
    margin: 0,
    fontSize: "2rem",
  },
  emptyCopy: {
    margin: 0,
    maxWidth: "30rem",
    color: "#66584a",
    lineHeight: 1.7,
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.85rem 1.3rem",
    cursor: "pointer",
  },
};
