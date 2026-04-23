import type { BookSummary } from "@shared/contracts";

import { BookCard } from "./book-card";

export function BookGrid(props: {
  books: readonly BookSummary[];
  onEnterBook: (book: BookSummary) => void;
  onOpenEditDialog: (book: BookSummary) => void;
  onOpenDeleteDialog: (book: BookSummary) => void;
}) {
  return (
    <section aria-label="book-grid" style={styles.grid}>
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

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
};
