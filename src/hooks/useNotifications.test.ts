import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

// Mock AuthContext
const mockUser = { id: "user-1", email: "test@test.com" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: mockUser, loading: false })),
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "notif-1",
                    user_id: "user-1",
                    title: "New Session",
                    message: "You have a new session request",
                    type: "session",
                    link: "/sessions",
                    read_at: null,
                    created_at: "2026-03-08T10:00:00Z",
                  },
                  {
                    id: "notif-2",
                    user_id: "user-1",
                    title: "Payment Received",
                    message: "Payment of $50 received",
                    type: "payment",
                    link: "/earnings",
                    read_at: "2026-03-07T10:00:00Z",
                    created_at: "2026-03-07T09:00:00Z",
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => Promise.resolve({ error: null })),
        })),
        match: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

// Import after mocking
import { useNotifications } from "./useNotifications";
import { useAuth } from "@/contexts/AuthContext";

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ 
      user: mockUser, 
      loading: false, 
      session: null, 
      signOut: vi.fn() 
    } as any);
  });

  it("returns initial loading state", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.loading).toBe(true);
  });

  it("loads notifications for a user", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
  });

  it("calculates unread count correctly", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // One notification has read_at: null
    expect(result.current.unreadCount).toBe(1);
  });

  it("returns empty state when no user", async () => {
    vi.mocked(useAuth).mockReturnValue({ 
      user: null, 
      loading: false, 
      session: null, 
      signOut: vi.fn() 
    } as any);

    const { result } = renderHook(() => useNotifications());

    // Should not load because no user
    expect(result.current.notifications).toHaveLength(0);
  });

  it("provides markAsRead function", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.markAsRead).toBe("function");
  });

  it("provides markAllAsRead function", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.markAllAsRead).toBe("function");
  });

  it("provides refresh function", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe("function");
  });
});
