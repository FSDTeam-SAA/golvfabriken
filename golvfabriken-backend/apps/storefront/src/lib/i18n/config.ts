import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import sv from "./locales/sv/common.json"
import en from "./locales/en/common.json"

// Translation resources
const resources = {
  sv: { common: sv },
  en: { common: en },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "sv", // Default language: Swedish
    fallbackLng: "en", // Fallback language: English
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  })

export default i18n
