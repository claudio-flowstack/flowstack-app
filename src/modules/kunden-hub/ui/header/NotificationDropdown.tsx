import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "../components/dropdown/Dropdown";
import { useFulfillmentStore } from "../../store/fulfillment-store";
import { useLanguage } from "../../i18n/LanguageContext";

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-error-500";
    case "warning":
      return "bg-warning-500";
    case "info":
      return "bg-blue-light-500";
    default:
      return "bg-gray-400";
  }
}

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("activity.justNow");
  if (diffMins < 60) return t("activity.minutesAgo", { n: diffMins });
  if (diffHours < 24) return t("activity.hoursAgo", { n: diffHours });
  return t("activity.daysAgo", { n: diffDays });
}

export default function NotificationDropdown() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const alerts = useFulfillmentStore((s) => s.alerts);
  const approvals = useFulfillmentStore((s) => s.approvals);
  const acknowledgeAlert = useFulfillmentStore((s) => s.acknowledgeAlert);

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const totalUnread = unreadAlerts.filter((a) => !readIds.has(a.id)).length + pendingApprovals.filter((a) => !readIds.has(a.id)).length;

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleAlertClick(alertId: string, clientId?: string) {
    setReadIds((prev) => new Set(prev).add(alertId));
    acknowledgeAlert(alertId);
    closeDropdown();
    if (clientId) {
      navigate(`/kunden-hub/clients/${clientId}`);
    }
  }

  function handleApprovalClick(approvalId: string, clientId: string) {
    setReadIds((prev) => new Set(prev).add(approvalId));
    closeDropdown();
    navigate(`/kunden-hub/clients/${clientId}`);
  }

  function markAllRead() {
    const allIds = new Set(readIds);
    unreadAlerts.forEach((a) => allIds.add(a.id));
    pendingApprovals.forEach((a) => allIds.add(a.id));
    setReadIds(allIds);
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {totalUnread > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("notification.title")}
          </h5>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 transition"
              >
                {t("notification.markAllRead")}
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {/* Real alerts */}
          {unreadAlerts.map((alert) => (
            <li key={alert.id}>
              <button
                onClick={() => handleAlertClick(alert.id, alert.clientId)}
                className={`flex w-full gap-3 rounded-lg border-b border-gray-100 p-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                  readIds.has(alert.id) ? "opacity-60" : ""
                }`}
              >
                <span className="relative mt-1.5 block shrink-0">
                  <span className={`block h-2.5 w-2.5 rounded-full ${severityColor(alert.severity)}`} />
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {alert.title}
                  </span>
                  <span className="block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
                    {alert.description}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-gray-400 text-theme-xs dark:text-gray-500">
                    {alert.clientName && <span>{alert.clientName}</span>}
                    {alert.clientName && <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
                    <span>{timeAgo(alert.createdAt, t)}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}

          {/* Pending approvals as notifications */}
          {pendingApprovals.map((approval) => (
            <li key={approval.id}>
              <button
                onClick={() => handleApprovalClick(approval.id, approval.clientId)}
                className={`flex w-full gap-3 rounded-lg border-b border-gray-100 p-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                  readIds.has(approval.id) ? "opacity-60" : ""
                }`}
              >
                <span className="relative mt-1.5 block shrink-0">
                  <span className="block h-2.5 w-2.5 rounded-full bg-warning-500" />
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {t("notification.approvalNeeded")}
                  </span>
                  <span className="block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
                    {approval.deliverableTitle}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-gray-400 text-theme-xs dark:text-gray-500">
                    <span>{approval.clientName}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{timeAgo(approval.requestedAt, t)}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}

          {/* Empty state */}
          {unreadAlerts.length === 0 && pendingApprovals.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("notification.empty")}
            </li>
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
