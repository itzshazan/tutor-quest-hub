import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock supabase before importing the hook
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
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "user-1" } },
          error: null,
        })
      ),
    },
  },
}));

// Import after mocking
import { useNotifications } from "./useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial loading state", () => {
    const { result } = renderHook(() => useNotifications("user-1"));
    expect(result.current.loading).toBe(true);
  });

  it("loads notifications for a user", async () => {
    const { result } = renderHook(() => useNotifications("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
  });

  it("calculates unread count correctly", async () => {
    const { result } = renderHook(() => useNotifications("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // One notification has read_at: null
    expect(result.current.unreadCount).toBe(1);
  });

  it("returns empty state when no userId provided", async () => {
    const { result } = renderHook(() => useNotifications(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("provides markAsRead function", async () => {
    const { result } = renderHook(() => useNotifications("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.markAsRead).toBe("function");
  });

  it("provides markAllAsRead function", async () => {
    const { result } = renderHook(() => useNotifications("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.markAllAsRead).toBe("function");
  });
});
