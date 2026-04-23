# Modern Dark UI Design Spec

## Overview

将 Inkbloom Electron 应用从当前的温暖棕褐色内联样式，全面升级为现代暗色中性主题，使用 shadcn/ui 组件库和 Tailwind CSS。

## Color System (Slate/Zinc Dark)

基于 slate 色阶的纯暗色主题，不引入额外强调色，所有交互通过灰度层次区分。

| Token | Value | Usage |
|-------|-------|-------|
| background | `#020617` | 页面背景 |
| foreground | `#e2e8f0` | 正文文字 |
| card | `#0f172a` | 卡片/面板背景 |
| card-foreground | `#e2e8f0` | 卡片内文字 |
| primary | `#f8fafc` | Primary 按钮背景 |
| primary-foreground | `#0f172a` | Primary 按钮文字 |
| secondary | `#1e293b` | Secondary 按钮背景 |
| muted | `#1e293b` | 次要面板 |
| muted-foreground | `#94a3b8` | 次要/提示文字 |
| border | `#1e293b` | 边框 |
| input | `#334155` | 输入框边框 |
| ring | `#94a3b8` | 焦点环 |
| destructive | `#7f1d1d` | 危险操作背景 |
| destructive-foreground | `#fecaca` | 危险操作文字 |

## Border Radius

统一使用 `0.5rem`（8px）圆角，保持现代感。

## Component Mapping

### Button Variants
- **default**: `bg-slate-50 text-slate-950`
- **outline**: `border-slate-700 bg-transparent text-slate-200`
- **ghost**: `bg-transparent text-slate-200`
- **destructive**: `bg-red-900 text-red-200`

### shadcn/ui Components to Add
- `button` - 所有按钮
- `card` - 书籍卡片、面板
- `dialog` - 新建/编辑书籍、删除确认
- `input` - 表单输入
- `label` - 表单标签
- `select` - AI 后端选择
- `separator` - 分隔线
- `scroll-area` - 滚动区域

## Files to Modify

### Global Styles
- `src/renderer/styles/globals.css` - 更新 CSS 变量为暗色主题

### Components (remove inline styles, use Tailwind + shadcn)
- `src/renderer/app.tsx`
- `src/renderer/components/home/home-screen.tsx`
- `src/renderer/components/home/home-header.tsx`
- `src/renderer/components/home/book-card.tsx`
- `src/renderer/components/home/book-grid.tsx`
- `src/renderer/components/home/book-dialog.tsx`
- `src/renderer/components/home/delete-book-dialog.tsx`
- `src/renderer/components/settings/settings-screen.tsx`
- `src/renderer/components/layout/app-shell.tsx`

### New Files
- `src/renderer/components/ui/button.tsx`
- `src/renderer/components/ui/card.tsx`
- `src/renderer/components/ui/dialog.tsx`
- `src/renderer/components/ui/input.tsx`
- `src/renderer/components/ui/label.tsx`
- `src/renderer/components/ui/select.tsx`

## Dependencies

Already installed: `tailwindcss`, `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, Radix UI primitives.

Need: Initialize shadcn/ui CLI configuration (`components.json`).
