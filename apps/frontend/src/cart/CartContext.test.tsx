import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Cart } from "@qai-shop/shared";
import { CartProvider, useCart } from "./CartContext";

const addToCart = vi.fn();
const getCart = vi.fn();

vi.mock("../api/client", () => ({
  getCart: () => getCart(),
  addToCart: (productId: string, quantity: number) => addToCart(productId, quantity),
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const emptyCart: Cart = { items: [], totalItems: 0, totalPrice: 0, currency: "PLN" };
const oneItemCart: Cart = {
  items: [
    {
      productId: "product-under-test",
      title: "Produkt testowy",
      price: 10,
      currency: "PLN",
      imageUrl: "/images/products/default.png",
      quantity: 1,
      lineTotal: 10,
    },
  ],
  totalItems: 1,
  totalPrice: 10,
  currency: "PLN",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function Probe() {
  const { addToCart: add, cart, loading } = useCart();
  return (
    <div>
      <span>items: {cart.totalItems}</span>
      <span>{loading ? "loading" : "idle"}</span>
      <button type="button" onClick={() => void add("product-under-test", 1)}>
        add
      </button>
    </div>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    getCart.mockReset().mockResolvedValue(emptyCart);
    addToCart.mockReset();
  });

  it("ignores a subsequent mutation while the previous one is in flight", async () => {
    const user = userEvent.setup();
    const pending = deferred<Cart>();
    addToCart.mockReturnValueOnce(pending.promise);

    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );

    await waitFor(() => expect(getCart).toHaveBeenCalled());

    const button = screen.getByRole("button", { name: "add" });
    await user.click(button);
    await user.click(button);

    expect(addToCart).toHaveBeenCalledTimes(1);

    pending.resolve(oneItemCart);
    await waitFor(() => expect(screen.getByText("items: 1")).toBeInTheDocument());
  });
});
