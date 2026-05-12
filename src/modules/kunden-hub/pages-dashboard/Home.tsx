import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../ui/common/PageMeta";
import PageBreadcrumb from "../ui/common/PageBreadCrumb";
import Badge from "../ui/components/badge/Badge";
import Button from "../ui/components/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/components/table";
import {
  GroupIcon,
  DollarLineIcon,
  CheckCircleIcon,
  ShootingStarIcon,
} from "../icons";
import { useFulfillmentStore } from "../store/fulfillment-store";
import { useLanguage } from "../i18n/LanguageContext";
import { CLIENT_STATUS_CONFIG } from "../data/constants";
import type { Client, Alert as AlertType, Approval } from "../data/types";
import { Modal } from "../ui/components/modal/index";
import PipelineKanban from "../components/PipelineKanban";
import TeamCapacity from "../components/TeamCapacity";
import ActivityFeed from "../components/ActivityFeed";
import AiSuggestions from "../components/AiSuggestions";

type SortKey = "company" | "currentPhase" | "leads" | "cpl" | "spend" | "status";
type SortDir = "asc" | "desc";

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

function severityBorder(severity: string): string {
  switch (severity) {
    case "critical":
      return "border-l-4 border-l-error-500";
    case "warning":
      return "border-l-4 border-l-warning-500";
    case "info":
      return "border-l-4 border-l-blue-light-500";
    default:
      return "";
  }
}

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const clients = useFulfillmentStore((s) => s.clients);
  const alerts = useFulfillmentStore((s) => s.alerts);
  const approvals = useFulfillmentStore((s) => s.approvals);
  const loadClients = useFulfillmentStore((s) => s.loadClients);
  const acknowledgeAlert = useFulfillmentStore((s) => s.acknowledgeAlert);
  const approveDeliverable = useFulfillmentStore((s) => s.approveDeliverable);

  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [confirmApproval, setConfirmApproval] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // KPI computations
  const activeClients = useMemo(
    () => clients.filter((c) => c.status !== "paused" && c.status !== "churned"),
    [clients]
  );

  const liveClients = useMemo(
    () => clients.filter((c) => c.status === "live" && c.kpis),
    [clients]
  );

  const totalLeads = useMemo(() => {
    return liveClients.reduce((sum, c) => sum + (c.kpis?.leads ?? 0), 0);
  }, [liveClients]);

  const totalSpend = useMemo(() => {
    return liveClients.reduce((sum, c) => sum + (c.kpis?.spend ?? 0), 0);
  }, [liveClients]);

  // Weighted CPL: totalSpend / totalLeads (not average of averages)
  const avgCpl = useMemo(() => {
    if (totalLeads === 0) return 0;
    return totalSpend / totalLeads;
  }, [totalSpend, totalLeads]);

  // MRR only from active clients (not churned/paused)
  const mrr = useMemo(() => {
    return activeClients.reduce((sum, c) => sum + (c.monatspreis ?? 0), 0);
  }, [activeClients]);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === "pending"),
    [approvals]
  );

  const unacknowledgedAlerts = useMemo(
    () => alerts.filter((a) => !a.acknowledged),
    [alerts]
  );

  // Sorting
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedClients = useMemo(() => {
    const arr = [...clients];
    arr.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      switch (sortKey) {
        case "company":
          valA = a.company.toLowerCase();
          valB = b.company.toLowerCase();
          break;
        case "currentPhase":
          valA = a.currentPhase;
          valB = b.currentPhase;
          break;
        case "leads":
          valA = a.kpis?.leads ?? -1;
          valB = b.kpis?.leads ?? -1;
          break;
        case "cpl":
          valA = a.kpis?.cpl ?? -1;
          valB = b.kpis?.cpl ?? -1;
          break;
        case "spend":
          valA = a.kpis?.spend ?? -1;
          valB = b.kpis?.spend ?? -1;
          break;
        case "status":
          valA = a.status;
          valB = b.status;
          break;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [clients, sortKey, sortDir]);

  const headerClass =
    "py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  const ariaSortValue = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  const getStatusLabel = (status: string): string => {
    if (status === 'live') return t('ampel.live');
    if (status === 'paused' || status === 'churned') return t('ampel.inactive');
    return t('ampel.inProgress');
  };

  return (
    <>
      <PageMeta
        title={`${t("dashboard.title")} | Kunden Hub`}
        description="Fulfillment Dashboard"
      />
      <PageBreadcrumb pageTitle={t("breadcrumb.overview")} />
      <div className="space-y-6">

        {/* ===== TOP: KPI Cards (5er Grid) ===== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
          {/* 1. Aktive Kunden */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.activeClients")}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {activeClients.length}
                </h4>
              </div>
              {liveClients.length > 0 && (
                <span className="text-xs text-success-500 font-medium">{liveClients.length} live</span>
              )}
            </div>
          </div>

          {/* 2. Gesamt Leads */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <ShootingStarIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.totalLeads")}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {liveClients.length > 0 ? totalLeads : "\u2014"}
                </h4>
              </div>
            </div>
          </div>

          {/* 3. Ø CPL (gewichtet) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.avgCpl")}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {avgCpl > 0
                    ? `\u20AC${avgCpl.toFixed(2)}`
                    : "\u2014"}
                </h4>
              </div>
            </div>
          </div>

          {/* 4. Gesamtspend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.totalSpend")}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {totalSpend > 0
                    ? `\u20AC${totalSpend.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`
                    : "\u2014"}
                </h4>
              </div>
            </div>
          </div>

          {/* 5. MRR */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <CheckCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.mrr")}
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {`\u20AC${mrr.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MIDDLE: Two-column grid ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
          <PipelineKanban />
          <TeamCapacity />
        </div>

        {/* ===== BOTTOM: Alerts, Approvals, AI Suggestions ===== */}

        {/* Alerts Section */}
        {unacknowledgedAlerts.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("dashboard.urgentAlerts")}
            </h3>
            <div className="space-y-3">
              {unacknowledgedAlerts.map((alert: AlertType) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.02] ${severityBorder(alert.severity)}`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      if (alert.clientId) {
                        navigate(`/kunden-hub/clients/${alert.clientId}`);
                      }
                    }}
                  >
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {alert.description}
                    </p>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                    title={t("action.done")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("dashboard.openApprovals")}
            </h3>
            <div className="space-y-3">
              {pendingApprovals.map((approval: Approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {approval.clientName}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {approval.deliverableTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmApproval({ id: approval.deliverableId, title: approval.deliverableTitle })}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {t("action.approve")}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/kunden-hub/clients/${approval.clientId}`)
                      }
                    >
                      {t("action.view")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <AiSuggestions />

        {/* ===== AFTER: Client Table + Activity Feed side by side ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
          {/* Client Table (2/3 width) */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.clientTable")}
              </h3>
            </div>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("company")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("company")}>
                        {t("table.client")}{sortIndicator("company")}
                      </button>
                    </TableCell>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("currentPhase")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("currentPhase")}>
                        {t("table.phase")}{sortIndicator("currentPhase")}
                      </button>
                    </TableCell>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("leads")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("leads")}>
                        {t("table.leads")}{sortIndicator("leads")}
                      </button>
                    </TableCell>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("cpl")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("cpl")}>
                        {t("table.cpl")}{sortIndicator("cpl")}
                      </button>
                    </TableCell>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("spend")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("spend")}>
                        {t("table.spend")}{sortIndicator("spend")}
                      </button>
                    </TableCell>
                    <TableCell isHeader className={headerClass} aria-sort={ariaSortValue("status")}>
                      <button type="button" className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        {t("table.status")}{sortIndicator("status")}
                      </button>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedClients.map((client: Client) => {
                    const cfg = CLIENT_STATUS_CONFIG[client.status] || { label: client.status, color: 'text-gray-400', bgColor: 'bg-gray-100' };
                    return (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                      >
                        <TableCell
                          className="py-3"
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => navigate(`/kunden-hub/clients/${client.id}`)}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                                client.status === 'live' ? 'bg-success-500' :
                                client.status === 'paused' || client.status === 'churned' ? 'bg-error-400' :
                                'bg-warning-400'
                              }`}
                              role="img"
                              aria-label={getStatusLabel(client.status)}
                            />
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {client.company}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {cfg.label}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {client.kpis ? client.kpis.leads : "\u2014"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {client.kpis
                            ? `\u20AC${client.kpis.cpl.toFixed(2)}`
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {client.kpis
                            ? `\u20AC${client.kpis.spend.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            size="sm"
                            variant="light"
                            color={statusToBadgeColor(client.status)}
                          >
                            {cfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {clients.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("dashboard.noClients")}
                  </p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    {t("dashboard.noClientsDesc")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed (1/3 width) */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for approve */}
      <Modal isOpen={!!confirmApproval} onClose={() => setConfirmApproval(null)} className="max-w-md p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          {t("dialog.confirmApprove")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          &quot;{confirmApproval?.title}&quot;
        </p>
        <div className="flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={() => setConfirmApproval(null)}>
            {t("action.cancel")}
          </Button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 active:scale-[0.98]"
            onClick={() => {
              if (confirmApproval) {
                approveDeliverable(confirmApproval.id);
              }
              setConfirmApproval(null);
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {t("dialog.yesApprove")}
          </button>
        </div>
      </Modal>
    </>
  );
}
