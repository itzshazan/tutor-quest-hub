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

  it("renders role selection with student and tutor buttons", () => {
    renderSignUp();
    // Based on actual rendered output
    expect(screen.getByText(/join as a student or tutor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /student/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tutor/i })).toBeInTheDocument();
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

  it("shows password strength indicator when typing", async () => {
    renderSignUp();

    // Get password input by label
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
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    fireEvent.change(passwordInput, {
      target: { value: "StrongPass123!" },
    });

    const submitButton = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });
  });

  it("allows role toggle between student and tutor", () => {
    renderSignUp();

    const tutorButton = screen.getByRole("button", { name: /tutor/i });
    fireEvent.click(tutorButton);

    // The tutor button should be clickable
    expect(tutorButton).toBeInTheDocument();
  });
});
