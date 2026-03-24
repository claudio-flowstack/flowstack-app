import { useLanguage } from '../../i18n/LanguageContext'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
      className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
      title={lang === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
    >
      <span className="text-sm font-medium uppercase">{lang}</span>
    </button>
  )
}
