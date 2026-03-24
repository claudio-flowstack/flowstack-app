import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import type { ApexOptions } from "apexcharts";

// Lazy-load react-apexcharts to avoid runtime crash if window/document not ready
const Chart = lazy(() => import("react-apexcharts"));
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
  ArrowUpIcon,
  ArrowDownIcon,
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

  const avgCpl = useMemo(() => {
    if (liveClients.length === 0) return 0;
    return (
      liveClients.reduce((sum, c) => sum + (c.kpis?.cpl ?? 0), 0) / liveClients.length
    );
  }, [liveClients]);

  const mrr = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.monatspreis ?? 0), 0);
  }, [clients]);

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

  // Chart data computed from real client KPIs
  const leadsChartData = useMemo(() => {
    const tl = liveClients.reduce((sum, c) => sum + (c.kpis?.leads ?? 0), 0);
    const dailyAvg = tl / 30;
    // Use deterministic pseudo-random based on index (no Math.random to avoid re-render instability)
    return Array.from({ length: 30 }, (_, i) => {
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const pseudoRandom = seed - Math.floor(seed); // 0..1 deterministic
      const variation = (Math.sin(i * 0.5) * 0.3 + (pseudoRandom - 0.5) * 0.4) * dailyAvg;
      return Math.max(0, Math.round(dailyAvg + variation));
    });
  }, [liveClients]);

  const leadsDateLabels = useMemo(() => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(`${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    }
    return labels;
  }, []);

  const spendChartData = useMemo(() => {
    const totalSpend = liveClients.reduce((sum, c) => sum + (c.kpis?.spend ?? 0), 0);
    const weeklyAvg = totalSpend / 4;
    return [
      Math.round(weeklyAvg * 0.85),
      Math.round(weeklyAvg * 0.95),
      Math.round(weeklyAvg * 1.05),
      Math.round(weeklyAvg * 1.15),
    ];
  }, [liveClients]);

  const spendWeekLabels = useMemo(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
    const currentWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return [
      `KW ${currentWeek - 3}`,
      `KW ${currentWeek - 2}`,
      `KW ${currentWeek - 1}`,
      `KW ${currentWeek}`,
    ];
  }, []);

  // Chart configs (memoized to prevent ApexCharts re-render loops)
  const leadsChartOptions: ApexOptions = useMemo(() => ({
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line" as const,
      toolbar: { show: false },
    },
    stroke: { curve: "straight" as const, width: [2, 2] },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    xaxis: {
      type: "category" as const,
      categories: leadsDateLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -45,
        hideOverlappingLabels: true,
        style: { fontSize: "10px", colors: ["#6B7280"] },
      },
      tickAmount: 6,
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
      title: { text: "" },
    },
  }), [leadsDateLabels]);

  const leadsChartSeries = useMemo(() => [
    {
      name: "Leads",
      data: leadsChartData,
    },
  ], [leadsChartData]);

  const spendChartOptions: ApexOptions = useMemo(() => ({
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar" as const,
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end" as const,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: spendWeekLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString("de-DE")} \u20AC` },
    },
  }), [spendWeekLabels]);

  const spendChartSeries = useMemo(() => [
    { name: "Spend", data: spendChartData },
  ], [spendChartData]);

  const headerClass =
    "py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer select-none";

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  return (
    <>
      <PageMeta
        title={`${t("dashboard.title")} | Kunden Hub`}
        description="Fulfillment Dashboard"
      />
      <PageBreadcrumb pageTitle={t("breadcrumb.overview")} />
      <div className="space-y-6">

        {/* ===== TOP: KPI Cards (4er Grid) ===== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400">
                <ArrowUpIcon className="size-3" />
                +50%
              </span>
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
                  {totalLeads}
                </h4>
              </div>
              {totalLeads > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400">
                  <ArrowUpIcon className="size-3" />
                  +12%
                </span>
              )}
            </div>
          </div>

          {/* 3. Avg CPL */}
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
              {avgCpl > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400">
                  <ArrowDownIcon className="size-3" />
                  -8%
                </span>
              )}
            </div>
          </div>

          {/* 4. MRR */}
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
              <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400">
                <ArrowUpIcon className="size-3" />
                +33%
              </span>
            </div>
          </div>
        </div>

        {/* ===== MIDDLE: Two-column grid ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
          {/* Left column */}
          <div className="space-y-4 md:space-y-6">
            <PipelineKanban />
            <TeamCapacity />
          </div>

          {/* Right column */}
          <div className="space-y-4 md:space-y-6">
            {/* Leads Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.leadsOverTime")}
              </h3>
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="min-w-[500px] xl:min-w-full">
                  <Suspense fallback={<div className="h-[310px]" />}>
                    <Chart
                      options={leadsChartOptions}
                      series={leadsChartSeries}
                      type="area"
                      height={310}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Spend Chart */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.spendPerWeek")}
              </h3>
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="-ml-5 min-w-[300px] xl:min-w-full pl-2">
                  <Suspense fallback={<div className="h-[180px]" />}>
                    <Chart
                      options={spendChartOptions}
                      series={spendChartSeries}
                      type="bar"
                      height={180}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
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
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("company")}>
                        {t("table.client")}{sortIndicator("company")}
                      </span>
                    </TableCell>
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("currentPhase")}>
                        {t("table.phase")}{sortIndicator("currentPhase")}
                      </span>
                    </TableCell>
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("leads")}>
                        {t("table.leads")}{sortIndicator("leads")}
                      </span>
                    </TableCell>
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("cpl")}>
                        {t("table.cpl")}{sortIndicator("cpl")}
                      </span>
                    </TableCell>
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("spend")}>
                        {t("table.spend")}{sortIndicator("spend")}
                      </span>
                    </TableCell>
                    <TableCell
                      isHeader
                      className={headerClass}
                    >
                      <span onClick={() => toggleSort("status")}>
                        {t("table.status")}{sortIndicator("status")}
                      </span>
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
                            <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                              client.status === 'live' ? 'bg-success-500' :
                              client.status === 'paused' || client.status === 'churned' ? 'bg-error-400' :
                              'bg-warning-400'
                            }`} />
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
