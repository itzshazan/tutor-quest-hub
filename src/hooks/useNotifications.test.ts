import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

// Mock AuthContext
const mockUser = { id: "user-1", email: "test@test.com" };

type MockNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type MockConversation = {
  id: string;
  student_id: string;
  tutor_id: string;
};

type MockMessage = {
  conversation_id: string;
  content: string;
  created_at: string;
  sender_id: string;
  read_at: string | null;
};

type MockSession = {
  id: string;
  student_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  created_at: string;
  tutor_id: string;
  status: string;
};

type MockProfile = {
  user_id: string;
  full_name: string;
};

const mockDb: {
  notifications: MockNotification[];
  conversations: MockConversation[];
  messages: MockMessage[];
  sessions: MockSession[];
  profiles: MockProfile[];
} = {
  notifications: [],
  conversations: [],
  messages: [],
  sessions: [],
  profiles: [],
};

const getTableData = (table: string) => {
  switch (table) {
    case "notifications":
      return mockDb.notifications;
    case "conversations":
      return mockDb.conversations;
    case "messages":
      return mockDb.messages;
    case "sessions":
      return mockDb.sessions;
    case "profiles":
      return mockDb.profiles;
    default:
      return [];
  }
};

const createTableBuilder = (table: string) => {
  const builder: any = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    in: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve({ data: getTableData(table), error: null }).then(resolve, reject),
    catch: (reject: (reason: unknown) => unknown) => builder.then(undefined, reject),
    finally: (handler: () => void) =>
      builder.then(
        (value: unknown) => {
          handler();
          return value;
        },
        (error: unknown) => {
          handler();
          throw error;
        }
      ),
  };

  return builder;
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: mockUser, loading: false })),
}));

// Mock supabase
const channelMock = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => createTableBuilder(table)),
    channel: vi.fn(() => channelMock),
    removeChannel: vi.fn(),
  },
}));

// Import after mocking
import { useNotifications } from "./useNotifications";
import { useAuth } from "@/contexts/AuthContext";

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.notifications = [
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
    ];
    mockDb.conversations = [];
    mockDb.messages = [];
    mockDb.sessions = [];
    mockDb.profiles = [];

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

  it("derives notifications from unread messages and pending requests", async () => {
    mockDb.notifications = [];
    mockDb.conversations = [
      {
        id: "convo-1",
        student_id: "user-1",
        tutor_id: "user-2",
      },
    ];
    mockDb.messages = [
      {
        conversation_id: "convo-1",
        content: "Hey, are we still on for class tomorrow?",
        created_at: "2026-04-26T10:00:00Z",
        sender_id: "user-2",
        read_at: null,
      },
    ];
    mockDb.sessions = [
      {
        id: "session-1",
        student_id: "user-3",
        subject: "Mathematics",
        session_date: "2026-04-27",
        start_time: "09:00:00",
        created_at: "2026-04-26T09:00:00Z",
        tutor_id: "user-1",
        status: "pending",
      },
    ];
    mockDb.profiles = [
      { user_id: "user-2", full_name: "Shazaan" },
      { user_id: "user-3", full_name: "Alex" },
    ];

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
    expect(result.current.notifications.some((n) => n.type === "message")).toBe(true);
    expect(result.current.notifications.some((n) => n.title === "New Session Request")).toBe(true);
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
