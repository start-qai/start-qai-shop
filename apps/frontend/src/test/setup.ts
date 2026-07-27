import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up DOM and localStorage after each test.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
