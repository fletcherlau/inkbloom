import type { BookSummary } from "@shared/contracts";

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return updatedAt;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function BookCard(props: {
  book: BookSummary;
  onEnter: (book: BookSummary) => void;
  onEdit: (book: BookSummary) => void;
  onDelete: (book: BookSummary) => void;
}) {
  const { book } = props;

  return (
    <article style={styles.card}>
      <div style={styles.coverAccent} aria-hidden="true" />
      <div style={styles.body}>
        <p style={styles.meta}>最近更新 {formatUpdatedAt(book.updatedAt)}</p>
        <h2 style={styles.title}>{book.title}</h2>
        <p style={styles.path}>{book.rootPath}</p>
      </div>
      <div style={styles.actions}>
        <button style={styles.primaryButton} type="button" onClick={() => props.onEnter(book)}>
          进入创作
        </button>
        <button style={styles.secondaryButton} type="button" onClick={() => props.onEdit(book)}>
          修改
        </button>
        <button style={styles.ghostButton} type="button" onClick={() => props.onDelete(book)}>
          删除
        </button>
      </div>
    </article>
  );
}

const styles = {
  card: {
    display: "grid",
    gap: "1rem",
    padding: "1.2rem",
    borderRadius: "1.2rem",
    background: "rgba(255, 250, 244, 0.9)",
    border: "1px solid rgba(99, 79, 62, 0.12)",
    boxShadow: "0 18px 45px rgba(85, 63, 43, 0.08)",
  },
  coverAccent: {
    width: "100%",
    minHeight: "8rem",
    borderRadius: "0.9rem",
    background: "linear-gradient(135deg, #c9814d 0%, #8b4b37 45%, #2f2721 100%)",
  },
  body: {
    display: "grid",
    gap: "0.4rem",
  },
  meta: {
    margin: 0,
    color: "#8a7765",
    fontSize: "0.82rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    color: "#2f2721",
  },
  path: {
    margin: 0,
    color: "#66584a",
    fontSize: "0.88rem",
    wordBreak: "break-all" as const,
  },
  actions: {
    display: "flex",
    gap: "0.6rem",
    flexWrap: "wrap" as const,
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.7rem 1rem",
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: "999px",
    border: "1px solid #bda88f",
    background: "white",
    color: "#2f2721",
    padding: "0.7rem 1rem",
    cursor: "pointer",
  },
  ghostButton: {
    border: "none",
    background: "transparent",
    color: "#a44735",
    padding: "0.7rem 0.5rem",
    cursor: "pointer",
  },
};
