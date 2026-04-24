import type { BookSummary } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;
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
    <Card className="flex flex-col gap-4 p-5">
      <div
        className="w-full min-h-[8rem] rounded-lg bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          最近更新 {formatUpdatedAt(book.updatedAt)}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{book.title}</h2>
        <p className="text-sm text-muted-foreground break-all">{book.rootPath}</p>
      </div>
      <div className="flex gap-2 flex-wrap mt-auto">
        <Button size="sm" onClick={() => props.onEnter(book)}>
          进入创作
        </Button>
        <Button size="sm" variant="outline" onClick={() => props.onEdit(book)}>
          修改
        </Button>
        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => props.onDelete(book)}>
          删除
        </Button>
      </div>
    </Card>
  );
}
