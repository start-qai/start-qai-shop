import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Product } from "@qai-shop/shared";
import { ProductPage } from "./ProductPage";
import { I18nProvider } from "../i18n/I18nContext";

const product: Product = {
  id: "qai-mug",
  title: "Produkt z API",
  description: "Szczegółowy opis produktu",
  price: 39.99,
  currency: "PLN",
  imageUrl: "/images/products/default.png",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const navigate = vi.fn();
const getProduct = vi.fn();
const addToCart = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("../api/client", () => ({
  getProduct: (id: string) => getProduct(id),
}));

vi.mock("../cart/CartContext", () => ({
  useCart: () => ({ addToCart }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/products/qai-mug"]}>
      <I18nProvider>
        <Routes>
          <Route path="/products/:id" element={<ProductPage />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("ProductPage", () => {
  beforeEach(() => {
    navigate.mockReset();
    getProduct.mockReset().mockResolvedValue(product);
    addToCart.mockReset().mockResolvedValue(undefined);
  });

  it("fetches and displays product details by the id from the URL", async () => {
    renderPage();

    expect(await screen.findByText(product.title)).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith("qai-mug");
    expect(screen.getByText(product.description)).toBeInTheDocument();
    expect(screen.getByText(/39,99/)).toBeInTheDocument();
  });

  it("adds the selected quantity to the cart and goes to the cart", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(product.title);

    await user.click(screen.getByRole("button", { name: "Zwiększ" }));
    expect(screen.getByTestId("quantity")).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: /Do koszyka/i }));

    await waitFor(() => expect(addToCart).toHaveBeenCalledWith("qai-mug", 2));
    expect(navigate).toHaveBeenCalledWith("/cart");
  });

  it("shows an error message and a back link when the product fails to load", async () => {
    getProduct.mockRejectedValueOnce(new Error("fail"));
    renderPage();

    expect(await screen.findByText("Nie znaleziono produktu.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Powrót do listy/i })).toBeInTheDocument();
    expect(addToCart).not.toHaveBeenCalled();
  });
});
