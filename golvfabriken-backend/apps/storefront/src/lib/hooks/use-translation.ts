/**
 * Translation hook for using i18n in components
 * 
 * Usage:
 *   import { useTranslation } from '@/lib/hooks/use-translation'
 *   
 *   function MyComponent() {
 *     const { t } = useTranslation()
 *     return <h1>{t('cart.title')}</h1>
 *   }
 */

import { useTranslation as useI18nTranslation } from "react-i18next"

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation("common")

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  }
}
