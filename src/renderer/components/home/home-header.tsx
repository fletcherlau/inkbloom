import { Button } from "@/components/ui/button";

export function HomeHeader(props: {
  onOpenCreateDialog: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <p className="text-xs text-muted-foreground tracking-[0.12em] uppercase font-medium">
          Book Studio
        </p>
        <h1 className="mt-1 text-[clamp(2.4rem,5vw,4rem)] leading-none font-bold text-foreground">
          Inkbloom
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          先整理书架，再进入你的写作工作区。
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={props.onOpenSettings}>
          设置
        </Button>
        <Button onClick={props.onOpenCreateDialog}>新建书籍</Button>
      </div>
    </header>
  );
}
