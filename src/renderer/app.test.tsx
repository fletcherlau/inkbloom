// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./app";

describe("App", () => {
  it("renders the empty workspace shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Inkbloom" })).toBeInTheDocument();
    expect(screen.getByText("打开作品或创建新项目以开始创作。")).toBeInTheDocument();
  });
});
