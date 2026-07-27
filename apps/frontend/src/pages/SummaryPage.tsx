import { Link, Navigate, useLocation } from "react-router-dom";
import type { CheckoutResponse } from "@qai-shop/shared";
import { useI18n } from "../i18n/I18nContext";
import { formatPrice } from "../lib/format";

export function SummaryPage() {
  const location = useLocation();
  const { t } = useI18n();
  const order = location.state as CheckoutResponse | null;

  // Direct entry (without an order) => go back to the list.
  if (!order || order.status !== "PAID") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="panel stack center" style={{ padding: 36 }}>
          <div className="summary-badge" aria-hidden="true">
            ✓
          </div>
          <h1>{t("summary.title")}</h1>
          <p className="muted">{t("summary.message")}</p>

          <div
            className="panel"
            style={{ padding: 18, textAlign: "left", background: "var(--bg-panel-2)" }}
          >
            <div className="row between">
              <span className="muted">{t("summary.orderId")}</span>
              <span className="font-head">{order.orderId}</span>
            </div>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="muted">{t("summary.itemsCount")}</span>
              <span>{order.totalItems}</span>
            </div>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="muted">{t("summary.paid")}</span>
              <span className="product-card__price" style={{ fontSize: 22 }}>
                {formatPrice(order.totalPrice, order.currency)}
              </span>
            </div>
          </div>

          <Link to="/" className="btn btn--primary" style={{ marginTop: 8 }}>
            {t("summary.backToShop")}
          </Link>
        </div>
      </div>
    </div>
  );
}
