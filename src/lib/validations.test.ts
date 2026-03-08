import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  validateFileType,
  validateFileSize,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
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

  it("rejects invalid phone numbers", () => {
    const invalidNumbers = [
      "1234567890", // missing +
      "abc123",
      "+1",
      "phone number",
    ];
    invalidNumbers.forEach((num) => {
      expect(phoneSchema.safeParse(num).success).toBe(false);
    });
  });
});

describe("validateFileType", () => {
  it("accepts valid document types", () => {
    const validFiles = [
      new File(["test"], "doc.pdf", { type: "application/pdf" }),
      new File(["test"], "image.jpg", { type: "image/jpeg" }),
      new File(["test"], "image.png", { type: "image/png" }),
    ];
    validFiles.forEach((file) => {
      const result = validateFileType(file, ALLOWED_DOCUMENT_TYPES);
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
      const result = validateFileType(file, ALLOWED_DOCUMENT_TYPES);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe("validateFileSize", () => {
  it("accepts files under size limit", () => {
    const smallFile = new File(["x".repeat(1000)], "small.pdf", {
      type: "application/pdf",
    });
    const result = validateFileSize(smallFile, MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });

  it("rejects files over size limit", () => {
    // Create a file object that reports a large size
    const largeFile = {
      name: "large.pdf",
      size: MAX_FILE_SIZE + 1,
      type: "application/pdf",
    } as File;
    const result = validateFileSize(largeFile, MAX_FILE_SIZE);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5MB");
  });

  it("accepts files exactly at the limit", () => {
    const exactFile = {
      name: "exact.pdf",
      size: MAX_FILE_SIZE,
      type: "application/pdf",
    } as File;
    const result = validateFileSize(exactFile, MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });
});
