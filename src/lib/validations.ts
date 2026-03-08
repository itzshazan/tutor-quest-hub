import { z } from "zod";

// Phone number validation - supports international formats
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      // Remove spaces, dashes, parentheses for validation
      const cleaned = val.replace(/[\s\-\(\)]/g, "");
      // Must be 10-15 digits, optionally starting with +
      return /^\+?[0-9]{10,15}$/.test(cleaned);
    },
    { message: "Please enter a valid phone number (10-15 digits)" }
  );

// Password strength levels
export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordAnalysis {
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
}

export function analyzePassword(password: string): PasswordAnalysis {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("Use at least 8 characters");
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Mix uppercase and lowercase letters");
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("Add numbers");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push("Add special characters (!@#$%...)");
  }

  // Cap at 4
  score = Math.min(score, 4);

  let strength: PasswordStrength;
  if (score <= 1) strength = "weak";
  else if (score === 2) strength = "fair";
  else if (score === 3) strength = "good";
  else strength = "strong";

  return { strength, score, feedback };
}

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

// File validation
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "image/webp",
];

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File, maxSize = MAX_AVATAR_SIZE): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxSize / (1024 * 1024)} MB` };
  }
  return { valid: true };
}

export function validateDocumentFile(file: File, maxSize = MAX_DOCUMENT_SIZE): FileValidationResult {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, WebP, and PDF files are allowed" };
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${maxSize / (1024 * 1024)} MB` };
  }
  return { valid: true };
}

// Email validation
export const emailSchema = z.string().email("Please enter a valid email address");

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes");
