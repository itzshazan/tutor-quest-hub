import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import SignUp from "./SignUp";
import { supabase } from "@/integrations/supabase/client";

const renderSignUp = () => {
  return render(
    <BrowserRouter>
      <SignUp />
    </BrowserRouter>
  );
};

describe("SignUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup form", () => {
    renderSignUp();
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders role selection toggle", () => {
    renderSignUp();
    // Check for description and both role buttons
    expect(screen.getByText(/join as a student or tutor/i)).toBeInTheDocument();
    // Use getAllByRole and check that there are student/tutor buttons
    const buttons = screen.getAllByRole("button");
    const studentButtons = buttons.filter(b => b.textContent?.toLowerCase().includes("student"));
    const tutorButtons = buttons.filter(b => b.textContent?.toLowerCase().includes("tutor"));
    expect(studentButtons.length).toBeGreaterThanOrEqual(1);
    expect(tutorButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Google sign up button", () => {
    renderSignUp();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    renderSignUp();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("shows Tutor Quest brand", () => {
    renderSignUp();
    expect(screen.getByText(/tutor quest/i)).toBeInTheDocument();
  });

  it("renders password field", () => {
    renderSignUp();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it("calls signUp on valid submission", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    } as any);

    renderSignUp();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "john@example.com" },
    });
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: { value: "StrongPass123!" },
    });

    const submitButton = screen.getByRole("button", { name: /sign up as/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });
  });

  it("renders phone number field", () => {
    renderSignUp();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });
});
