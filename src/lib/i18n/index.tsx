import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fr, type Dict } from "./fr";
import { en } from "./en";

export type Lang = "fr" | "en";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
];

const DICTS: Record<Lang, Dict> = { fr, en };
const STORAGE_KEY = "av-lang";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; eur: (n: number) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // French is rendered on the server; the saved or browser language applies after hydration.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    let initial: Lang = "fr";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "fr" || saved === "en") initial = saved;
      else if (!navigator.language.toLowerCase().startsWith("fr")) initial = "en";
    } catch {
      /* storage unavailable */
    }
    setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const t = DICTS[lang];
    const eur = (n: number) => {
      const v = n.toLocaleString(t.locale);
      return lang === "fr" ? `${v} €` : `€${v}`;
    };
    return { lang, t, setLang, eur };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
