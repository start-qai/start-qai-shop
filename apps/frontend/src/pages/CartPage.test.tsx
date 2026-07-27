import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Cart, CheckoutResponse } from "@qai-shop/shared";
import { CartPage } from "./CartPage";
import { I18nProvider } from "../i18n/I18nContext";

const navigate = vi.fn();
const checkout = vi.fn();
const updateItem = vi.fn();
const removeItem = vi.fn();
const refresh = vi.fn();

let cart: Cart;
let loading = false;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("../api/client", () => ({
  checkout: () => checkout(),
}));

vi.mock("../cart/CartContext", () => ({
  useCart: () => ({ cart, loading, updateItem, removeItem, refresh }),
}));

function filledCart(): Cart {
  return {
    items: [
      {
        productId: "product-under-test",
        title: "Produkt w koszyku",
        price: 10,
        currency: "PLN",
        imageUrl: "/images/products/default.png",
        quantity: 2,
        lineTotal: 20,
      },
    ],
    totalItems: 2,
    totalPrice: 20,
    currency: "PLN",
  };
}

function order(): CheckoutResponse {
  return {
    orderId: "order-1",
    status: "PAID",
    items: cart.items,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    currency: "PLN",
    createdAt: "2026-01-01T00:00:00.000Z",
    message: "ok",
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <CartPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    cart = { items: [], totalItems: 0, totalPrice: 0, currency: "PLN" };
    loading = false;
    navigate.mockReset();
    checkout.mockReset();
    updateItem.mockReset().mockResolvedValue(undefined);
    removeItem.mockReset().mockResolvedValue(undefined);
    refresh.mockReset().mockResolvedValue(undefined);
  });

  it("shows loading instead of an empty cart during the first fetch", () => {
    loading = true;

    renderPage();

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    expect(screen.queryByText("Twój koszyk jest pusty.")).not.toBeInTheDocument();
  });

  it("navigates to the summary after a successful checkout even if the cart refresh fails", async () => {
    const user = userEvent.setup();
    cart = filledCart();
    checkout.mockImplementation(() => Promise.resolve(order()));
    refresh.mockRejectedValueOnce(new Error("refresh failed"));

    renderPage();
    await user.click(screen.getByRole("button", { name: /Kup teraz/i }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/summary", {
        state: expect.objectContaining({ orderId: "order-1" }),
      }),
    );
    expect(screen.queryByText("Nie udało się sfinalizować zakupu.")).not.toBeInTheDocument();
  });

  it("shows an error when checkout fails", async () => {
    const user = userEvent.setup();
    cart = filledCart();
    checkout.mockRejectedValueOnce(new Error("checkout failed"));

    renderPage();
    await user.click(screen.getByRole("button", { name: /Kup teraz/i }));

    expect(await screen.findByText("Nie udało się sfinalizować zakupu.")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("triggers quantity change and removal for a cart item", async () => {
    const user = userEvent.setup();
    cart = filledCart();

    renderPage();
    await user.click(screen.getByRole("button", { name: "Zwiększ" }));
    await user.click(screen.getByRole("button", { name: "Usuń" }));

    expect(updateItem).toHaveBeenCalledWith("product-under-test", 3);
    expect(removeItem).toHaveBeenCalledWith("product-under-test");
  });
});
