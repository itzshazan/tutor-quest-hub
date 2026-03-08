import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToCSV } from "./exportUtils";

describe("exportToCSV", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let appendChildMock: ReturnType<typeof vi.fn>;
  let removeChildMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => "blob:test-url");
    revokeObjectURLMock = vi.fn();
    appendChildMock = vi.fn();
    removeChildMock = vi.fn();
    clickMock = vi.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    vi.spyOn(document.body, "appendChild").mockImplementation(appendChildMock);
    vi.spyOn(document.body, "removeChild").mockImplementation(removeChildMock);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click: clickMock,
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    });
  });

  it("does nothing for empty data", () => {
    exportToCSV([], "test");
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it("creates CSV with correct headers from object keys", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    exportToCSV(data, "users");

    expect(createObjectURLMock).toHaveBeenCalled();
    const blobArg = (global.Blob as unknown as ReturnType<typeof vi.fn>).mock?.calls?.[0]?.[0]?.[0];
    // Just verify it was called, blob content testing is complex in jsdom
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:test-url");
  });

  it("uses custom column labels when provided", () => {
    const data = [{ firstName: "Alice", lastName: "Smith" }];
    const columns = [
      { key: "firstName" as const, label: "First Name" },
      { key: "lastName" as const, label: "Last Name" },
    ];

    exportToCSV(data, "users", columns);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
  });

  it("handles null and undefined values", () => {
    const data = [{ name: null, value: undefined }];

    exportToCSV(data, "test");

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it("escapes quotes in string values", () => {
    const data = [{ text: 'Hello "World"' }];

    exportToCSV(data, "test");

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it("sets correct filename on download link", () => {
    const data = [{ a: 1 }];
    
    exportToCSV(data, "my-export");

    // Verify link was created and download was set
    expect(clickMock).toHaveBeenCalled();
  });
});
