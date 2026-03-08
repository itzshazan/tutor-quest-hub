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
    render(<PasswordStrengthIndicator password="Abcd1234!" />);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows strong strength for complex passwords", () => {
    render(<PasswordStrengthIndicator password="MyStr0ng!Pass#2024" />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("displays requirement checklist", () => {
    render(<PasswordStrengthIndicator password="Test123!" />);
    expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
    expect(screen.getByText(/lowercase/i)).toBeInTheDocument();
    expect(screen.getByText(/number/i)).toBeInTheDocument();
    expect(screen.getByText(/special character/i)).toBeInTheDocument();
  });

  it("shows checkmark for met requirements", () => {
    render(<PasswordStrengthIndicator password="Password1!" />);
    // Password1! meets: length, uppercase, lowercase, number, special
    const checks = screen.getAllByTestId("requirement-met");
    expect(checks.length).toBeGreaterThan(0);
  });
});
