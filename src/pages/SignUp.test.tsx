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

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
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
import { toast } from "sonner";

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
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders role selection", () => {
    renderSignUp();
    expect(screen.getByText(/i am a/i)).toBeInTheDocument();
    expect(screen.getByText(/student/i)).toBeInTheDocument();
    expect(screen.getByText(/tutor/i)).toBeInTheDocument();
  });

  it("renders Google sign up button", () => {
    renderSignUp();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    renderSignUp();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("shows password strength indicator when typing", async () => {
    renderSignUp();

    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, { target: { value: "Test123!" } });

    await waitFor(() => {
      // Password strength indicator should appear
      expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    });
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
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "StrongPass123!" },
    });

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });
  });

  it("shows error toast on signup failure", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email already registered" },
    } as any);

    renderSignUp();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "StrongPass123!" },
    });

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("allows role toggle between student and tutor", () => {
    renderSignUp();

    const tutorButton = screen.getByText(/tutor/i);
    fireEvent.click(tutorButton);

    // The tutor option should now be selected
    expect(tutorButton.closest("button")).toHaveAttribute("data-state", "on");
  });
});
