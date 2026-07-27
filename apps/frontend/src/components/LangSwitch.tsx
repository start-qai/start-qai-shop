import { LANGS, LANG_META } from "../i18n/translations";
import { useI18n } from "../i18n/I18nContext";

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label={t("lang.aria")}>
      {LANGS.map((code) => {
        const { flag, label } = LANG_META[code];
        return (
          <button
            key={code}
            type="button"
            className={`lang-switch__btn${lang === code ? " is-active" : ""}`}
            aria-pressed={lang === code}
            aria-label={label}
            title={label}
            onClick={() => setLang(code)}
          >
            <span aria-hidden="true">{flag}</span>
          </button>
        );
      })}
    </div>
  );
}
