"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type UiLang = "en" | "sw" | "maa";
const DICT = {
  en: {
    home: "Home",
    translate: "Translate",
    dashboard: "Dashboard",
    capture: "Capture",
    explorer: "Explorer",
    map: "Risk map",
    validation: "Validation",
    ethics: "Ethics ledger",
    online: "Online",
    offline: "Offline",
    queued: "queued",
  },
  sw: {
    home: "Nyumbani",
    translate: "Tafsiri",
    dashboard: "Muhtasari",
    capture: "Rekodi",
    explorer: "Hifadhi",
    map: "Ramani ya hatari",
    validation: "Uthibitisho",
    ethics: "Daftari la maadili",
    online: "Mtandaoni",
    offline: "Nje ya mtandao",
    queued: "zinasubiri",
  },
  maa: {
    home: "Enkang",
    translate: "Aibelekenya",
    dashboard: "Enkiterunoto",
    capture: "Aigil",
    explorer: "Inkuapi",
    map: "Enkop",
    validation: "Aisisa",
    ethics: "Ilomon",
    online: "Ewuang",
    offline: "Mewuang",
    queued: "eiseriki",
  },
} as const;
export type Key = keyof (typeof DICT)["en"];

const Ctx = createContext<{ lang: UiLang; setLang: (l: UiLang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => DICT.en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UiLang>("en");
  return <Ctx.Provider value={{ lang, setLang, t: (k) => DICT[lang][k] }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
