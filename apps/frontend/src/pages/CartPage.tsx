import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as api from "../api/client";
import { assetUrl } from "../api/config";
import { useCart } from "../cart/CartContext";
import { useI18n } from "../i18n/I18nContext";
import { translateProductTitle } from "../i18n/translations";
import { formatPrice } from "../lib/format";

export function CartPage() {
  const { cart, loading, updateItem, removeItem, refresh } = useCart();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const order = await api.checkout();
      // Backend cleared the cart – sync local state (badge, list).
      await refresh().catch(() => undefined);
      navigate("/summary", { state: order });
    } catch {
      setError(t("cart.checkoutError"));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">{t("cart.title")}</h1>

        {error && (
          <div className="error-box" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading && cart.items.length === 0 ? (
          <p className="muted">{t("common.loading")}</p>
        ) : cart.items.length === 0 ? (
          <div className="panel stack" style={{ padding: 28 }}>
            <p className="muted">{t("cart.empty")}</p>
            <Link to="/" className="btn btn--primary" style={{ alignSelf: "flex-start" }}>
              {t("cart.backToProducts")}
            </Link>
          </div>
        ) : (
          <>
            <div className="panel" style={{ marginBottom: 20 }}>
              {cart.items.map((item) => {
                const title = translateProductTitle(lang, item.productId, item.title);
                return (
                  <div className="cart-item" key={item.productId} data-testid="cart-item">
                    <img className="cart-item__img" src={assetUrl(item.imageUrl)} alt={title} />
                    <div className="stack" style={{ gap: 8 }}>
                      <span className="font-head" style={{ fontSize: 18 }}>
                        {title}
                      </span>
                      <div className="row">
                        <div
                          className="qty"
                          role="group"
                          aria-label={t("cart.quantityFor", { title })}
                        >
                          <button
                            type="button"
                            aria-label={t("product.decrease")}
                            disabled={loading || item.quantity <= 1}
                            onClick={() =>
                              updateItem(item.productId, item.quantity - 1).catch(() =>
                                setError(t("cart.checkoutError")),
                              )
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={t("product.increase")}
                            disabled={loading}
                            onClick={() =>
                              updateItem(item.productId, item.quantity + 1).catch(() =>
                                setError(t("cart.checkoutError")),
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={loading}
                          onClick={() =>
                            removeItem(item.productId).catch(() =>
                              setError(t("cart.checkoutError")),
                            )
                          }
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    <div className="product-card__price" style={{ fontSize: 20 }}>
                      {formatPrice(item.lineTotal, item.currency)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="panel row between" style={{ padding: 20 }}>
              <div>
                <span className="muted">{t("cart.total", { count: cart.totalItems })} </span>
                <span className="product-card__price" style={{ fontSize: 26 }}>
                  {formatPrice(cart.totalPrice, cart.currency)}
                </span>
              </div>
              <div className="row">
                <Link to="/" className="btn btn--ghost">
                  {t("cart.backToList")}
                </Link>
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? t("cart.processing") : t("cart.buyNow")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
