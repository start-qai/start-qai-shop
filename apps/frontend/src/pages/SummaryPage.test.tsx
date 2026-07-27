import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { CheckoutResponse } from "@qai-shop/shared";
import { SummaryPage } from "./SummaryPage";
import { I18nProvider } from "../i18n/I18nContext";

const order: CheckoutResponse = {
  orderId: "order-1",
  status: "PAID",
  items: [
    {
      productId: "qai-mug",
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
  createdAt: "2026-01-01T00:00:00.000Z",
  message: "ok",
};

function renderAt(entry: { pathname: string; state?: unknown } | string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <I18nProvider>
        <Routes>
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/" element={<div>Lista produktów</div>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("SummaryPage", () => {
  it("displays the summary of a paid order passed via state", () => {
    renderAt({ pathname: "/summary", state: order });

    expect(screen.getByText("Dziękujemy za zakup!")).toBeInTheDocument();
    expect(screen.getByText("order-1")).toBeInTheDocument();
    expect(screen.getByText(String(order.totalItems))).toBeInTheDocument();
    expect(screen.getByText(/20,00/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Wróć do sklepu/i })).toBeInTheDocument();
  });

  it("redirects to the list on direct entry (no order in state)", () => {
    renderAt("/summary");

    expect(screen.getByText("Lista produktów")).toBeInTheDocument();
    expect(screen.queryByText("Dziękujemy za zakup!")).not.toBeInTheDocument();
  });

  it("redirects to the list when the order status is not PAID", () => {
    renderAt({ pathname: "/summary", state: { ...order, status: "PENDING" } });

    expect(screen.getByText("Lista produktów")).toBeInTheDocument();
    expect(screen.queryByText("Dziękujemy za zakup!")).not.toBeInTheDocument();
  });
});
