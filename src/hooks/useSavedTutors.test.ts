import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "saved_tutors") {
        return {
          select: mockSelect,
          delete: mockDelete,
          insert: mockInsert,
        };
      }
      return {};
    }),
  },
}));

import { useSavedTutors } from "./useSavedTutors";

describe("useSavedTutors", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({
      eq: vi.fn(() =>
        Promise.resolve({
          data: [{ tutor_id: "tutor-1" }, { tutor_id: "tutor-2" }],
          error: null,
        })
      ),
    });

    mockDelete.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    });

    mockInsert.mockReturnValue(Promise.resolve({ error: null }));
  });

  it("returns loading true initially", () => {
    const { result } = renderHook(() => useSavedTutors("user-1"));
    expect(result.current.loading).toBe(true);
  });

  it("loads saved tutor IDs", async () => {
    const { result } = renderHook(() => useSavedTutors("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.savedIds.has("tutor-1")).toBe(true);
    expect(result.current.savedIds.has("tutor-2")).toBe(true);
  });

  it("returns empty set when no userId", async () => {
    const { result } = renderHook(() => useSavedTutors(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.savedIds.size).toBe(0);
  });

  it("provides toggle function", async () => {
    const { result } = renderHook(() => useSavedTutors("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.toggle).toBe("function");
  });

  it("toggle removes saved tutor optimistically", async () => {
    const { result } = renderHook(() => useSavedTutors("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // tutor-1 is initially saved
    expect(result.current.savedIds.has("tutor-1")).toBe(true);

    await act(async () => {
      await result.current.toggle("tutor-1");
    });

    // Should be removed optimistically
    expect(result.current.savedIds.has("tutor-1")).toBe(false);
  });

  it("toggle adds unsaved tutor optimistically", async () => {
    const { result } = renderHook(() => useSavedTutors("user-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // tutor-3 is not saved
    expect(result.current.savedIds.has("tutor-3")).toBe(false);

    await act(async () => {
      await result.current.toggle("tutor-3");
    });

    // Should be added optimistically
    expect(result.current.savedIds.has("tutor-3")).toBe(true);
  });
});
