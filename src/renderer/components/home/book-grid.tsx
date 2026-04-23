import type { BookSummary } from "@shared/contracts";

import { BookCard } from "./book-card";

export function BookGrid(props: {
  books: readonly BookSummary[];
  onEnterBook: (book: BookSummary) => void;
  onOpenEditDialog: (book: BookSummary) => void;
  onOpenDeleteDialog: (book: BookSummary) => void;
}) {
  return (
    <section aria-label="book-grid" className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {props.books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onEnter={props.onEnterBook}
          onEdit={props.onOpenEditDialog}
          onDelete={props.onOpenDeleteDialog}
        />
      ))}
    </section>
  );
}
