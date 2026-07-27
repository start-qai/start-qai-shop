import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { useI18n } from "../i18n/I18nContext";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link to={isAuthenticated ? "/" : "/login"} aria-label={t("logo.home")}>
          <Logo />
        </Link>

        <div className="header__actions">
          {isAuthenticated && (
            <>
              <Link to="/cart" className="btn btn--info">
                {t("header.cart")} ({cart.totalItems})
              </Link>
              <button type="button" className="btn btn--info" onClick={handleLogout}>
                {t("header.logout")}
              </button>
            </>
          )}
          <LangSwitch />
        </div>
      </div>
    </header>
  );
}
