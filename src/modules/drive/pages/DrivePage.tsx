import { Header } from '@/shell/Header'
import { useLanguage } from '@/core/i18n/context'
import { DriveVault } from '@/modules/content/components/DriveVault'

export function DrivePage() {
  const { t } = useLanguage()

  return (
    <>
      <Header title={t('drive.title')} subtitle={t('drive.subtitle')} />
      <DriveVault />
    </>
  )
}
