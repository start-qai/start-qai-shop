import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { getProducts, setUnauthorizedHandler } from "../api/client";
import { tokenStore } from "../api/token";

function AuthProbe() {
  const { isAuthenticated, username } = useAuth();
  return (
    <div>
      <span>{isAuthenticated ? "authenticated" : "anonymous"}</span>
      <span>{username ?? "no-user"}</span>
    </div>
  );
}

function UnauthorizedButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void getProducts().catch(() => undefined);
      }}
    >
      unauthorized
    </button>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    tokenStore.set("stale-token");
    localStorage.setItem("qai-shop-user", "demo");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "UNAUTHORIZED", message: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });

  it("clears the local session via the 401 handler", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthProbe />
        <UnauthorizedButton />
      </AuthProvider>,
    );

    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "unauthorized" }));

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(localStorage.getItem("qai-shop-user")).toBeNull();
  });
});
