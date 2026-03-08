import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

describe("PasswordStrengthIndicator", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows weak strength for short passwords", () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("shows fair strength for medium passwords", () => {
    render(<PasswordStrengthIndicator password="abcd1234" />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows good strength for longer mixed passwords", () => {
    render(<PasswordStrengthIndicator password="Abcd1234" />);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows strong strength for complex passwords", () => {
    render(<PasswordStrengthIndicator password="MyStr0ng!Pass#2024" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("displays feedback for weak passwords", () => {
    render(<PasswordStrengthIndicator password="abc" />);
    // Should show improvement tips
    expect(screen.getByText(/Use at least 8 characters/i)).toBeInTheDocument();
  });

  it("hides feedback for strong passwords", () => {
    render(<PasswordStrengthIndicator password="MyStr0ng!Pass#2024" />);
    // Should not show tips for strong passwords
    expect(screen.queryByText(/Use at least/i)).not.toBeInTheDocument();
  });

  it("renders strength bar segments", () => {
    const { container } = render(<PasswordStrengthIndicator password="Test123!" />);
    // Should have 4 bar segments
    const bars = container.querySelectorAll(".rounded-full");
    expect(bars.length).toBe(4);
  });
});
