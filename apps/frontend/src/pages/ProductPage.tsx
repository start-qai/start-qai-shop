import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import type { Product } from "@qai-shop/shared";
import * as api from "../api/client";
import { assetUrl } from "../api/config";
import { useCart } from "../cart/CartContext";
import { useI18n } from "../i18n/I18nContext";
import { formatPrice } from "../lib/format";

export function ProductPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, tProduct } = useI18n();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    api
      .getProduct(id)
      .then((next) => {
        if (!ignore) setProduct(next);
      })
      .catch(() => {
        if (!ignore) setError(t("product.notFound"));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, t]);

  const handleAddAndGoToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(t("products.added"));
      navigate("/cart");
    } catch {
      toast.error(t("cart.checkoutError"));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="muted">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page">
        <div className="container stack">
          <div className="error-box">{error ?? t("product.missing")}</div>
          <Link to="/" className="btn btn--ghost">
            {t("product.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const view = tProduct(product);

  return (
    <div className="page">
      <div className="container">
        <div
          className="panel"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 28,
            padding: 24,
          }}
        >
          <img
            src={assetUrl(view.imageUrl)}
            alt={view.title}
            style={{ width: "100%", borderRadius: 12, background: "var(--bg-panel-2)" }}
          />
          <div className="stack">
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {view.title}
            </h1>
            <div className="product-card__price" style={{ fontSize: 30 }}>
              {formatPrice(view.price, view.currency)}
            </div>
            <p className="muted">{view.description}</p>

            <div className="row">
              <span className="muted">{t("product.quantity")}</span>
              <div className="qty" role="group" aria-label={t("product.quantityAria")}>
                <button
                  type="button"
                  aria-label={t("product.decrease")}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span data-testid="quantity">{quantity}</span>
                <button
                  type="button"
                  aria-label={t("product.increase")}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="row" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn btn--accent"
                onClick={handleAddAndGoToCart}
                disabled={adding}
              >
                {adding ? t("products.adding") : t("products.addToCart")}
              </button>
              <Link to="/" className="btn btn--ghost">
                {t("product.back")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
