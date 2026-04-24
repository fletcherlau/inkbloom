import type { BookSummary } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteBookDialog(props: {
  book: BookSummary | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!props.book) return null;

  return (
    <Dialog open={!!props.book} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>删除书籍</DialogTitle>
          <DialogDescription>
            将删除《{props.book.title}》的本地目录与书架记录。这个操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            取消
          </Button>
          <Button variant="destructive" onClick={() => void props.onConfirm()}>
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
