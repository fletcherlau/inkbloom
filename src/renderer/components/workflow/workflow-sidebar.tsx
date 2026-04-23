import { useEffect, useState } from "react";

import type { WorkflowSignals, WorkflowSnapshot, WorkflowStage } from "@shared/contracts";

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
  { key: "synopsis", label: "确认核心梗概" },
  { key: "characters", label: "收束主要角色" },
  { key: "outline", label: "准备章节结构" },
  { key: "drafting", label: "启动章节起草" },
] as const;

function createSignalsFromStage(stage: WorkflowStage): WorkflowSignals {
  switch (stage) {
    case "foundation":
      return {
        hasSynopsis: true,
        hasCharacters: false,
        hasOutline: false,
        chapterCount: 0,
      };
    case "outline":
      return {
        hasSynopsis: true,
        hasCharacters: true,
        hasOutline: false,
        chapterCount: 0,
      };
    case "drafting":
      return {
        hasSynopsis: true,
        hasCharacters: true,
        hasOutline: true,
        chapterCount: 1,
      };
    default:
      throw new Error(`Unsupported workflow-service stage: ${stage}`);
  }
}

function createLocalSnapshot(stage: WorkflowStage): WorkflowSnapshot {
  switch (stage) {
    case "ideation":
      return {
        stage,
        suggestedAction: "先把零散灵感沉淀成可复用的梗概素材，再进入基础设定。",
        completion: {
          synopsis: false,
          characters: false,
          outline: false,
          drafting: false,
        },
      };
    case "revision":
      return {
        stage,
        suggestedAction: "聚焦已写章节的一致性修订，优先处理角色、设定和节奏问题。",
        completion: {
          synopsis: true,
          characters: true,
          outline: true,
          drafting: true,
        },
      };
    case "export":
      return {
        stage,
        suggestedAction: "整理定稿内容和导出材料，确认章节与结构已经可以交付。",
        completion: {
          synopsis: true,
          characters: true,
          outline: true,
          drafting: true,
        },
      };
    default:
      return {
        stage,
        suggestedAction: "正在整理当前项目状态，请稍后查看下一步建议。",
        completion: {
          synopsis: false,
          characters: false,
          outline: false,
          drafting: false,
        },
      };
  }
}

export function WorkflowSidebar({ stage }: WorkflowSidebarProps) {
  const [snapshot, setSnapshot] = useState<WorkflowSnapshot>(() => createLocalSnapshot(stage));

  useEffect(() => {
    let cancelled = false;
    if (stage === "ideation" || stage === "revision" || stage === "export") {
      setSnapshot(createLocalSnapshot(stage));
      return;
    }

    const signals = createSignalsFromStage(stage);

    if (!window.inkbloom?.getWorkflowSnapshot) {
      setSnapshot(createLocalSnapshot(stage));
      return;
    }

    void window.inkbloom
      .getWorkflowSnapshot(signals)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(createLocalSnapshot(stage));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stage]);

  return (
    <aside aria-labelledby="workflow-title" style={styles.panel}>
      <header style={styles.header}>
        <p style={styles.kicker}>Workflow</p>
        <h2 id="workflow-title" style={styles.title}>
          当前阶段：{stageLabels[stage]}
        </h2>
        <p style={styles.description}>根据当前项目材料判断所处阶段，并给出最小下一步建议。</p>
      </header>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>下一步建议</h3>
        <p style={styles.cardBody}>{snapshot.suggestedAction}</p>
      </section>

      <section style={styles.card}>
        <h3 style={styles.cardTitle}>当前检查单</h3>
        <ul style={styles.list}>
          {checklist.map((item) => (
            <li key={item.key}>
              {item.label}：{snapshot.completion[item.key] ? "已完成" : "未完成"}
            </li>
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
