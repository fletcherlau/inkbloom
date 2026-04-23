import type { BibleItemType } from "@shared/contracts";

type StoryBiblePanelProps = {
  projectName: string;
  selectedType: BibleItemType;
  onSelectType: (type: BibleItemType) => void;
};

const bibleSections: Array<{ type: BibleItemType; label: string; summary: string }> = [
  { type: "braindump", label: "灵感池", summary: "暂存碎片、对白和场景火花" },
  { type: "synopsis", label: "梗概", summary: "固定一句话梗概和扩展摘要" },
  { type: "characters", label: "角色", summary: "维护角色动机、关系和弧光" },
  { type: "worldbuilding", label: "世界观", summary: "记录规则、制度和设定边界" },
  { type: "outline", label: "大纲", summary: "卷、幕、章结构的当前骨架" },
];

export function StoryBiblePanel({
  projectName,
  selectedType,
  onSelectType,
}: StoryBiblePanelProps) {
  return (
    <aside aria-labelledby="story-bible-title" style={styles.panel}>
      <header style={styles.header}>
        <p style={styles.kicker}>Story Bible</p>
        <h2 id="story-bible-title" style={styles.title}>
          {projectName}
        </h2>
        <p style={styles.description}>
          长期设定和核心材料在这里沉淀。当前版本先接住聊天里的“保存到 Story Bible”动作提示，暂不扩展成真正回写编辑器。
        </p>
      </header>
      <nav aria-label="story-bible-sections" style={styles.nav}>
        {bibleSections.map((section) => {
          const isActive = section.type === selectedType;

          return (
            <button
              key={section.type}
              type="button"
              onClick={() => onSelectType(section.type)}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : null),
              }}
            >
              <strong>{section.label}</strong>
              <span style={styles.summary}>{section.summary}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  panel: {
    display: "grid",
    alignContent: "start",
    gap: "1.25rem",
    padding: "1.5rem",
    borderRight: "1px solid #d7d2c8",
    background: "#f6f0e4",
  },
  header: {
    display: "grid",
    gap: "0.45rem",
  },
  kicker: {
    margin: 0,
    color: "#8a5a2b",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: 0,
    fontSize: "1.45rem",
  },
  description: {
    margin: 0,
    color: "#6b6257",
  },
  nav: {
    display: "grid",
    gap: "0.75rem",
  },
  item: {
    display: "grid",
    gap: "0.3rem",
    textAlign: "left" as const,
    padding: "0.85rem 0.95rem",
    borderRadius: "16px",
    border: "1px solid #d8c6a7",
    background: "#fffaf2",
    cursor: "pointer",
  },
  itemActive: {
    background: "#ead1ad",
    borderColor: "#c9873f",
  },
  summary: {
    color: "#5f564d",
    fontSize: "0.92rem",
  },
};
