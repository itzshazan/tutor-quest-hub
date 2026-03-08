import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base active");
  });

  it("handles falsy conditional classes", () => {
    const isActive = false;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base");
  });

  it("deduplicates conflicting tailwind classes", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("handles arrays of classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null, "other");
    expect(result).toBe("base other");
  });
});
