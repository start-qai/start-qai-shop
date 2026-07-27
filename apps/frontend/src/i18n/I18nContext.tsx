import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@qai-shop/shared";
import { DEFAULT_LANG, LANGS, TRANSLATIONS, translateProduct, type Lang } from "./translations";

const STORAGE_KEY = "qai-shop-lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translates a key; optional variables substituted into {name}. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  tProduct: (product: Product) => Product;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (LANGS as string[]).includes(stored ?? "") ? (stored as Lang) : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = TRANSLATIONS[lang][key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value));
        }
      }
      return text;
    },
    [lang],
  );

  const tProduct = useCallback((product: Product) => translateProduct(lang, product), [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, tProduct }),
    [lang, setLang, t, tProduct],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n musi być użyty wewnątrz <I18nProvider>");
  return ctx;
}
