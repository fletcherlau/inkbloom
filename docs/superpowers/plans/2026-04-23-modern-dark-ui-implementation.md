# Modern Dark UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Inkbloom from inline warm-brown styles to a modern slate/zinc dark theme using shadcn/ui components and Tailwind CSS.

**Architecture:** Replace all inline `styles` objects with Tailwind utility classes. Introduce shadcn/ui primitives (Button, Card, Dialog, Input, Label, Select) for consistent component styling. Update CSS theme variables to a dark slate palette.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Electron Vite

---

## File Structure

### New Files (shadcn/ui components)
- `src/renderer/components/ui/button.tsx` — Button with cva variants
- `src/renderer/components/ui/card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `src/renderer/components/ui/dialog.tsx` — Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- `src/renderer/components/ui/input.tsx` — Input field
- `src/renderer/components/ui/label.tsx` — Form label
- `src/renderer/components/ui/select.tsx` — Select, SelectTrigger, SelectValue, SelectContent, SelectItem

### Modified Files (remove inline styles, use Tailwind + shadcn)
- `src/renderer/styles/globals.css` — Update CSS variables to dark slate theme
- `src/renderer/app.tsx` — Remove `styles` object, use Tailwind classes
- `src/renderer/components/home/home-screen.tsx` — Remove `styles` object, use Tailwind + Card
- `src/renderer/components/home/home-header.tsx` — Remove `styles` object, use Tailwind + Button
- `src/renderer/components/home/book-card.tsx` — Remove `styles` object, use Tailwind + Card + Button
- `src/renderer/components/home/book-grid.tsx` — Remove `styles` object, use Tailwind
- `src/renderer/components/home/book-dialog.tsx` — Remove `styles` object, use shadcn Dialog + Input + Button
- `src/renderer/components/home/delete-book-dialog.tsx` — Remove `styles` object, use shadcn Dialog + Button
- `src/renderer/components/settings/settings-screen.tsx` — Remove `styles` object, use Tailwind + shadcn components
- `src/renderer/components/layout/app-shell.tsx` — Remove `styles` object, use Tailwind

---

## Task 1: Initialize shadcn/ui and Add Base Components

**Files:**
- Create: `components.json`
- Create: `src/renderer/components/ui/button.tsx`
- Create: `src/renderer/components/ui/card.tsx`
- Create: `src/renderer/components/ui/dialog.tsx`
- Create: `src/renderer/components/ui/input.tsx`
- Create: `src/renderer/components/ui/label.tsx`
- Create: `src/renderer/components/ui/select.tsx`

- [ ] **Step 1: Create components.json**

Create `components.json` at project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/renderer/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

- [ ] **Step 2: Add button component**

Create `src/renderer/components/ui/button.tsx`:

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 3: Add card component**

Create `src/renderer/components/ui/card.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 4: Add dialog component**

Create `src/renderer/components/ui/dialog.tsx`:

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

- [ ] **Step 5: Add input component**

Create `src/renderer/components/ui/input.tsx`:

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 6: Add label component**

Create `src/renderer/components/ui/label.tsx`:

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 7: Add select component**

Create `src/renderer/components/ui/select.tsx`:

```tsx
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
```

- [ ] **Step 8: Install lucide-react**

Run:
```bash
pnpm add lucide-react
```

Expected: Package installs successfully.

- [ ] **Step 9: Commit**

```bash
git add components.json src/renderer/components/ui/
git commit -m "feat: add shadcn/ui base components"
```

---

## Task 2: Update Global Styles to Dark Theme

**Files:**
- Modify: `src/renderer/styles/globals.css`

- [ ] **Step 1: Update CSS variables to dark slate**

Replace the content of `src/renderer/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: #020617;
  --color-foreground: #e2e8f0;
  --color-card: #0f172a;
  --color-card-foreground: #e2e8f0;
  --color-popover: #0f172a;
  --color-popover-foreground: #e2e8f0;
  --color-primary: #f8fafc;
  --color-primary-foreground: #0f172a;
  --color-secondary: #1e293b;
  --color-secondary-foreground: #e2e8f0;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-accent: #1e293b;
  --color-accent-foreground: #e2e8f0;
  --color-destructive: #7f1d1d;
  --color-destructive-foreground: #fecaca;
  --color-border: #1e293b;
  --color-input: #334155;
  --color-ring: #94a3b8;
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/styles/globals.css
git commit -m "feat: update CSS variables to dark slate theme"
```

---

## Task 3: Update Home Screen Components

**Files:**
- Modify: `src/renderer/components/home/home-header.tsx`
- Modify: `src/renderer/components/home/book-card.tsx`
- Modify: `src/renderer/components/home/book-grid.tsx`
- Modify: `src/renderer/components/home/home-screen.tsx`

- [ ] **Step 1: Rewrite HomeHeader with Tailwind + Button**

Replace `src/renderer/components/home/home-header.tsx`:

```tsx
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
```

- [ ] **Step 2: Rewrite BookCard with Tailwind + Card + Button**

Replace `src/renderer/components/home/book-card.tsx`:

```tsx
import type { BookSummary } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
```

- [ ] **Step 3: Rewrite BookGrid with Tailwind**

Replace `src/renderer/components/home/book-grid.tsx`:

```tsx
import type { BookSummary } from "@shared/contracts";

import { BookCard } from "./book-card";

export function BookGrid(props: {
  books: readonly BookSummary[];
  onEnterBook: (book: BookSummary) => void;
  onOpenEditDialog: (book: BookSummary) => void;
  onOpenDeleteDialog: (book: BookSummary) => void;
}) {
  return (
    <section aria-label="book-grid" className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
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
```

- [ ] **Step 4: Rewrite HomeScreen with Tailwind + Card**

Replace `src/renderer/components/home/home-screen.tsx`:

```tsx
import type { BookSummary } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { BookDialog } from "./book-dialog";
import { BookGrid } from "./book-grid";
import { DeleteBookDialog } from "./delete-book-dialog";
import { HomeHeader } from "./home-header";

export function HomeScreen(props: {
  books: readonly BookSummary[];
  isLoading: boolean;
  isCreateDialogOpen: boolean;
  editingBook: BookSummary | null;
  deletingBook: BookSummary | null;
  onOpenCreateDialog: () => void;
  onOpenEditDialog: (book: BookSummary) => void;
  onCloseBookDialog: () => void;
  onSubmitBook: (title: string) => Promise<void>;
  onEnterBook: (book: BookSummary) => void;
  onOpenDeleteDialog: (book: BookSummary) => void;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => Promise<void>;
  onOpenSettings: () => void;
}) {
  const isBookDialogOpen = props.isCreateDialogOpen || props.editingBook !== null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative z-10 grid gap-6 p-[min(6vw,3rem)]">
        <HomeHeader
          onOpenCreateDialog={props.onOpenCreateDialog}
          onOpenSettings={props.onOpenSettings}
        />

        {props.isLoading ? (
          <p className="text-muted-foreground">正在加载书架...</p>
        ) : props.books.length === 0 ? (
          <Card className="grid gap-3 justify-items-start p-8 max-w-xl">
            <p className="text-xs text-muted-foreground tracking-[0.12em] uppercase font-medium">
              Fresh Shelf
            </p>
            <h2 className="text-2xl font-bold text-foreground">新建第一本书</h2>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              你的书架还是空的。先创建一本书，再进入创作工作区。
            </p>
            <Button onClick={props.onOpenCreateDialog}>新建书籍</Button>
          </Card>
        ) : (
          <BookGrid
            books={props.books}
            onEnterBook={props.onEnterBook}
            onOpenEditDialog={props.onOpenEditDialog}
            onOpenDeleteDialog={props.onOpenDeleteDialog}
          />
        )}
      </div>

      <BookDialog
        isOpen={isBookDialogOpen}
        book={props.editingBook}
        onClose={props.onCloseBookDialog}
        onSubmit={props.onSubmitBook}
      />
      <DeleteBookDialog
        book={props.deletingBook}
        onClose={props.onCloseDeleteDialog}
        onConfirm={props.onConfirmDelete}
      />
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/components/home/
git commit -m "feat: modernize home screen components with shadcn/ui"
```

---

## Task 4: Update Dialog Components

**Files:**
- Modify: `src/renderer/components/home/book-dialog.tsx`
- Modify: `src/renderer/components/home/delete-book-dialog.tsx`

- [ ] **Step 1: Rewrite BookDialog with shadcn Dialog**

Replace `src/renderer/components/home/book-dialog.tsx`:

```tsx
import { useEffect, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BookDialog(props: {
  isOpen: boolean;
  book: BookSummary | null;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(props.book?.title ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(props.book?.title ?? "");
    setIsSubmitting(false);
  }, [props.book, props.isOpen]);

  const heading = props.book ? "修改书籍" : "新建书籍";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await props.onSubmit(title);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-[28rem]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{heading}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="book-title">书名</Label>
              <Input
                id="book-title"
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="例如：长夜港"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={props.onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Rewrite DeleteBookDialog with shadcn Dialog**

Replace `src/renderer/components/home/delete-book-dialog.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/home/book-dialog.tsx src/renderer/components/home/delete-book-dialog.tsx
git commit -m "feat: modernize book dialogs with shadcn/ui"
```

---

## Task 5: Update Settings Screen

**Files:**
- Modify: `src/renderer/components/settings/settings-screen.tsx`

- [ ] **Step 1: Rewrite SettingsScreen with shadcn components**

Replace `src/renderer/components/settings/settings-screen.tsx`:

```tsx
import { useEffect, useState } from "react";

import type { GlobalLlmSettings, LlmConnectionTestResult } from "@shared/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const backendOptions = [
  { value: "openai-compatible", label: "OpenAI-Compatible HTTP", description: "适合 Moonshot / OpenAI 兼容网关 / 其他 REST 模型接口。" },
  { value: "anthropic-compatible", label: "Anthropic-Compatible HTTP", description: "适合 Kimi Code 的 Anthropic Messages 协议接入。" },
  { value: "kimi-cli", label: "Kimi CLI ACP", description: "通过本机 `kimi acp` 连接 Kimi Code CLI。" },
] as const;

const DEFAULT_KIMI_MODEL = "kimi-for-coding";
const DEFAULT_KIMI_BASE_URL = "https://api.kimi.com/coding/v1";
const DEFAULT_ANTHROPIC_BASE_URL = "https://api.kimi.com/coding/";

export function SettingsScreen(props: {
  settings: GlobalLlmSettings;
  isSaving: boolean;
  onSave: (settings: GlobalLlmSettings) => Promise<void>;
  onTestConnection: (settings: GlobalLlmSettings) => Promise<LlmConnectionTestResult>;
  onGoHome: () => void;
}) {
  const [draft, setDraft] = useState<GlobalLlmSettings>(props.settings);
  const [notice, setNotice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<LlmConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const isKimiCliMode = draft.provider.trim() === "kimi-cli";
  const isAnthropicMode = draft.provider.trim() === "anthropic-compatible";

  useEffect(() => {
    setDraft(props.settings);
  }, [props.settings]);

  function normalizeDraftSettings() {
    if (isKimiCliMode) {
      return { ...draft, model: draft.model.trim() || DEFAULT_KIMI_MODEL, baseUrl: draft.baseUrl.trim() || DEFAULT_KIMI_BASE_URL };
    }
    if (isAnthropicMode) {
      return { ...draft, model: draft.model.trim() || DEFAULT_KIMI_MODEL, baseUrl: draft.baseUrl.trim() || DEFAULT_ANTHROPIC_BASE_URL };
    }
    return draft;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTestResult(null);
    const normalizedDraft = normalizeDraftSettings();
    try {
      await props.onSave(normalizedDraft);
      setDraft(normalizedDraft);
      setNotice("已保存 AI 后端设置。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setNotice(`保存失败：${message}`);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setNotice(null);
    setTestResult(null);
    const normalizedDraft = normalizeDraftSettings();
    try {
      const result = await props.onTestConnection(normalizedDraft);
      setDraft(normalizedDraft);
      setTestResult(result);
      if (!result.ok) setNotice("测试连接失败，请检查当前后端配置。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setTestResult({
        ok: false, status: null,
        endpoint: isKimiCliMode ? "kimi acp" : isAnthropicMode ? `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/v1/messages` : `${normalizedDraft.baseUrl || "(未填写 Base URL)"}/chat/completions`,
        protocol: isKimiCliMode ? "kimi-cli-acp" : isAnthropicMode ? "anthropic-messages" : "openai-chat-completions",
        message: `测试连接失败：${message}`,
      });
      setNotice("测试连接失败，请检查当前后端配置。");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground tracking-[0.12em] uppercase font-medium">AI Backend</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">AI 后端设置</h1>
            <p className="mt-1 text-muted-foreground">选择要调用的 AI 后端，再填写对应配置。</p>
          </div>
          <Button variant="outline" onClick={props.onGoHome}>返回首页</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isKimiCliMode ? "当前模式会调用本机 Kimi CLI ACP server；测试连接会走 `kimi acp` 会话，而不是直接请求 HTTP 接口。"
              : isAnthropicMode ? "当前测试按 Anthropic Messages `POST /v1/messages` 规范发起请求。"
              : "当前测试按 OpenAI-compatible `POST /chat/completions` 规范发起请求。"}
          </p>

          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>AI 后端</Label>
              <Select
                value={draft.provider}
                onValueChange={(value) => {
                  setDraft({ ...draft, provider: value });
                  setNotice(null);
                  setTestResult(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择后端" />
                </SelectTrigger>
                <SelectContent>
                  {backendOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {backendOptions.find((option) => option.value === draft.provider)?.description ?? "选择后端后，这里会显示对应配置项。"}
              </p>
            </div>

            {isKimiCliMode ? (
              <>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="默认 kimi-for-coding" value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input placeholder="可留空，默认使用 https://api.kimi.com/coding/v1" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            ) : isAnthropicMode ? (
              <>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input placeholder="可留空，默认使用 https://api.kimi.com/coding/" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="默认 kimi-for-coding" value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input placeholder="例如 https://api.moonshot.cn/v1" value={draft.baseUrl} onChange={(e) => { setDraft({ ...draft, baseUrl: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" value={draft.apiKey} onChange={(e) => { setDraft({ ...draft, apiKey: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={draft.model} onChange={(e) => { setDraft({ ...draft, model: e.target.value }); setNotice(null); setTestResult(null); }} />
                </div>
              </>
            )}
          </Card>

          {testResult && (
            <Card className={`p-4 ${testResult.ok ? "bg-green-950/30 border-green-900" : "bg-red-950/30 border-red-900"}`}>
              <p className={`font-bold ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                {testResult.ok ? "连接成功" : "连接失败"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: {testResult.endpoint}{testResult.status === null ? "" : ` | HTTP ${testResult.status}`}
              </p>
            </Card>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{notice ?? "保存后会停留在当前页面，你可以继续修改或返回首页。"}</p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => void handleTestConnection()} disabled={isTesting}>
                {isTesting ? "测试中..." : "测试连接"}
              </Button>
              <Button type="submit" disabled={props.isSaving}>
                {props.isSaving ? "保存中..." : "保存设置"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/components/settings/settings-screen.tsx
git commit -m "feat: modernize settings screen with shadcn/ui"
```

---

## Task 6: Update App Shell and App Root

**Files:**
- Modify: `src/renderer/components/layout/app-shell.tsx`
- Modify: `src/renderer/app.tsx`

- [ ] **Step 1: Rewrite AppShell with Tailwind**

Replace `src/renderer/components/layout/app-shell.tsx`:

```tsx
import { appStore } from "../../stores/app-store";
import { useAppStore } from "../../stores/app-store";
import { ChapterPanel } from "../chapters/chapter-panel";
import { StoryBiblePanel } from "../bible/story-bible-panel";
import { ChatPanel } from "../chat/chat-panel";
import { WorkflowSidebar } from "../workflow/workflow-sidebar";
import { useWorkspaceStore, workspaceStore } from "../../stores/workspace-store";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const projectId = useWorkspaceStore((state) => state.projectId);
  const projectName = useWorkspaceStore((state) => state.projectName);
  const workflowStage = useWorkspaceStore((state) => state.workflowStage);
  const selectedBibleType = useWorkspaceStore((state) => state.selectedBibleType);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const draftMessage = useWorkspaceStore((state) => state.draftMessage);
  const messages = useWorkspaceStore((state) => state.messages);
  const llmSettings = useAppStore((state) => state.llmSettings);
  const isBackendConfigured = Boolean(llmSettings.provider && llmSettings.apiKey);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <h1 className="sr-only">Inkbloom</h1>
      <div className="grid grid-cols-[280px_1fr_320px] min-h-screen">
        <StoryBiblePanel
          projectName={projectName}
          selectedType={selectedBibleType}
          onSelectType={workspaceStore.setSelectedBibleType}
        />
        <section aria-label="chat-column" className="grid grid-rows-[auto_1fr_auto] gap-4 p-7 min-w-0">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase">当前作品</p>
              <h2 className="text-xl font-semibold text-foreground">{projectName}</h2>
            </div>
            <Button variant="outline" onClick={appStore.goHome}>返回首页</Button>
          </header>
          {!isBackendConfigured && (
            <p className="p-3 rounded-lg bg-amber-950/30 text-amber-400 text-sm">
              AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。
            </p>
          )}
          <p className="text-muted-foreground mb-1">打开作品或创建新项目以开始创作。</p>
          <ChatPanel
            messages={messages}
            projectId={projectId}
            draftMessage={draftMessage}
            selectedMode={selectedMode}
            onDraftChange={workspaceStore.setDraftMessage}
            onModeChange={workspaceStore.setSelectedMode}
            onSend={workspaceStore.sendMessage}
          />
          <ChapterPanel
            title="第一章草稿"
            relativeManuscriptPath="volume-01/chapter-001.md"
            initialContent="# 第一章\n\n在这里继续起草本章正文。"
          />
        </section>
        <WorkflowSidebar stage={workflowStage} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Rewrite App.tsx**

Replace `src/renderer/app.tsx`:

```tsx
import { useEffect } from "react";

import { HomeScreen } from "./components/home/home-screen";
import { AppShell } from "./components/layout/app-shell";
import { SettingsScreen } from "./components/settings/settings-screen";
import { appStore, useAppStore } from "./stores/app-store";

export function App() {
  const view = useAppStore((state) => state.view);
  const books = useAppStore((state) => state.books);
  const isLoading = useAppStore((state) => state.isLoading);
  const llmSettings = useAppStore((state) => state.llmSettings);
  const isSavingSettings = useAppStore((state) => state.isSavingSettings);
  const isBookDialogOpen = useAppStore((state) => state.isBookDialogOpen);
  const editingBookId = useAppStore((state) => state.editingBookId);
  const deletingBookId = useAppStore((state) => state.deletingBookId);

  useEffect(() => {
    void appStore.bootstrap();
  }, []);

  const editingBook = books.find((book) => book.id === editingBookId) ?? null;
  const deletingBook = books.find((book) => book.id === deletingBookId) ?? null;
  const isBackendConfigured = Boolean(llmSettings.provider && llmSettings.apiKey);

  if (view === "settings") {
    return (
      <SettingsScreen
        settings={llmSettings}
        isSaving={isSavingSettings}
        onSave={appStore.saveGlobalLlmSettings}
        onTestConnection={appStore.testGlobalLlmConnection}
        onGoHome={appStore.goHome}
      />
    );
  }

  if (view === "workspace") {
    return <AppShell />;
  }

  return (
    <>
      {!isBackendConfigured && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <p className="p-4 rounded-lg bg-amber-950/30 text-amber-400 text-sm shadow-lg">
            AI 功能暂不可用，先到 AI 后端设置选择后端并补齐所需配置。
          </p>
        </div>
      )}
      <HomeScreen
        books={books}
        isLoading={isLoading}
        isCreateDialogOpen={isBookDialogOpen && editingBook === null}
        editingBook={editingBook}
        deletingBook={deletingBook}
        onOpenCreateDialog={appStore.openCreateDialog}
        onOpenEditDialog={appStore.openEditDialog}
        onCloseBookDialog={appStore.closeBookDialog}
        onSubmitBook={(title) =>
          editingBook ? appStore.updateBook({ id: editingBook.id, title }) : appStore.createBook(title)
        }
        onEnterBook={appStore.enterBook}
        onOpenDeleteDialog={appStore.openDeleteDialog}
        onCloseDeleteDialog={appStore.closeDeleteDialog}
        onConfirmDelete={() => (deletingBook ? appStore.deleteBook(deletingBook.id) : Promise.resolve())}
        onOpenSettings={appStore.openSettings}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/layout/app-shell.tsx src/renderer/app.tsx
git commit -m "feat: modernize app shell and root with shadcn/ui"
```

---

## Task 7: Verify Build

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm lint
```

Expected: No type errors.

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All tests pass. Note: existing tests check component rendering and behavior, not styles.

- [ ] **Step 3: Build check**

```bash
pnpm build
```

Expected: Build completes without errors.

- [ ] **Step 4: Final commit if needed**

If any test fixes were required:
```bash
git commit -m "fix: update tests for modernized UI"
```

---

## Self-Review

**Spec coverage:** All sections of the design spec are covered — CSS variables, component mapping, and all affected files have corresponding tasks.

**Placeholder scan:** No placeholders found. All component code is complete.

**Type consistency:** All shadcn components use consistent types. Event handlers and props match existing interfaces.
