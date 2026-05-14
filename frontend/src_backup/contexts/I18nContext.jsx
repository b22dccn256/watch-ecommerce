import { createContext } from "react";

export const I18nContext = createContext({ t: (k) => k, lang: "vi", currency: "vnd" });
