import { describe, it, expect } from "vitest";
import {
  formatINR,
  formatUSD,
  formatCurrency,
  formatTime,
  getInitials,
  truncateText,
  formatPercent,
  formatCompactNumber,
  formatRating,
} from "./formatters";

describe("Currency Formatters", () => {
  it("formats INR correctly", () => {
    expect(formatINR(1000)).toBe("₹1,000");
    expect(formatINR(1234567)).toBe("₹12,34,567");
  });

  it("formats USD correctly", () => {
    expect(formatUSD(99.5)).toBe("$99.50");
    expect(formatUSD(100, 0)).toBe("$100");
  });

  it("formats currency based on type", () => {
    expect(formatCurrency(500, "INR")).toBe("₹500");
    expect(formatCurrency(99.99, "USD")).toBe("$99.99");
  });
});

describe("Time Formatters", () => {
  it("formats time to HH:MM", () => {
    expect(formatTime("14:30:00")).toBe("14:30");
    expect(formatTime("09:00:00")).toBe("09:00");
  });
});

describe("String Formatters", () => {
  it("gets initials from name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Alice Bob Charlie")).toBe("AB");
    expect(getInitials("Single")).toBe("S");
  });

  it("truncates text correctly", () => {
    expect(truncateText("Hello World", 20)).toBe("Hello World");
    expect(truncateText("Hello World", 8)).toBe("Hello...");
  });

  it("formats percentages", () => {
    expect(formatPercent(50)).toBe("50.0%");
    expect(formatPercent(33.333, 2)).toBe("33.33%");
  });
});

describe("Number Formatters", () => {
  it("formats compact numbers", () => {
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(1500000)).toBe("1.5M");
    expect(formatCompactNumber(2500000000)).toBe("2.5B");
  });

  it("formats ratings", () => {
    expect(formatRating(4.5)).toBe("4.5");
    expect(formatRating(5)).toBe("5.0");
  });
});
