/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App.jsx";

// Stub shadowWrite to avoid side effects
vi.mock("./lib/shadowWrite.js", () => ({
  shadowWriter: { onProjectSave: vi.fn() },
}));

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("redirects root to dashboard", () => {
    render(<App />);
    // After redirect, the URL should point to /dashboard
    expect(window.location.pathname).toBe("/dashboard");
  });
});
