import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Product } from "@qai-shop/shared";
import * as api from "../api/client";
import { assetUrl } from "../api/config";
import { useCart } from "../cart/CartContext";
import { useI18n } from "../i18n/I18nContext";
import { formatPrice } from "../lib/format";

export function ProductsPage() {
  const { addToCart } = useCart();
  const { t, tProduct } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .getProducts()
      .then((next) => {
        if (!ignore) setProducts(next);
      })
      .catch(() => {
        if (!ignore) setError(t("products.error"));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [t]);

  const handleAdd = async (id: string) => {
    setAddingId(id);
    try {
      await addToCart(id, 1);
      toast.success(t("products.added"));
    } catch {
      toast.error(t("cart.checkoutError"));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">{t("products.title")}</h1>

        {loading && <p className="muted">{t("common.loading")}</p>}
        {error && <div className="error-box">{error}</div>}

        <div className="grid">
          {products.map((raw) => {
            const p = tProduct(raw);
            return (
              <article className="panel product-card" key={p.id} data-testid="product-card">
                <Link to={`/products/${p.id}`}>
                  <img
                    className="product-card__img"
                    src={assetUrl(p.imageUrl)}
                    alt={p.title}
                    loading="lazy"
                  />
                </Link>
                <div className="product-card__body">
                  <Link to={`/products/${p.id}`} className="product-card__title font-head">
                    {p.title}
                  </Link>
                  <div className="product-card__price">{formatPrice(p.price, p.currency)}</div>
                  <div className="product-card__actions">
                    <button
                      type="button"
                      className="btn btn--accent"
                      onClick={() => handleAdd(p.id)}
                      disabled={addingId === p.id}
                    >
                      {addingId === p.id ? t("products.adding") : t("products.addToCart")}
                    </button>
                    <Link to={`/products/${p.id}`} className="btn btn--info">
                      {t("products.details")}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
