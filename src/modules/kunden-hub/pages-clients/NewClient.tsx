import PageMeta from "../ui/common/PageMeta";
import PageBreadCrumb from "../ui/common/PageBreadCrumb";
import OnboardingWizard from "../components/OnboardingWizard";
import { useLanguage } from "../i18n/LanguageContext";

export default function NewClient() {
  const { t } = useLanguage();
  return (
    <>
      <PageMeta title={`${t('breadcrumb.onboarding')} | Kunden Hub`} />
      <PageBreadCrumb pageTitle={t('breadcrumb.onboarding')} />
      <div className="p-4 md:p-6">
        <OnboardingWizard isOpen={true} onClose={() => {}} asPage={true} />
      </div>
    </>
  );
}
