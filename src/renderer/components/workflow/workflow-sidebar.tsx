import type { WorkflowStage } from "@shared/contracts";

type WorkflowSidebarProps = {
  stage: WorkflowStage;
};

const stageLabels: Record<WorkflowStage, string> = {
  ideation: "灵感发散",
  foundation: "基础设定",
  outline: "大纲构建",
  drafting: "章节起草",
  revision: "一致性修订",
  export: "导出交付",
};

const checklist = [
  "确认核心梗概",
  "收束主要角色",
  "准备第一轮结构线索",
];

export function WorkflowSidebar({ stage }: WorkflowSidebarProps) {
  return (
    <aside aria-labelledby="workflow-title" style={styles.panel}>
      <header style={styles.header}>
        <p style={styles.kicker}>Workflow</p>
        <h2 id="workflow-title" style={styles.title}>
          当前阶段：{stageLabels[stage]}
        </h2>
        <p style={styles.description}>Task 4 先展示工作流容器和下一步占位，具体状态判断与建议逻辑留到 Task 5。</p>
      </header>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>下一步建议</h3>
        <p style={styles.cardBody}>先把当前对话整理成稳定梗概，再决定是否继续扩写角色或启动任务。</p>
      </section>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>当前检查单</h3>
        <ul style={styles.list}>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

const styles = {
  panel: {
    display: "grid",
    alignContent: "start",
    gap: "1rem",
    padding: "1.5rem",
    borderLeft: "1px solid #d7d2c8",
    background: "#f9f4ea",
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
    fontSize: "1.35rem",
  },
  description: {
    margin: 0,
    color: "#6b6257",
  },
  card: {
    borderRadius: "18px",
    border: "1px solid #d7d2c8",
    background: "#fffdf8",
    padding: "1rem",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1rem",
  },
  cardBody: {
    margin: "0.6rem 0 0",
    color: "#5f564d",
  },
  list: {
    margin: "0.75rem 0 0",
    paddingLeft: "1.2rem",
    color: "#5f564d",
  },
};
