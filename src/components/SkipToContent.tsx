import { Link } from "react-router-dom";

/**
 * Accessible skip-to-content link for keyboard navigation.
 * Visually hidden but focusable for screen readers and keyboard users.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
