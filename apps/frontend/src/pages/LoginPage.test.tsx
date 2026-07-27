import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { I18nProvider } from "../i18n/I18nContext";
import { ApiRequestError } from "../api/client";

const login = vi.fn();
const navigate = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ login }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <LoginPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
    navigate.mockReset();
  });

  it("has pre-filled demo credentials", () => {
    renderPage();
    expect(screen.getByLabelText("Nazwa użytkownika")).toHaveValue("demo");
    expect(screen.getByLabelText("Hasło")).toHaveValue("demo123");
  });

  it("logs in and redirects on success", async () => {
    login.mockResolvedValue(undefined);
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("demo", "demo123"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/"));
  });

  it("shows an error for invalid credentials (401)", async () => {
    login.mockImplementation(async () => {
      throw new ApiRequestError(401, { error: "UNAUTHORIZED", message: "x" });
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    expect(
      await screen.findByText(/Nieprawidłowa nazwa użytkownika lub hasło/),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
