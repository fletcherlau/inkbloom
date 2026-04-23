export function HomeHeader(props: {
  onOpenCreateDialog: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header style={styles.header}>
      <div>
        <p style={styles.eyebrow}>Book Studio</p>
        <h1 style={styles.title}>Inkbloom</h1>
        <p style={styles.subtitle}>先整理书架，再进入你的写作工作区。</p>
      </div>
      <div style={styles.actions}>
        <button style={styles.secondaryButton} type="button" onClick={props.onOpenSettings}>
          设置
        </button>
        <button style={styles.primaryButton} type="button" onClick={props.onOpenCreateDialog}>
          新建书籍
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1.5rem",
    alignItems: "end",
    flexWrap: "wrap" as const,
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.72rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#8b7359",
  },
  title: {
    margin: "0.35rem 0 0",
    fontSize: "clamp(2.4rem, 5vw, 4rem)",
    lineHeight: 1,
  },
  subtitle: {
    margin: "0.75rem 0 0",
    maxWidth: "32rem",
    color: "#66584a",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#2f2721",
    color: "#f7f1e8",
    padding: "0.85rem 1.3rem",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: "999px",
    border: "1px solid #bda88f",
    background: "rgba(255, 255, 255, 0.72)",
    color: "#2f2721",
    padding: "0.85rem 1.3rem",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
};
