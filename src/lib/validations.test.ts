import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  validateDocumentFile,
  validateImageFile,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
  MAX_AVATAR_SIZE,
} from "./validations";

describe("phoneSchema", () => {
  it("accepts valid international phone numbers", () => {
    const validNumbers = [
      "+1234567890",
      "+919876543210",
      "+44 20 7946 0958",
      "+1 555-123-4567",
    ];
    validNumbers.forEach((num) => {
      expect(phoneSchema.safeParse(num).success).toBe(true);
    });
  });

  it("accepts empty string (optional)", () => {
    expect(phoneSchema.safeParse("").success).toBe(true);
  });

  it("accepts undefined (optional)", () => {
    expect(phoneSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    const invalidNumbers = [
      "abc123",
      "+1", // too short
      "phone number",
    ];
    invalidNumbers.forEach((num) => {
      expect(phoneSchema.safeParse(num).success).toBe(false);
    });
  });
});

describe("validateDocumentFile", () => {
  it("accepts valid document types", () => {
    const validFiles = [
      new File(["test"], "doc.pdf", { type: "application/pdf" }),
      new File(["test"], "image.jpg", { type: "image/jpeg" }),
      new File(["test"], "image.png", { type: "image/png" }),
    ];
    validFiles.forEach((file) => {
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(true);
    });
  });

  it("rejects invalid document types", () => {
    const invalidFiles = [
      new File(["test"], "script.exe", { type: "application/x-msdownload" }),
      new File(["test"], "data.csv", { type: "text/csv" }),
      new File(["test"], "doc.txt", { type: "text/plain" }),
    ];
    invalidFiles.forEach((file) => {
      const result = validateDocumentFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe("validateImageFile", () => {
  it("accepts valid image types", () => {
    const validFiles = [
      new File(["test"], "image.jpg", { type: "image/jpeg" }),
      new File(["test"], "image.png", { type: "image/png" }),
      new File(["test"], "image.webp", { type: "image/webp" }),
      new File(["test"], "image.gif", { type: "image/gif" }),
    ];
    validFiles.forEach((file) => {
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  it("rejects oversized files", () => {
    const largeFile = {
      name: "large.jpg",
      size: MAX_AVATAR_SIZE + 1,
      type: "image/jpeg",
    } as File;
    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("accepts files at the limit", () => {
    const exactFile = {
      name: "exact.jpg",
      size: MAX_AVATAR_SIZE,
      type: "image/jpeg",
    } as File;
    const result = validateImageFile(exactFile);
    expect(result.valid).toBe(true);
  });
});
