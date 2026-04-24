import type { BookSummary } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative z-10 grid gap-6 p-[min(6vw,3rem)]">
        <HomeHeader
          onOpenCreateDialog={props.onOpenCreateDialog}
          onOpenSettings={props.onOpenSettings}
        />

        {props.isLoading ? (
          <p className="text-muted-foreground">正在加载书架...</p>
        ) : props.books.length === 0 ? (
          <Card className="grid gap-3 justify-items-start p-8 max-w-xl">
            <p className="text-xs text-muted-foreground tracking-[0.12em] uppercase font-medium">
              Fresh Shelf
            </p>
            <h2 className="text-2xl font-bold text-foreground">新建第一本书</h2>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              你的书架还是空的。先创建一本书，再进入创作工作区。
            </p>
            <Button onClick={props.onOpenCreateDialog}>新建书籍</Button>
          </Card>
        ) : (
          <BookGrid
            books={props.books}
            onEnterBook={props.onEnterBook}
            onOpenEditDialog={props.onOpenEditDialog}
            onOpenDeleteDialog={props.onOpenDeleteDialog}
          />
        )}
      </div>

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
