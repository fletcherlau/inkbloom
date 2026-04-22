export const chapterEditorPlaceholder = "在这里起草本章内容，后续再接入完整编辑器。";

export function createMinimalTiptapConfig() {
  return {
    placeholder: chapterEditorPlaceholder,
    extensions: [],
  };
}
