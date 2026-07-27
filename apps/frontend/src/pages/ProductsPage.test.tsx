import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Product } from "@qai-shop/shared";
import { ProductsPage } from "./ProductsPage";
import { I18nProvider } from "../i18n/I18nContext";

const products: Product[] = [
  {
    id: "product-under-test",
    title: "Produkt z API",
    description: "opis",
    price: 39.99,
    currency: "PLN",
    imageUrl: "/images/products/qai-mug.svg",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const getProducts = vi.fn();
const addToCart = vi.fn().mockResolvedValue(undefined);

vi.mock("../api/client", () => ({
  getProducts: () => getProducts(),
}));

vi.mock("../cart/CartContext", () => ({
  useCart: () => ({ addToCart }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ProductsPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("ProductsPage", () => {
  beforeEach(() => {
    getProducts.mockReset().mockResolvedValue(products);
    addToCart.mockClear();
  });

  it("displays products fetched from the API", async () => {
    renderPage();
    expect(await screen.findByText(products[0].title)).toBeInTheDocument();
    expect(screen.getByText(/39,99/)).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(1);
  });

  it("adds a product to the cart on click", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(products[0].title);

    await user.click(screen.getByRole("button", { name: /Do koszyka/i }));
    await waitFor(() => expect(addToCart).toHaveBeenCalledWith(products[0].id, 1));
  });

  it("shows an error message when the API fails", async () => {
    getProducts.mockRejectedValueOnce(new Error("fail"));
    renderPage();
    expect(await screen.findByText(/Nie udało się pobrać produktów/)).toBeInTheDocument();
  });
});
