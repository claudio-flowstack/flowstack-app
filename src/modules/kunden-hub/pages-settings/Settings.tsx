import { useState } from "react";
import PageMeta from "../ui/common/PageMeta";
import PageBreadcrumb from "../ui/common/PageBreadCrumb";
import Badge from "../ui/components/badge/Badge";
import Button from "../ui/components/button/Button";
import Input from "../ui/form/input/InputField";
import Switch from "../ui/form/switch/Switch";
import { Modal } from "../ui/components/modal";
import { useLanguage } from "../i18n/LanguageContext";

interface TeamMember {
  name: string;
  role: string;
  email: string;
}

interface Integration {
  name: string;
  connected: boolean;
}

export default function Settings() {
  const { t } = useLanguage();

  // Notification state
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [zeroLeadAlert, setZeroLeadAlert] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const team: TeamMember[] = [
    { name: "Claudio Di Franco", role: "Admin", email: "claudio@flowstack-system.de" },
    { name: "Anak", role: "Technik", email: "anak@flowstack-system.de" },
  ];

  const integrations: Integration[] = [
    { name: "Google Workspace", connected: true },
    { name: "Meta Business", connected: true },
    { name: "Slack", connected: true },
    { name: "Close CRM", connected: true },
    { name: "ClickUp", connected: false },
  ];

  return (
    <>
      <PageMeta
        title={`${t("settings.title")} | Kunden Hub`}
        description={t("settings.title")}
      />
      <PageBreadcrumb pageTitle={t("settings.title")} />

      <div className="space-y-6">
        {/* Section 1: Profil */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("settings.profile")}
          </h3>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="text-xl font-semibold text-gray-500 dark:text-gray-300">
                CD
              </span>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("settings.name")}
                </label>
                <Input
                  value="Claudio Di Franco"
                  onChange={() => {}}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("dialog.email")}
                </label>
                <Input
                  value="claudio@flowstack-system.de"
                  onChange={() => {}}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("settings.role")}
                </label>
                <Badge variant="light" color="primary" size="md">
                  Admin
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Team */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("settings.team")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert(t("settings.comingSoon"))}
            >
              {t("settings.invite")}
            </Button>
          </div>
          <div className="space-y-4">
            {team.map((member) => (
              <div
                key={member.email}
                className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                </div>
                <Badge variant="light" color="light" size="sm">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Benachrichtigungen */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("settings.notifications")}
          </h3>
          <div className="space-y-5">
            <Switch
              label={t("settings.slackAlerts")}
              defaultChecked={slackAlerts}
              onChange={(checked) => setSlackAlerts(checked)}
            />
            <Switch
              label={t("settings.emailAlerts")}
              defaultChecked={emailAlerts}
              onChange={(checked) => setEmailAlerts(checked)}
            />
            <Switch
              label={t("settings.zeroLeadAlert")}
              defaultChecked={zeroLeadAlert}
              onChange={(checked) => setZeroLeadAlert(checked)}
            />
            <Switch
              label={t("settings.weeklyReport")}
              defaultChecked={weeklyReport}
              onChange={(checked) => setWeeklyReport(checked)}
            />
          </div>
        </div>

        {/* Section 4: Integrationen */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("settings.integrations")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {integration.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {integration.name}
                  </p>
                  <div className="mt-1">
                    <Badge
                      size="sm"
                      variant="light"
                      color={integration.connected ? "success" : "light"}
                    >
                      {integration.connected ? t("settings.connected") : t("settings.notConnected")}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(t("settings.comingSoon"))}
                >
                  {t("settings.configure")}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Branding */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("settings.branding")}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("settings.agencyName")}
              </label>
              <Input
                value="Flowstack Systems"
                onChange={() => {}}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("settings.logo")}
              </label>
              <div className="cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center transition hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500">
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg
                      className="fill-current"
                      width="24"
                      height="24"
                      viewBox="0 0 29 28"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {t("settings.uploadLogo")}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("settings.primaryColor")}
              </label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("settings.brandColor")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Gefahrenzone */}
        <div className="rounded-2xl border border-error-300 bg-white p-5 dark:border-error-500/30 dark:bg-white/[0.03] md:p-6">
          <h3 className="mb-3 text-lg font-semibold text-error-600 dark:text-error-400">
            {t("settings.danger")}
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t("settings.deleteConfirm")}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="bg-error-500 hover:bg-error-600 disabled:bg-error-300"
            onClick={() => setShowDeleteModal(true)}
          >
            {t("settings.deleteAll")}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("dialog.confirmTitle")}
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t("settings.deleteConfirm")}
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
          >
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-error-500 hover:bg-error-600 disabled:bg-error-300"
            onClick={() => {
              setShowDeleteModal(false);
              alert(t("settings.dataDeleted"));
            }}
          >
            {t("settings.deleteAll")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
