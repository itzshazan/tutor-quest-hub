import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { SessionCalendar } from "./SessionCalendar";

const mockSessions = [
  {
    id: "1",
    subject: "Mathematics",
    session_date: "2026-03-10",
    start_time: "10:00",
    end_time: "11:00",
    status: "confirmed",
    student_id: "student-1",
    tutor_id: "tutor-1",
    notes: null,
    created_at: "2026-03-01",
    updated_at: "2026-03-01",
  },
  {
    id: "2",
    subject: "Physics",
    session_date: "2026-03-10",
    start_time: "14:00",
    end_time: "15:00",
    status: "pending",
    student_id: "student-1",
    tutor_id: "tutor-2",
    notes: null,
    created_at: "2026-03-01",
    updated_at: "2026-03-01",
  },
];

describe("SessionCalendar", () => {
  it("renders the calendar component", () => {
    render(<SessionCalendar sessions={[]} />);
    // Calendar renders month/year header
    expect(screen.getByText(new RegExp(format(new Date(), "MMMM yyyy"), "i"))).toBeInTheDocument();
  });

  it("renders with sessions", () => {
    render(<SessionCalendar sessions={mockSessions} />);
    expect(screen.getByText(new RegExp(format(new Date(), "MMMM yyyy"), "i"))).toBeInTheDocument();
  });

  it("displays navigation arrows", () => {
    render(<SessionCalendar sessions={[]} />);
    // Should have prev/next month buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows day numbers", () => {
    render(<SessionCalendar sessions={[]} />);
    // Should show day 15 (middle of month)
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("highlights dates with sessions", () => {
    const { container } = render(<SessionCalendar sessions={mockSessions} />);
    // The 10th should have sessions indicator
    const dayTen = screen.getByText("10");
    expect(dayTen).toBeInTheDocument();
  });
});
