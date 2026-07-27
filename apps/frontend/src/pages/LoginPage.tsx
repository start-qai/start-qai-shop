import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_CREDENTIALS } from "@qai-shop/shared";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { useI18n } from "../i18n/I18nContext";
import { ApiRequestError } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>(DEMO_CREDENTIALS.username);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError(t("login.error.credentials"));
      } else {
        setError(t("login.error.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="center" style={{ marginBottom: 24 }}>
          <Logo />
        </div>
        <form className="panel stack" style={{ padding: 28 }} onSubmit={onSubmit}>
          <h1>{t("login.title")}</h1>
          <p className="muted" style={{ marginTop: -8 }}>
            {t("login.simulated")}
            <br />
            {t("login.credentials")} <strong>demo / demo123</strong>.
          </p>

          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="username">{t("login.username")}</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t("login.password")}</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
        <div className="center" style={{ marginTop: 20 }}>
          <LangSwitch />
        </div>
      </div>
    </div>
  );
}
