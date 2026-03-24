import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../ui/common/PageMeta";
import PageBreadcrumb from "../ui/common/PageBreadCrumb";
import Badge from "../ui/components/badge/Badge";
import Button from "../ui/components/button/Button";
import { Modal } from "../ui/components/modal/index";
import Input from "../ui/form/input/InputField";
import Select from "../ui/form/Select";
import { PlusIcon } from "../icons";
import { useFulfillmentStore } from "../store/fulfillment-store";
import { useLanguage } from "../i18n/LanguageContext";
import { useNotification } from "../contexts/NotificationContext";
import { CLIENT_STATUS_CONFIG } from "../data/constants";
import type { Client } from "../data/types";

function statusToBadgeColor(status: string): "success" | "error" | "warning" | "info" | "light" | "primary" | "dark" {
  switch (status) {
    case "live":
      return "success";
    case "paused":
    case "churned":
      return "light";
    case "onboarding":
    case "strategy":
      return "primary";
    case "copy":
    case "review":
      return "warning";
    case "campaigns":
    case "funnel":
      return "info";
    default:
      return "light";
  }
}

function getInitialsBgColor(status: string): string {
  switch (status) {
    case "live":
      return "bg-brand-500 text-white";
    case "paused":
      return "bg-gray-400 text-white";
    case "churned":
      return "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300";
    case "onboarding":
    case "strategy":
      return "bg-brand-400 text-white";
    case "copy":
    case "review":
      return "bg-warning-500 text-white";
    case "campaigns":
    case "funnel":
      return "bg-blue-light-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

function getCompanyInitials(company: string): string {
  return company.substring(0, 2).toUpperCase();
}

export default function ClientList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { clients, alerts, approvals, loadClients, deleteClient } =
    useFulfillmentStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleDeleteClient = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteClient(deleteTarget.id);
      notify({
        id: `delete-${Date.now()}`,
        type: 'success',
        title: t('toast.clientDeleted'),
        message: deleteTarget.company,
      });
    } catch (err) {
      console.error('[ClientList] Löschen fehlgeschlagen:', err);
      notify({
        id: `delete-err-${Date.now()}`,
        type: 'error',
        title: t('toast.deleteFailed'),
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteClient, notify, t]);

  const statusOptions = [
    { value: "", label: t("clients.allStatuses") },
    ...Object.entries(CLIENT_STATUS_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: cfg.label,
    })),
  ];

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = c.company
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [search, statusFilter]);

  const getAmpelColor = useCallback((client: Client): { className: string; label: string } => {
    const hasAlerts = alerts.some(
      (a) => a.clientId === client.id && !a.acknowledged
    );
    if (hasAlerts) return { className: "bg-error-500", label: t("ampel.alert") };
    const hasPending = approvals.some(
      (a) => a.clientId === client.id && a.status === "pending"
    );
    if (hasPending) return { className: "bg-warning-500", label: t("ampel.pending") };
    return { className: "bg-success-500", label: t("ampel.ok") };
  }, [alerts, approvals, t]);

  const formatPrice = (price: number): string => {
    return `\u20AC${price.toLocaleString("de-DE")}`;
  };

  return (
    <>
      <PageMeta
        title={`${t("clients.title")} | Kunden Hub`}
        description="Kundenübersicht"
      />
      <PageBreadcrumb pageTitle={t("clients.title")} />

      {/* Top Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Input
              placeholder={t("clients.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              placeholder={t("clients.allStatuses")}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>
        </div>
        <button
          onClick={() => navigate('/kunden-hub/onboarding')}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
        >
          <PlusIcon className="size-4" />
          {t("clients.newClient")}
        </button>
      </div>

      {/* Client Grid */}
      {filteredClients.length > 0 ? (<>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.slice(0, visibleCount).map((client) => {
            const cfg = CLIENT_STATUS_CONFIG[client.status] || { label: client.status, color: 'text-gray-400', bgColor: 'bg-gray-100' };
            return (
              <div
                key={client.id}
                onClick={() => navigate(`/kunden-hub/clients/${client.id}`)}
                className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-600 md:p-6"
              >
                {/* Header: Logo + Company + Status + Delete */}
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${getInitialsBgColor(client.status)}`}>
                    {getCompanyInitials(client.company)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white/90 truncate group-hover:text-brand-600 transition-colors">
                      {client.company}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        size="sm"
                        variant="light"
                        color={statusToBadgeColor(client.status)}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                  <button
                    title={t('delete.confirmTitle')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(client);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Paket + Preis */}
                <div className="mt-4 flex items-center justify-between">
                  {client.paket ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {client.paket}
                    </span>
                  ) : (
                    <span />
                  )}
                  {client.monatspreis != null && (
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatPrice(client.monatspreis)}{t("clients.perMonth")}
                    </span>
                  )}
                </div>

                {/* Mini-KPIs - always show 3 boxes for consistent height */}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {client.kpis ? (
                    <>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">{client.kpis.leads}</p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.leads")}</span>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">{client.kpis.cpl.toFixed(0)}{"\u20AC"}</p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.cpl")}</span>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">
                          {client.kpis.spend >= 1000 ? `${(client.kpis.spend / 1000).toFixed(1)}k` : client.kpis.spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.spend")}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-300 dark:text-gray-600">-</p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.leads")}</span>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-300 dark:text-gray-600">-</p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.cpl")}</span>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-2 py-2.5 text-center dark:bg-white/[0.04]">
                        <p className="text-base font-bold text-gray-300 dark:text-gray-600">-</p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t("table.spend")}</span>
                      </div>
                    </>
                  )}
                </div>

                {client.status === "paused" && (
                  <p className="mt-3 text-xs italic text-gray-400 dark:text-gray-500">{t("status.paused")}</p>
                )}

                {/* Contact + Ampel */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {client.name}
                  </span>
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900 ${getAmpelColor(client).className}`}
                    role="img"
                    aria-label={getAmpelColor(client).label}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {filteredClients.length > visibleCount && (
          <div className="mt-6 flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + 24)}
            >
              {t("clients.loadMore")} ({filteredClients.length - visibleCount} {t("clients.remaining")})
            </Button>
          </div>
        )}
        </>
      ) : (
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              {clients.length === 0
                ? t("dashboard.noClients")
                : t("clients.noResults")}
            </p>
            {clients.length === 0 && (
              <>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  {t("dashboard.noClientsDesc")}
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/kunden-hub/onboarding')}
                  >
                    {t("clients.newClient")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t('delete.confirmTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('delete.confirmText', { company: deleteTarget?.company ?? '' })}
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
            {t('action.cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="!bg-error-500 hover:!bg-error-600"
            onClick={handleDeleteClient}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('loading.title')}
              </span>
            ) : (
              t('delete.confirm')
            )}
          </Button>
        </div>
      </Modal>
    </>
  );
}
