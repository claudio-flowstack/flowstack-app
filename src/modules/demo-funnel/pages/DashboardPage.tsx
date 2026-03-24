/**
 * DashboardPage - Premium Marketing Analytics Dashboard
 * FULLY INTERACTIVE - Every element works as intended
 */

import React, { useState, useEffect, useMemo, ReactNode } from "react";
import {
  loadMarketingCampaigns, saveMarketingCampaigns,
  loadMarketingLeads, saveMarketingLeads,
} from '../data/marketingStorage';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Bell,
  Search,
  MoreHorizontal,
  Layers,
  Zap,
  PieChart,
  Activity,
  X,
  Check,
  ExternalLink,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  FileText,
  Play,
  Pause,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Sun,
  Moon,
  GitCompare,
  Wallet,
  MousePointer,
  UserCheck,
  ShoppingCart,
  Flag,
  Briefcase,
  Receipt,
  Timer,
  ChevronRight,
  ChevronLeft,
  Menu,
  LayoutDashboard,
  Cpu,
} from "lucide-react";
import { LanguageProvider, useLanguage } from '../i18n/LanguageContext';
import ConfirmDialog, { useModalEsc } from '../components/ui/ConfirmDialog';

// ============================================
// TYPES
// ============================================
interface CampaignData {
  id: string;
  name: string;
  status: "active" | "paused" | "ended";
  platform: "meta" | "google" | "tiktok" | "linkedin";
  spend: number;
  revenue: number;
  roas: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cvr: number;
}

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: "meta" | "google" | "tiktok" | "linkedin";
  campaign: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  date: string;
  value: number;
}

interface Notification {
  id: string;
  type: "lead" | "alert" | "conversion" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface ApiConnection {
  id: string;
  name: string;
  platform: "meta" | "google" | "tiktok" | "linkedin";
  connected: boolean;
  lastSync?: string;
  accountName?: string;
  icon: ReactNode;
  color: string;
}

type ActiveSection = "dashboard" | "campaigns" | "leads" | "funnel" | "goals" | "budget" | "compare" | "revenue" | "reports" | "monitor" | "settings";
type DateRange = "today" | "7d" | "30d" | "90d" | "6m" | "12m" | "custom";
type Platform = "all" | "meta" | "google" | "tiktok" | "linkedin";
type SortField = "name" | "spend" | "revenue" | "roas" | "leads" | "cpl" | "ctr" | "cvr";
type SortDirection = "asc" | "desc";

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  icon: ReactNode;
  color: string;
}

interface BudgetData {
  platform: string;
  budget: number;
  spent: number;
  remaining: number;
  daysLeft: number;
  dailyPace: number;
  recommendedPace: number;
}

// ============================================
// MOCK DATA
// ============================================
const generateMetrics = (dateRange: DateRange, platform: Platform, customDays?: number) => {
  if (dateRange === "custom" && customDays) {
    const m = (customDays / 7);
    const platformData: Record<Platform, { share: number; roas: number }> = {
      all: { share: 1, roas: 3.6 }, meta: { share: 0.65, roas: 3.5 }, google: { share: 0.25, roas: 4.2 }, tiktok: { share: 0.07, roas: 2.1 }, linkedin: { share: 0.03, roas: 2.8 },
    };
    const p = platformData[platform];
    const baseSpend = 24850 * m * p.share;
    const baseLeads = 342 * m * p.share;
    return { totalSpend: Math.round(baseSpend), totalRevenue: Math.round(baseSpend * p.roas), totalLeads: Math.round(baseLeads), totalRoas: p.roas, avgCpl: baseLeads > 0 ? Math.round((baseSpend / baseLeads) * 100) / 100 : 0, avgCpa: baseLeads > 0 ? Math.round((baseSpend / (baseLeads * 0.5)) * 100) / 100 : 0, totalImpressions: Math.round(1245000 * m * p.share), totalClicks: Math.round(18675 * m * p.share), avgCtr: 1.5 + Math.random() * 0.3, avgCvr: 1.83 + Math.random() * 0.2, totalConversions: Math.round(171 * m * p.share), avgCpm: 19.96 };
  }
  const mult: Record<string, number> = { today: 0.15, "7d": 1, "30d": 4.2, "90d": 12, "6m": 26, "12m": 52 };
  const m = mult[dateRange] ?? 1;
  const platformData = {
    all: { share: 1, roas: 3.6 },
    meta: { share: 0.65, roas: 3.5 },
    google: { share: 0.25, roas: 4.2 },
    tiktok: { share: 0.07, roas: 2.1 },
    linkedin: { share: 0.03, roas: 2.8 },
  };
  const p = platformData[platform];
  const baseSpend = 24850 * m * p.share;
  const baseLeads = 342 * m * p.share;
  return {
    totalSpend: Math.round(baseSpend),
    totalRevenue: Math.round(baseSpend * p.roas),
    totalLeads: Math.round(baseLeads),
    totalRoas: p.roas,
    avgCpl: baseLeads > 0 ? Math.round((baseSpend / baseLeads) * 100) / 100 : 0,
    avgCpa: baseLeads > 0 ? Math.round((baseSpend / (baseLeads * 0.5)) * 100) / 100 : 0,
    totalImpressions: Math.round(1245000 * m * p.share),
    totalClicks: Math.round(18675 * m * p.share),
    avgCtr: 1.5 + Math.random() * 0.3,
    avgCvr: 1.83 + Math.random() * 0.2,
    totalConversions: Math.round(171 * m * p.share),
    avgCpm: 19.96,
  };
};

const generateChartData = (dateRange: DateRange, customDays?: number) => {
  const points: Record<string, number> = { today: 24, "7d": 7, "30d": 30, "90d": 12, "6m": 26, "12m": 12, custom: customDays ? Math.min(customDays, 60) : 14 };
  const numPoints = points[dateRange] ?? 14;
  return Array.from({ length: numPoints }, (_, i) => {
    const spend = 2000 + Math.random() * 3000;
    return {
      date: dateRange === "today" ? `${i}:00` : dateRange === "90d" || dateRange === "12m" ? `KW ${i + 1}` : dateRange === "6m" ? `KW ${i + 1}` : `${String(i + 1).padStart(2, "0")}.01`,
      value: Math.round(spend),
      value2: Math.round(spend * (2.5 + Math.random() * 2)),
    };
  });
};

const allCampaigns: CampaignData[] = [
  { id: "1", name: "Brand Awareness Q1", status: "active", platform: "meta", spend: 8450, revenue: 32400, roas: 3.83, leads: 124, cpl: 68.15, impressions: 456000, clicks: 6840, ctr: 1.5, conversions: 62, cvr: 0.91 },
  { id: "2", name: "Lead Gen - Retargeting", status: "active", platform: "meta", spend: 5200, revenue: 21800, roas: 4.19, leads: 89, cpl: 58.43, impressions: 234000, clicks: 4212, ctr: 1.8, conversions: 44, cvr: 1.04 },
  { id: "3", name: "Google Search - Brand", status: "active", platform: "google", spend: 3800, revenue: 18900, roas: 4.97, leads: 67, cpl: 56.72, impressions: 89000, clicks: 3560, ctr: 4.0, conversions: 34, cvr: 0.96 },
  { id: "4", name: "Prospecting - Lookalike", status: "paused", platform: "meta", spend: 4200, revenue: 9800, roas: 2.33, leads: 38, cpl: 110.53, impressions: 312000, clicks: 2808, ctr: 0.9, conversions: 19, cvr: 0.68 },
  { id: "5", name: "YouTube Discovery", status: "active", platform: "google", spend: 3200, revenue: 6520, roas: 2.04, leads: 24, cpl: 133.33, impressions: 154000, clicks: 1255, ctr: 0.81, conversions: 12, cvr: 0.96 },
  { id: "6", name: "TikTok Awareness", status: "active", platform: "tiktok", spend: 1800, revenue: 3200, roas: 1.78, leads: 18, cpl: 100, impressions: 520000, clicks: 3120, ctr: 0.6, conversions: 8, cvr: 0.26 },
  { id: "7", name: "LinkedIn B2B", status: "active", platform: "linkedin", spend: 2400, revenue: 8400, roas: 3.5, leads: 12, cpl: 200, impressions: 45000, clicks: 675, ctr: 1.5, conversions: 6, cvr: 0.89 },
  { id: "8", name: "TikTok Conversion", status: "paused", platform: "tiktok", spend: 950, revenue: 1400, roas: 1.47, leads: 8, cpl: 118.75, impressions: 180000, clicks: 1080, ctr: 0.6, conversions: 3, cvr: 0.28 },
];

const allLeads: LeadData[] = [
  { id: "1", name: "Max Mustermann", email: "max@example.com", phone: "+49 170 1234567", source: "meta", campaign: "Brand Awareness Q1", status: "qualified", date: "Heute, 14:32", value: 2500 },
  { id: "2", name: "Anna Schmidt", email: "anna@company.de", phone: "+49 171 2345678", source: "google", campaign: "Google Search - Brand", status: "contacted", date: "Heute, 11:15", value: 0 },
  { id: "3", name: "Thomas Weber", email: "t.weber@firma.com", phone: "+49 172 3456789", source: "meta", campaign: "Lead Gen - Retargeting", status: "new", date: "Gestern, 16:45", value: 0 },
  { id: "4", name: "Sarah Müller", email: "s.mueller@business.de", phone: "+49 173 4567890", source: "linkedin", campaign: "LinkedIn B2B", status: "qualified", date: "Gestern, 09:20", value: 5000 },
  { id: "5", name: "Michael Koch", email: "m.koch@gmbh.de", phone: "+49 174 5678901", source: "google", campaign: "Google Search - Brand", status: "converted", date: "02.01.2025", value: 8500 },
  { id: "6", name: "Lisa Hoffmann", email: "l.hoffmann@startup.io", phone: "+49 175 6789012", source: "meta", campaign: "Prospecting - Lookalike", status: "lost", date: "01.01.2025", value: 0 },
  { id: "7", name: "David Braun", email: "d.braun@agency.com", phone: "+49 176 7890123", source: "tiktok", campaign: "TikTok Awareness", status: "new", date: "01.01.2025", value: 0 },
  { id: "8", name: "Julia Fischer", email: "j.fischer@corp.de", phone: "+49 177 8901234", source: "meta", campaign: "Brand Awareness Q1", status: "contacted", date: "31.12.2024", value: 0 },
];

const notificationData: Record<string, { de: { title: string; message: string; time: string }; en: { title: string; message: string; time: string } }> = {
  "1": { de: { title: "Neuer Lead", message: "Max Mustermann über Meta Ads", time: "Vor 5 Min" }, en: { title: "New lead", message: "Max Mustermann via Meta Ads", time: "5 min ago" } },
  "2": { de: { title: "Conversion!", message: "Michael Koch hat konvertiert (€8.500)", time: "Vor 1 Std" }, en: { title: "Conversion!", message: "Michael Koch converted (€8,500)", time: "1 hr ago" } },
  "3": { de: { title: "Budget-Warnung", message: "TikTok Awareness: 85% Budget verbraucht", time: "Vor 2 Std" }, en: { title: "Budget warning", message: "TikTok Awareness: 85% budget spent", time: "2 hrs ago" } },
  "4": { de: { title: "Sync abgeschlossen", message: "Meta Ads Daten aktualisiert", time: "Vor 3 Std" }, en: { title: "Sync complete", message: "Meta Ads data updated", time: "3 hrs ago" } },
};
const initialNotifications: Notification[] = [
  { id: "1", type: "lead", title: "Neuer Lead", message: "Max Mustermann über Meta Ads", time: "Vor 5 Min", read: false },
  { id: "2", type: "conversion", title: "Conversion!", message: "Michael Koch hat konvertiert (€8.500)", time: "Vor 1 Std", read: false },
  { id: "3", type: "alert", title: "Budget-Warnung", message: "TikTok Awareness: 85% Budget verbraucht", time: "Vor 2 Std", read: false },
  { id: "4", type: "info", title: "Sync abgeschlossen", message: "Meta Ads Daten aktualisiert", time: "Vor 3 Std", read: true },
];

const platformColors = {
  meta: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", fill: "fill-blue-500", solid: "bg-blue-500" },
  google: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", fill: "fill-emerald-500", solid: "bg-emerald-500" },
  tiktok: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20", fill: "fill-pink-500", solid: "bg-pink-500" },
  linkedin: { bg: "bg-sky-500/10", text: "text-sky-500", border: "border-sky-500/20", fill: "fill-sky-500", solid: "bg-sky-500" },
};

const statusColors = {
  new: { bg: "bg-purple-100", text: "text-purple-600" },
  contacted: { bg: "bg-yellow-100", text: "text-yellow-600" },
  qualified: { bg: "bg-emerald-100", text: "text-emerald-600" },
  converted: { bg: "bg-blue-100", text: "text-blue-600" },
  lost: { bg: "bg-gray-100", text: "text-gray-600" },
};

const getStatusLabels = (lang: string) => lang === 'de' ? { new: "Neu", contacted: "Kontaktiert", qualified: "Qualifiziert", converted: "Konvertiert", lost: "Verloren" } : { new: "New", contacted: "Contacted", qualified: "Qualified", converted: "Converted", lost: "Lost" };

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatCurrency = (v: number) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const formatNumber = (v: number) => v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(1) + "K" : v.toFixed(0);
const formatPercent = (v: number) => v.toFixed(2) + "%";

const exportToCSV = (data: CampaignData[], filename: string) => {
  const headers = ["Name", "Platform", "Status", "Spend", "Revenue", "ROAS", "Leads", "CPL", "Impressions", "Clicks", "CTR", "Conversions", "CVR"];
  const rows = data.map(c => [c.name, c.platform, c.status, c.spend, c.revenue, c.roas, c.leads, c.cpl, c.impressions, c.clicks, c.ctr, c.conversions, c.cvr]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================
// COMPONENTS
// ============================================

// Notification Dropdown
const NotificationDropdown = ({ notifications, onMarkRead, onClear }: { notifications: Notification[]; onMarkRead: (id: string) => void; onClear: () => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const iconMap = {
    lead: <Users className="w-4 h-4 text-purple-500" />,
    conversion: <DollarSign className="w-4 h-4 text-emerald-500" />,
    alert: <AlertCircle className="w-4 h-4 text-amber-500" />,
    info: <Bell className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx("Benachrichtigungen", "Notifications")}>
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{tx("Benachrichtigungen", "Notifications")}</h3>
              {notifications.length > 0 && (
                <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700">{tx("Alle löschen", "Clear all")}</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">{tx("Keine Benachrichtigungen", "No notifications")}</div>
              ) : (
                notifications.map(n => {
                  const nd = notificationData[n.id]?.[lang] || { title: n.title, message: n.message, time: n.time };
                  return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${!n.read ? "bg-purple-50/50 dark:bg-purple-500/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{iconMap[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{nd.title}</p>
                          {!n.read && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{nd.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{nd.time}</p>
                      </div>
                    </div>
                  </div>
                );})
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Custom Dropdown Component
const CustomDropdown = <T extends string>({
  value,
  onChange,
  options,
  icon
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  icon?: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                  value === option.value
                    ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-medium"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {option.label}
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Interactive Area Chart with Tooltips
const AreaChart = ({ data, height = 300 }: { data: { date: string; value: number; value2: number }[]; height?: number }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const [hovered, setHovered] = useState<number | null>(null);
  if (data.length === 0) return null;

  const max = Math.max(...data.map(d => Math.max(d.value, d.value2))) * 1.1;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;

  // Show fewer labels when many data points (every nth label)
  const labelInterval = data.length > 20 ? 7 : data.length > 10 ? 3 : 1;
  const showDots = data.length <= 15; // Hide dots when too many points

  const getX = (i: number) => padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  const getY = (v: number) => padding.top + chartHeight - (v / max) * chartHeight;

  const spendPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.value)}`).join(" ");
  const revPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.value2)}`).join(" ");
  const spendArea = `M ${getX(0)} ${getY(0)} ${spendPath.slice(1)} L ${getX(data.length - 1)} ${getY(0)} Z`;
  const revArea = `M ${getX(0)} ${getY(0)} ${revPath.slice(1)} L ${getX(data.length - 1)} ${getY(0)} Z`;

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - p)}
              x2={chartWidth - padding.right}
              y2={padding.top + chartHeight * (1 - p)}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
            <text
              x={padding.left - 10}
              y={padding.top + chartHeight * (1 - p) + 4}
              textAnchor="end"
              className="fill-gray-400 text-xs"
            >
              €{formatNumber(max * p)}
            </text>
          </g>
        ))}

        {/* Areas */}
        <path d={revArea} fill="url(#revGradient)" />
        <path d={spendArea} fill="url(#spendGradient)" />

        {/* Lines */}
        <path d={revPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={spendPath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover indicator */}
        {hovered !== null && (
          <line
            x1={getX(hovered)}
            y1={padding.top}
            x2={getX(hovered)}
            y2={height - padding.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="6"
          />
        )}

        {/* Data points - show all when few, or only hovered when many */}
        {data.map((d, i) => (
          <g key={i} className={showDots || hovered === i ? "opacity-100" : "opacity-0"}>
            <circle
              cx={getX(i)}
              cy={getY(d.value2)}
              r={hovered === i ? 8 : 5}
              fill="#10b981"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-150"
            />
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r={hovered === i ? 8 : 5}
              fill="#8b5cf6"
              stroke="white"
              strokeWidth="3"
              className="transition-all duration-150"
            />
          </g>
        ))}

        {/* X-axis labels - show every nth label when many data points */}
        {data.map((d, i) => (
          (i % labelInterval === 0 || i === data.length - 1 || hovered === i) && (
            <text
              key={i}
              x={getX(i)}
              y={height - 10}
              textAnchor="middle"
              className={`text-xs ${hovered === i ? "fill-gray-900 dark:fill-white font-medium" : "fill-gray-400"}`}
            >
              {d.date}
            </text>
          )
        ))}

        {/* Hover zones */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={getX(i) - (chartWidth - padding.left - padding.right) / data.length / 2}
            y={padding.top}
            width={(chartWidth - padding.left - padding.right) / data.length}
            height={chartHeight}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div
          className="absolute z-20 pointer-events-none bg-gray-900 text-white rounded-xl p-4 shadow-2xl text-sm min-w-[180px]"
          style={{
            left: `${Math.min(Math.max((getX(hovered) / chartWidth) * 100, 15), 70)}%`,
            top: "20px",
            transform: "translateX(-50%)"
          }}
        >
          <p className="text-gray-400 text-xs mb-3 font-medium">{data[hovered].date}</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-300">{tx("Ausgaben", "Spend")}</span>
            <span className="font-bold ml-auto">€{formatCurrency(data[hovered].value)}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-300">{tx("Umsatz", "Revenue")}</span>
            <span className="font-bold ml-auto">€{formatCurrency(data[hovered].value2)}</span>
          </div>
          <div className="pt-3 border-t border-gray-700 flex justify-between items-center">
            <span className="text-gray-400">ROAS</span>
            <span className="font-bold text-emerald-400 text-lg">{(data[hovered].value2 / data[hovered].value).toFixed(2)}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Donut Chart
const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = 0;
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const a = (item.value / total) * 360;
          const start = angle;
          angle += a;
          const r1 = (start * Math.PI) / 180, r2 = ((start + a) * Math.PI) / 180;
          const x1 = 50 + 40 * Math.cos(r1), y1 = 50 + 40 * Math.sin(r1);
          const x2 = 50 + 40 * Math.cos(r2), y2 = 50 + 40 * Math.sin(r2);
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${a > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
              className={`${item.color} transition-transform cursor-pointer`}
              style={{ transform: hovered === i ? "scale(1.05)" : "scale(1)", transformOrigin: "50px 50px" }}
              stroke="white"
              strokeWidth="2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-900" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{hovered !== null ? `€${formatNumber(data[hovered].value)}` : `€${formatNumber(total)}`}</span>
        <span className="text-xs text-gray-400">{hovered !== null ? data[hovered].label : tx("Gesamt", "Total")}</span>
      </div>
    </div>
  );
};

// Lead Detail Modal
const LeadDetailModal = ({ lead, onClose, onStatusChange, onEmail, onCall }: { lead: LeadData | null; onClose: () => void; onStatusChange: (id: string, status: LeadData["status"]) => void; onEmail: (lead: LeadData) => void; onCall: (lead: LeadData) => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const statusLabels = getStatusLabels(lang);
  useModalEsc(!!lead, onClose);
  if (!lead) return null;
  const colors = platformColors[lead.source];
  const sc = statusColors[lead.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 max-w-lg w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Schließen', 'Close')}><X className="w-5 h-5 text-gray-400" /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full ${colors.solid} flex items-center justify-center text-white text-xl font-bold`}>{lead.name.charAt(0)}</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{lead.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>{statusLabels[lead.status]}</span>
          </div>
        </div>
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Mail className="w-5 h-5 text-gray-400" />
            <a href={`mailto:${lead.email}`} className="text-gray-900 dark:text-white hover:text-purple-500 transition-colors">{lead.email}</a>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Phone className="w-5 h-5 text-gray-400" />
            <a href={`tel:${lead.phone}`} className="text-gray-900 dark:text-white hover:text-purple-500 transition-colors">{lead.phone}</a>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{lead.date}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-xs text-gray-500 mb-1">{tx("Quelle", "Source")}</p><p className={`font-medium ${colors.text}`}>{lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}</p></div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-xs text-gray-500 mb-1">{tx("Wert", "Value")}</p><p className="font-medium text-emerald-500">{lead.value > 0 ? `€${formatCurrency(lead.value)}` : "—"}</p></div>
        </div>
        <div className="mb-6"><p className="text-sm text-gray-500 mb-2">{tx("Kampagne", "Campaign")}</p><p className="font-medium text-gray-900 dark:text-white">{lead.campaign}</p></div>
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">{tx("Status ändern", "Change status")}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusLabels) as LeadData["status"][]).map(s => (
              <button key={s} onClick={() => { onStatusChange(lead.id, s); onClose(); }} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${lead.status === s ? `${statusColors[s].bg} ${statusColors[s].text}` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{statusLabels[s]}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onEmail(lead)} className="flex-1 py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 flex items-center justify-center gap-2"><Mail className="w-4 h-4" />{tx("E-Mail", "Email")}</button>
          <button onClick={() => onCall(lead)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2"><Phone className="w-4 h-4" />{tx("Anrufen", "Call")}</button>
        </div>
      </div>
    </div>
  );
};

// Campaign Actions Modal
const CampaignActionsModal = ({ campaign, onClose, onAction }: { campaign: CampaignData | null; onClose: () => void; onAction: (action: string, id: string) => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  useModalEsc(!!campaign, onClose);
  if (!campaign) return null;
  const colors = platformColors[campaign.platform];
  const actions = [
    { icon: <Eye className="w-5 h-5" />, label: tx("Details anzeigen", "View details"), action: "view" },
    { icon: campaign.status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />, label: campaign.status === "active" ? tx("Pausieren", "Pause") : tx("Aktivieren", "Activate"), action: "toggle" },
    { icon: <Edit3 className="w-5 h-5" />, label: tx("Bearbeiten", "Edit"), action: "edit" },
    { icon: <Copy className="w-5 h-5" />, label: tx("Duplizieren", "Duplicate"), action: "duplicate" },
    { icon: <Download className="w-5 h-5" />, label: tx("Report exportieren", "Export report"), action: "export" },
    { icon: <Trash2 className="w-5 h-5 text-red-500" />, label: tx("Löschen", "Delete"), action: "delete", danger: true },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className={`w-3 h-3 rounded-full ${campaign.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} />
          <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{campaign.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>{campaign.platform.toUpperCase()}</span>
        </div>
        <div className="space-y-1">
          {actions.map(a => (
            <button key={a.action} onClick={() => { onAction(a.action, campaign.id); if (a.action !== "view") onClose(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${a.danger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {a.icon}<span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Campaign Edit Modal
const CampaignEditModal = ({ campaign, onClose, onSave }: { campaign: CampaignData | null; onClose: () => void; onSave: (updated: CampaignData) => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  useModalEsc(!!campaign, onClose);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<CampaignData['platform']>('meta');
  const [status, setStatus] = useState<CampaignData['status']>('paused');
  useEffect(() => { if (campaign) { setName(campaign.name); setPlatform(campaign.platform); setStatus(campaign.status); } }, [campaign]);
  if (!campaign) return null;
  const inputCls = "w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4 text-gray-400" /></button>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{tx('Kampagne bearbeiten', 'Edit Campaign')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{tx('Name', 'Name')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder={tx('Kampagnen-Name', 'Campaign name')} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{tx('Plattform', 'Platform')}</label>
            <select value={platform} onChange={e => setPlatform(e.target.value as CampaignData['platform'])} className={inputCls}>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="linkedin">LinkedIn Ads</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as CampaignData['status'])} className={inputCls}>
              <option value="active">{tx('Aktiv', 'Active')}</option>
              <option value="paused">{tx('Pausiert', 'Paused')}</option>
              <option value="ended">{tx('Beendet', 'Ended')}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{tx('Abbrechen', 'Cancel')}</button>
          <button onClick={() => { onSave({ ...campaign, name: name.trim() || campaign.name, platform, status }); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors">{tx('Speichern', 'Save')}</button>
        </div>
      </div>
    </div>
  );
};

// Campaign Detail View
const CampaignDetailModal = ({ campaign, onClose }: { campaign: CampaignData | null; onClose: () => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  useModalEsc(!!campaign, onClose);
  if (!campaign) return null;
  const colors = platformColors[campaign.platform];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Schließen', 'Close')}><X className="w-5 h-5 text-gray-400" /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-3 h-3 rounded-full ${campaign.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.name}</h2>
          <span className={`text-sm px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>{campaign.platform.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: tx("Ausgaben", "Spend"), value: `€${formatCurrency(campaign.spend)}`, color: "text-gray-900 dark:text-white" }, { label: tx("Umsatz", "Revenue"), value: `€${formatCurrency(campaign.revenue)}`, color: "text-emerald-500" }, { label: "ROAS", value: `${campaign.roas.toFixed(2)}x`, color: campaign.roas >= 3 ? "text-emerald-500" : "text-yellow-500" }, { label: "Leads", value: campaign.leads.toString(), color: "text-gray-900 dark:text-white" }].map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"><p className="text-sm text-gray-500 mb-1">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
          ))}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{tx("Performance Details", "Performance Details")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[{ label: tx("Impressionen", "Impressions"), value: formatNumber(campaign.impressions) }, { label: tx("Klicks", "Clicks"), value: formatNumber(campaign.clicks) }, { label: "CTR", value: formatPercent(campaign.ctr) }, { label: "CPL", value: `€${campaign.cpl.toFixed(2)}` }, { label: "Conversions", value: campaign.conversions.toString() }, { label: "CVR", value: formatPercent(campaign.cvr) }].map((s, i) => (
            <div key={i} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><span className="text-gray-500">{s.label}</span><span className="font-medium text-gray-900 dark:text-white">{s.value}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Connection Modal
const ConnectionModal = ({ isOpen, onClose, connection }: { isOpen: boolean; onClose: () => void; connection: ApiConnection | null }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const [step, setStep] = useState<"intro" | "creds" | "info">("intro");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  useModalEsc(isOpen, onClose);
  useEffect(() => { if (isOpen) { setStep("intro"); setAppId(""); setAppSecret(""); } }, [isOpen]);
  if (!isOpen || !connection) return null;
  const urls: Record<string, { dev: string; doc: string }> = {
    meta: { dev: "https://developers.facebook.com/apps/", doc: "https://developers.facebook.com/docs/marketing-api/overview" },
    google: { dev: "https://console.cloud.google.com/apis/credentials", doc: "https://developers.google.com/google-ads/api/docs/start" },
    tiktok: { dev: "https://ads.tiktok.com/marketing_api/", doc: "https://ads.tiktok.com/marketing_api/docs" },
    linkedin: { dev: "https://www.linkedin.com/developers/apps/", doc: "https://docs.microsoft.com/en-us/linkedin/marketing/" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Schließen', 'Close')}><X className="w-5 h-5 text-gray-400" /></button>
        {step === "intro" && (
          <>
            <div className={`w-16 h-16 rounded-2xl ${connection.color} flex items-center justify-center mb-6`}>{connection.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tx("Mit", "Connect with")} {connection.name} {tx("verbinden", "")}</h2>
            <p className="text-gray-500 mb-6">{tx(`Um ${connection.name} zu verbinden, benötigst du API-Credentials aus dem Developer Portal.`, `To connect ${connection.name}, you need API credentials from the Developer Portal.`)}</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{tx("Was wir importieren:", "What we import:")}</h3>
              <ul className="space-y-2">{[tx("Kampagnen, Ad Sets & Ads", "Campaigns, Ad Sets & Ads"), tx("Ausgaben & Performance", "Spend & Performance"), tx("Leads & Conversions", "Leads & Conversions"), tx("Historische Daten", "Historical data")].map((t, i) => (<li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Check className="w-4 h-4 text-emerald-500" />{t}</li>))}</ul>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl mb-6"><AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" /><div className="text-sm text-amber-700 dark:text-amber-300"><p className="font-medium">{tx("API-Credentials erforderlich", "API credentials required")}</p><p>{tx("Du brauchst eine Developer App mit entsprechenden Berechtigungen.", "You need a developer app with the appropriate permissions.")}</p></div></div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep("creds")} className="py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600">{tx("Credentials eingeben", "Enter credentials")}</button>
              <button onClick={() => setStep("info")} className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200">{tx("Anleitung", "Guide")}</button>
            </div>
          </>
        )}
        {step === "creds" && (
          <>
            <button onClick={() => setStep("intro")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"><ChevronDown className="w-4 h-4 rotate-90" />{tx("Zurück", "Back")}</button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{connection.name} Credentials</h2>
            <div className="space-y-4 mb-6">
              <div><label className="block text-sm font-medium mb-2">App ID / Client ID</label><input type="text" value={appId} onChange={e => setAppId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-2">App Secret / Client Secret</label><input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" /></div>
            </div>
            <button onClick={() => { if (appId && appSecret) window.open(urls[connection.platform].dev, "_blank"); }} disabled={!appId || !appSecret} className={`w-full py-4 font-semibold rounded-xl flex items-center justify-center gap-2 ${appId && appSecret ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{tx("OAuth-Flow starten", "Start OAuth flow")}<ExternalLink className="w-4 h-4" /></button>
          </>
        )}
        {step === "info" && (
          <>
            <button onClick={() => setStep("intro")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"><ChevronDown className="w-4 h-4 rotate-90" />{tx("Zurück", "Back")}</button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{tx(`${connection.name} einrichten`, `Set up ${connection.name}`)}</h2>
            <div className="space-y-4 mb-6">{[{ n: 1, t: tx("Developer App erstellen", "Create developer app"), d: tx(`Gehe zu ${connection.name} Developer Portal`, `Go to ${connection.name} Developer Portal`) }, { n: 2, t: tx("API aktivieren", "Activate API"), d: tx("Aktiviere die Marketing/Ads API", "Activate the Marketing/Ads API") }, { n: 3, t: tx("OAuth Credentials erstellen", "Create OAuth credentials"), d: tx("Erstelle Client ID & Secret", "Create Client ID & Secret") }].map(s => (
              <div key={s.n} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"><div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 font-bold text-sm">{s.n}</div><h3 className="font-medium">{s.t}</h3></div><p className="text-sm text-gray-500 ml-11">{s.d}</p></div>
            ))}</div>
            <div className="grid grid-cols-2 gap-3">
              <a href={urls[connection.platform].dev} target="_blank" rel="noopener noreferrer" className="py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 flex items-center justify-center gap-2">Developer Portal<ExternalLink className="w-4 h-4" /></a>
              <a href={urls[connection.platform].doc} target="_blank" rel="noopener noreferrer" className="py-3 bg-gray-100 dark:bg-gray-800 font-semibold rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2">{tx("Dokumentation", "Documentation")}<ExternalLink className="w-4 h-4" /></a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Funnel Visualization Component
const FunnelChart = ({ data }: { data: { label: string; value: number; icon: ReactNode; color: string }[] }) => {
  const maxValue = data[0]?.value || 1;
  return (
    <div className="space-y-4">
      {data.map((step, i) => {
        const width = (step.value / maxValue) * 100;
        const convRate = i > 0 ? ((step.value / data[i - 1].value) * 100).toFixed(1) : "100";
        return (
          <div key={i} className="relative">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center text-white`}>{step.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{formatNumber(step.value)}</span>
                    {i > 0 && <span className="text-sm text-gray-500">({convRate}%)</span>}
                  </div>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${width}%` }} />
                </div>
              </div>
            </div>
            {i < data.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Goal Progress Component
const GoalCard = ({ goal, onEdit }: { goal: Goal; onEdit: (id: string) => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const isComplete = progress >= 100;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${goal.color} flex items-center justify-center`}>{goal.icon}</div>
        <button onClick={() => onEdit(goal.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl" title={tx('Ziel bearbeiten', 'Edit goal')}>
          <Edit3 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold">{formatNumber(goal.current)}</span>
        <span className="text-gray-500 mb-1">/ {formatNumber(goal.target)} {goal.unit}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-emerald-500" : "bg-purple-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className={isComplete ? "text-emerald-500 font-medium" : "text-gray-500"}>{progress.toFixed(0)}% {tx("erreicht", "reached")}</span>
        {isComplete && <span className="text-emerald-500">{tx("Ziel erreicht!", "Goal reached!")}</span>}
      </div>
    </div>
  );
};

// Budget Pacing Component
const BudgetPacing = ({ data }: { data: BudgetData[] }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const progress = (item.spent / item.budget) * 100;
        const paceStatus = item.dailyPace > item.recommendedPace * 1.1 ? "over" : item.dailyPace < item.recommendedPace * 0.9 ? "under" : "on";
        const statusColors = { over: "text-red-500", under: "text-yellow-500", on: "text-emerald-500" };
        const statusLabels = lang === 'de' ? { over: "Überschreitung", under: "Unterausgabe", on: "Im Plan" } : { over: "Overspending", under: "Underspending", on: "On track" };
        return (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${platformColors[item.platform as keyof typeof platformColors]?.solid || "bg-gray-500"}`} />
                <h3 className="font-semibold">{item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}</h3>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${paceStatus === "on" ? "bg-emerald-100 text-emerald-600" : paceStatus === "over" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                {statusLabels[paceStatus]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><p className="text-xs text-gray-500 mb-1">{tx("Budget", "Budget")}</p><p className="text-lg font-bold">€{formatCurrency(item.budget)}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">{tx("Ausgegeben", "Spent")}</p><p className="text-lg font-bold text-purple-500">€{formatCurrency(item.spent)}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">{tx("Verbleibend", "Remaining")}</p><p className="text-lg font-bold text-emerald-500">€{formatCurrency(item.remaining)}</p></div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all ${paceStatus === "over" ? "bg-red-500" : paceStatus === "under" ? "bg-yellow-500" : "bg-purple-500"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{item.daysLeft} {tx("Tage verbleibend", "days remaining")}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">{tx("Tagesbudget", "Daily budget")}: <span className={statusColors[paceStatus]}>€{item.dailyPace.toFixed(0)}</span></span>
                <span className="text-gray-400">{tx("Empfohlen", "Recommended")}: €{item.recommendedPace.toFixed(0)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Compare Metrics Component
const CompareCard = ({ label, current, previous, unit = "", prefix = "" }: { label: string; current: number; previous: number; unit?: string; prefix?: string }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
      <p className="text-sm text-gray-500 mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-purple-500 mb-1">{tx("Aktuell", "Current")}</p>
          <p className="text-2xl font-bold">{prefix}{formatNumber(current)}{unit}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">{tx("Vorher", "Previous")}</p>
          <p className="text-2xl font-bold text-gray-400">{prefix}{formatNumber(previous)}{unit}</p>
        </div>
      </div>
      <div className={`flex items-center gap-2 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
        <span className="text-gray-500">{tx("vs. Vorperiode", "vs. previous period")}</span>
      </div>
    </div>
  );
};

// Goal Edit Modal
const GoalEditModal = ({ goal, onClose, onSave }: { goal: Goal | null; onClose: () => void; onSave: (data: { id: string; target: number }) => void }) => {
  const { lang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const [target, setTarget] = useState(goal?.target || 0);
  useModalEsc(!!goal, onClose);

  useEffect(() => {
    if (goal) setTarget(goal.target);
  }, [goal]);

  // Ctrl+S / Cmd+S keyboard shortcut to save
  useEffect(() => {
    if (!goal) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave({ id: goal.id, target });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goal, target, onSave]);

  if (!goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Schließen', 'Close')}><X className="w-5 h-5 text-gray-400" /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-xl ${goal.color} flex items-center justify-center`}>{goal.icon}</div>
          <div>
            <h2 className="text-xl font-bold">{goal.name}</h2>
            <p className="text-sm text-gray-500">{tx("Aktuell", "Current")}: {formatNumber(goal.current)} {goal.unit}</p>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">{tx("Zielwert", "Target value")}</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              step={1}
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-lg font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <span className="text-gray-500">{goal.unit}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { onSave({ id: goal.id, target }); }} className="flex-1 py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600">{tx("Speichern", "Save")}</button>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200">{tx("Abbrechen", "Cancel")}</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DashboardContent = () => {
  const { lang, setLang } = useLanguage();
  const tx = (de: string, en: string) => lang === 'de' ? de : en;
  const statusLabels = getStatusLabels(lang);
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [customDateFrom, setCustomDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split("T")[0]; });
  const [customDateTo, setCustomDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [platform, setPlatform] = useState<Platform>("all");
  const [section, setSection] = useState<ActiveSection>("dashboard");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"campaigns" | "adsets" | "ads">("campaigns");
  const [darkMode, setDarkMode] = useState(false);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [compareRange, setCompareRange] = useState<"7d" | "30d" | "90d">("7d");
  const [expandedRevenueSource, setExpandedRevenueSource] = useState<string | null>(null);
  const [highlightedMonitorItem, setHighlightedMonitorItem] = useState<number | null>(null);
  const [reportToast, setReportToast] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<{id:string;msg:string;type:string}[]>([]);
  const addToast = (msg: string, type = 'success') => { const id = Date.now().toString(); setToasts(t => [...t, {id, msg, type}]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000); };

  // Confirm dialog states
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const [confirmClearNotifications, setConfirmClearNotifications] = useState(false);
  const [disconnectApiId, setDisconnectApiId] = useState<string | null>(null);

  // Modals
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [actionCampaign, setActionCampaign] = useState<CampaignData | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignData | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [connectionModal, setConnectionModal] = useState<ApiConnection | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Data
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try { const s = localStorage.getItem('flowstack-dashboard-notifications'); if (s) return JSON.parse(s); } catch {}
    return initialNotifications;
  });
  const [leads, setLeads] = useState(() => { const s = loadMarketingLeads<LeadData>(); return s.length ? s : allLeads; });
  const [campaigns, setCampaigns] = useState(() => { const s = loadMarketingCampaigns<CampaignData>(); return s.length ? s : allCampaigns; });
  const [settings, setSettings] = useState<{ emailLeads: boolean; dailyReport: boolean; budgetAlerts: boolean; roasAlerts: boolean }>(() => {
    try { const s = localStorage.getItem('flowstack-dashboard-settings'); if (s) return JSON.parse(s); } catch {}
    return { emailLeads: true, dailyReport: true, budgetAlerts: true, roasAlerts: false };
  });

  // Goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    const defaults = [
      { id: "1", name: tx("Monatliche Leads", "Monthly Leads"), target: 500, current: 342, unit: "Leads", icon: <Users className="w-6 h-6 text-white" />, color: "bg-purple-500" },
      { id: "2", name: tx("ROAS Ziel", "ROAS Target"), target: 4.0, current: 3.6, unit: "x", icon: <Target className="w-6 h-6 text-white" />, color: "bg-emerald-500" },
      { id: "3", name: tx("Umsatz Ziel", "Revenue Target"), target: 150000, current: 89460, unit: "€", icon: <DollarSign className="w-6 h-6 text-white" />, color: "bg-blue-500" },
      { id: "4", name: "Conversions", target: 250, current: 171, unit: "Conv.", icon: <ShoppingCart className="w-6 h-6 text-white" />, color: "bg-orange-500" },
    ];
    try {
      const saved = localStorage.getItem('flowstack-dashboard-goals');
      if (saved) {
        const parsed = JSON.parse(saved) as { id: string; target: number; current: number }[];
        return defaults.map(d => { const s = parsed.find(p => p.id === d.id); return s ? { ...d, target: s.target, current: s.current } : d; });
      }
    } catch {}
    return defaults;
  });

  // Persist data to localStorage
  useEffect(() => { saveMarketingCampaigns(campaigns); }, [campaigns]);
  useEffect(() => { saveMarketingLeads(leads); }, [leads]);
  useEffect(() => { try { localStorage.setItem('flowstack-dashboard-goals', JSON.stringify(goals.map(g => ({ id: g.id, target: g.target, current: g.current })))); } catch {} }, [goals]);
  useEffect(() => { try { localStorage.setItem('flowstack-dashboard-settings', JSON.stringify(settings)); } catch {} }, [settings]);
  useEffect(() => { try { localStorage.setItem('flowstack-dashboard-notifications', JSON.stringify(notifications)); } catch {} }, [notifications]);

  // Budget Data
  const budgetData: BudgetData[] = [
    { platform: "meta", budget: 25000, spent: 18000, remaining: 7000, daysLeft: 8, dailyPace: 2250, recommendedPace: 875 },
    { platform: "google", budget: 12000, spent: 7000, remaining: 5000, daysLeft: 8, dailyPace: 875, recommendedPace: 625 },
    { platform: "tiktok", budget: 5000, spent: 2750, remaining: 2250, daysLeft: 8, dailyPace: 344, recommendedPace: 281 },
    { platform: "linkedin", budget: 8000, spent: 2400, remaining: 5600, daysLeft: 8, dailyPace: 300, recommendedPace: 700 },
  ];

  // Funnel Data
  const funnelData = [
    { label: tx("Impressionen", "Impressions"), value: 1245000, icon: <Eye className="w-5 h-5" />, color: "bg-gray-500" },
    { label: tx("Klicks", "Clicks"), value: 18675, icon: <MousePointer className="w-5 h-5" />, color: "bg-blue-500" },
    { label: "Leads", value: 342, icon: <Users className="w-5 h-5" />, color: "bg-purple-500" },
    { label: tx("Qualifiziert", "Qualified"), value: 156, icon: <UserCheck className="w-5 h-5" />, color: "bg-emerald-500" },
    { label: tx("Konvertiert", "Converted"), value: 78, icon: <ShoppingCart className="w-5 h-5" />, color: "bg-orange-500" },
  ];

  // Revenue data
  type RevenueTimeframe = "day" | "week" | "month" | "year";
  const [revenueTimeframe, setRevenueTimeframe] = useState<RevenueTimeframe>("month");
  const [revenueDealDetail, setRevenueDealDetail] = useState<string | null>(null);

  const revenueSales = useMemo(() => {
    const base = {
      day: [
        { date: "08.02.", revenue: 4250, deals: 2, source: "Meta Ads" },
        { date: "07.02.", revenue: 7800, deals: 3, source: "Google Ads" },
        { date: "06.02.", revenue: 3100, deals: 1, source: "LinkedIn" },
        { date: "05.02.", revenue: 12500, deals: 4, source: "Meta Ads" },
        { date: "04.02.", revenue: 5600, deals: 2, source: "Google Ads" },
        { date: "03.02.", revenue: 0, deals: 0, source: "-" },
        { date: "02.02.", revenue: 8900, deals: 3, source: "Meta Ads" },
      ],
      week: [
        { date: "KW 6", revenue: 33450, deals: 12, source: tx("Diverse", "Various") },
        { date: "KW 5", revenue: 41200, deals: 15, source: tx("Diverse", "Various") },
        { date: "KW 4", revenue: 28900, deals: 10, source: tx("Diverse", "Various") },
        { date: "KW 3", revenue: 37650, deals: 14, source: tx("Diverse", "Various") },
      ],
      month: [
        { date: tx("Feb 2026", "Feb 2026"), revenue: 42150, deals: 15, source: tx("Diverse", "Various") },
        { date: tx("Jan 2026", "Jan 2026"), revenue: 89460, deals: 34, source: tx("Diverse", "Various") },
        { date: tx("Dez 2025", "Dec 2025"), revenue: 102300, deals: 38, source: tx("Diverse", "Various") },
        { date: tx("Nov 2025", "Nov 2025"), revenue: 78900, deals: 29, source: tx("Diverse", "Various") },
        { date: tx("Okt 2025", "Oct 2025"), revenue: 95200, deals: 35, source: tx("Diverse", "Various") },
        { date: tx("Sep 2025", "Sep 2025"), revenue: 67800, deals: 25, source: tx("Diverse", "Various") },
      ],
      year: [
        { date: "2026", revenue: 131610, deals: 49, source: tx("Diverse", "Various") },
        { date: "2025", revenue: 892400, deals: 312, source: tx("Diverse", "Various") },
        { date: "2024", revenue: 645000, deals: 228, source: tx("Diverse", "Various") },
      ],
    };
    return base[revenueTimeframe];
  }, [revenueTimeframe, lang]);

  const revenueTotalCurrent = useMemo(() => revenueSales.reduce((s, r) => s + r.revenue, 0), [revenueSales]);
  const revenueTotalDeals = useMemo(() => revenueSales.reduce((s, r) => s + r.deals, 0), [revenueSales]);
  const revenueAvgDeal = revenueTotalDeals > 0 ? Math.round(revenueTotalCurrent / revenueTotalDeals) : 0;

  const revenueDeals = [
    { id: "D-001", customer: "TechVision GmbH", revenue: 12500, source: "Meta Ads", daysToClose: 14, date: "05.02.2026", status: "closed" as const },
    { id: "D-002", customer: "CloudBase AG", revenue: 8900, source: "Google Ads", daysToClose: 21, date: "02.02.2026", status: "closed" as const },
    { id: "D-003", customer: "Digital First UG", revenue: 4250, source: "LinkedIn", daysToClose: 7, date: "08.02.2026", status: "closed" as const },
    { id: "D-004", customer: "ScaleUp Solutions", revenue: 7800, source: "Google Ads", daysToClose: 28, date: "07.02.2026", status: "closed" as const },
    { id: "D-005", customer: "InnoTech GmbH", revenue: 15000, source: "Meta Ads", daysToClose: 35, date: "01.02.2026", status: "closed" as const },
    { id: "D-006", customer: "DataFlow Systems", revenue: 6200, source: "Meta Ads", daysToClose: 10, date: "31.01.2026", status: "closed" as const },
    { id: "D-007", customer: "NextLevel KG", revenue: 9800, source: "LinkedIn", daysToClose: 18, date: "29.01.2026", status: "closed" as const },
    { id: "D-008", customer: "ProDigital GmbH", revenue: 22000, source: "Google Ads", daysToClose: 42, date: "25.01.2026", status: "closed" as const },
  ];

  const revenuePipeline = [
    { stage: tx("Marketing-Kontakt", "Marketing Contact"), count: 342, value: 0, color: "bg-gray-400" },
    { stage: tx("Lead qualifiziert", "Lead Qualified"), count: 156, value: 0, color: "bg-blue-500" },
    { stage: tx("Angebot gesendet", "Proposal Sent"), count: 67, value: 201000, color: "bg-purple-500" },
    { stage: tx("Verhandlung", "Negotiation"), count: 28, value: 140000, color: "bg-orange-500" },
    { stage: tx("Abgeschlossen", "Closed Won"), count: 49, value: 131610, color: "bg-emerald-500" },
  ];

  const revenueBySource = [
    { source: "Meta Ads", revenue: 52350, deals: 18, avgDays: 16, pct: 39.8 },
    { source: "Google Ads", revenue: 43500, deals: 14, avgDays: 24, pct: 33.1 },
    { source: "LinkedIn", revenue: 24260, deals: 11, avgDays: 19, pct: 18.4 },
    { source: "TikTok", revenue: 8400, deals: 4, avgDays: 12, pct: 6.4 },
    { source: tx("Organisch", "Organic"), revenue: 3100, deals: 2, avgDays: 31, pct: 2.4 },
  ];

  const avgDaysToClose = revenueDeals.length > 0 ? Math.round(revenueDeals.reduce((s, d) => s + d.daysToClose, 0) / revenueDeals.length) : 0;

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.backgroundColor = darkMode ? '#000' : '#f9fafb';
    document.body.style.backgroundColor = darkMode ? '#000' : '#f9fafb';
    return () => {
      document.documentElement.style.removeProperty('background-color');
      document.body.style.removeProperty('background-color');
    };
  }, [darkMode]);

  const [connections, setConnections] = useState<ApiConnection[]>(() => {
    const defaults: ApiConnection[] = [
      { id: "meta", name: "Meta Ads", platform: "meta", connected: true, lastSync: tx("Vor 5 Min", "5 min ago"), accountName: "Flowstack GmbH", icon: <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>, color: "bg-blue-500" },
      { id: "google", name: "Google Ads", platform: "google", connected: true, lastSync: tx("Vor 12 Min", "12 min ago"), accountName: "Flowstack", icon: <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>, color: "bg-emerald-500" },
      { id: "tiktok", name: "TikTok Ads", platform: "tiktok", connected: false, icon: <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, color: "bg-pink-500" },
      { id: "linkedin", name: "LinkedIn Ads", platform: "linkedin", connected: false, icon: <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, color: "bg-sky-500" },
    ];
    try {
      const s = localStorage.getItem('flowstack-dashboard-connections');
      if (s) {
        const saved = JSON.parse(s) as { id: string; connected: boolean; lastSync?: string; accountName?: string }[];
        return defaults.map(d => { const sv = saved.find(x => x.id === d.id); return sv ? { ...d, connected: sv.connected, lastSync: sv.lastSync, accountName: sv.accountName } : d; });
      }
    } catch {}
    return defaults;
  });
  useEffect(() => { try { localStorage.setItem('flowstack-dashboard-connections', JSON.stringify(connections.map(c => ({ id: c.id, connected: c.connected, lastSync: c.lastSync, accountName: c.accountName })))); } catch {} }, [connections]);

  // Computed
  const customDays = useMemo(() => {
    const from = new Date(customDateFrom);
    const to = new Date(customDateTo);
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  }, [customDateFrom, customDateTo]);
  const metrics = useMemo(() => generateMetrics(dateRange, platform, dateRange === "custom" ? customDays : undefined), [dateRange, platform, customDays]);
  const chartData = useMemo(() => generateChartData(dateRange, dateRange === "custom" ? customDays : undefined), [dateRange, customDays]);

  const filteredCampaigns = useMemo(() => {
    let f = campaigns.filter(c => platform === "all" || c.platform === platform);
    if (search) f = f.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    f.sort((a, b) => {
      const aVal = a[sortField], bVal = b[sortField];
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return f;
  }, [campaigns, platform, search, sortField, sortDir]);

  const filteredLeads = useMemo(() => {
    let f = leads.filter(l => platform === "all" || l.source === platform);
    if (search) f = f.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));
    if (leadStatusFilter !== "all") f = f.filter(l => l.status === leadStatusFilter);
    return f;
  }, [leads, platform, search, leadStatusFilter]);

  const pageSize = 5;
  const paginatedCampaigns = filteredCampaigns.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredCampaigns.length / pageSize);

  const platformSpend = useMemo(() => {
    const data: Record<string, number> = {};
    campaigns.forEach(c => { if (platform === "all" || c.platform === platform) data[c.platform] = (data[c.platform] || 0) + c.spend; });
    return Object.entries(data).map(([p, v]) => ({ label: p.charAt(0).toUpperCase() + p.slice(1), value: v, color: platformColors[p as keyof typeof platformColors].fill }));
  }, [campaigns, platform]);

  useEffect(() => { document.title = "Dashboard | Flowstack"; }, []);

  // Handlers
  const handleRefresh = () => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1500); };
  const handleSort = (field: SortField) => { if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("desc"); } setPage(1); };
  const handleExport = () => exportToCSV(filteredCampaigns, `campaigns-${dateRange}-${platform}.csv`);
  const handleMarkRead = (id: string) => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const handleClearNotifications = () => setConfirmClearNotifications(true);
  const handleLeadStatusChange = (id: string, status: LeadData["status"]) => { setLeads(l => l.map(x => x.id === id ? { ...x, status } : x)); addToast(tx('Lead-Status aktualisiert', 'Lead status updated')); };
  const handleCampaignAction = (action: string, id: string) => {
    if (action === "view") setSelectedCampaign(campaigns.find(c => c.id === id) || null);
    else if (action === "toggle") setCampaigns(c => c.map(x => x.id === id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x));
    else if (action === "duplicate") { const orig = campaigns.find(c => c.id === id); if (orig) setCampaigns(c => [...c, { ...orig, id: Date.now().toString(), name: orig.name + (lang === 'de' ? " (Kopie)" : " (Copy)") }]); }
    else if (action === "edit") { const c = campaigns.find(x => x.id === id); if (c) setEditingCampaign(c); }
    else if (action === "delete") setDeleteCampaignId(id);
    else if (action === "export") exportToCSV([campaigns.find(c => c.id === id)!], `campaign-${id}.csv`);
  };
  const handleToggleSetting = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const handleDisconnect = (id: string) => setDisconnectApiId(id);

  // Goal handlers
  const handleEditGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal) setEditingGoal(goal);
  };
  const handleSaveGoal = (updatedGoal: { id: string; target: number }) => {
    setGoals(g => g.map(x => x.id === updatedGoal.id ? { ...x, target: updatedGoal.target } : x));
    setEditingGoal(null);
    addToast(tx('Ziel gespeichert', 'Goal saved'));
  };

  // Create new campaign handler
  const handleCreateCampaign = () => {
    const newCampaign: CampaignData = {
      id: Date.now().toString(),
      name: tx("Neue Kampagne", "New Campaign"),
      status: "paused",
      platform: platform === "all" ? "meta" : platform as CampaignData["platform"],
      spend: 0,
      revenue: 0,
      roas: 0,
      leads: 0,
      cpl: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      cvr: 0,
    };
    setCampaigns(c => [newCampaign, ...c]);
    setEditingCampaign(newCampaign);
  };

  // Report generation handler
  const handleGenerateReport = (reportName: string) => {
    setReportToast(reportName);
    setTimeout(() => setReportToast(null), 3000);
    addToast(tx(`Report "${reportName}" wird generiert`, `Report "${reportName}" is being generated`));
  };

  // Lead contact handlers
  const handleEmailLead = (lead: LeadData) => {
    window.location.href = `mailto:${lead.email}?subject=${tx("Anfrage zu", "Inquiry about")} ${lead.campaign}`;
  };
  const handleCallLead = (lead: LeadData) => {
    window.location.href = `tel:${lead.phone}`;
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th className="py-4 px-4 font-medium text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none" onClick={() => handleSort(field)}>
      <div className="flex items-center justify-end gap-1">{label}{sortField === field && (sortDir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}</div>
    </th>
  );

  const customLabel = dateRange === "custom" ? `${customDateFrom} – ${customDateTo}` : "";
  const dateLabels: Record<DateRange, string> = lang === 'de'
    ? { today: "Heute", "7d": "Letzte 7 Tage", "30d": "Letzte 30 Tage", "90d": "Letzte 90 Tage", "6m": "Letzte 6 Monate", "12m": "Letzte 12 Monate", custom: customLabel || "Benutzerdefiniert" }
    : { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "6m": "Last 6 months", "12m": "Last 12 months", custom: customLabel || "Custom" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Modals */}
      <CampaignDetailModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      <CampaignActionsModal campaign={actionCampaign} onClose={() => setActionCampaign(null)} onAction={handleCampaignAction} />
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={handleLeadStatusChange} onEmail={handleEmailLead} onCall={handleCallLead} />
      <ConnectionModal isOpen={!!connectionModal} onClose={() => setConnectionModal(null)} connection={connectionModal} />
      <GoalEditModal goal={editingGoal} onClose={() => setEditingGoal(null)} onSave={handleSaveGoal} />
      <CampaignEditModal campaign={editingCampaign} onClose={() => setEditingCampaign(null)} onSave={(updated) => { setCampaigns(c => c.map(x => x.id === updated.id ? updated : x)); addToast(tx('Kampagne aktualisiert', 'Campaign updated')); }} />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteCampaignId}
        title={tx('Kampagne löschen?', 'Delete campaign?')}
        message={tx('Diese Kampagne wird unwiderruflich gelöscht.', 'This campaign will be permanently deleted.')}
        confirmLabel={tx('Löschen', 'Delete')}
        cancelLabel={tx('Abbrechen', 'Cancel')}
        variant="danger"
        onConfirm={() => { setCampaigns(c => c.filter(x => x.id !== deleteCampaignId)); addToast(tx('Kampagne gelöscht', 'Campaign deleted')); setDeleteCampaignId(null); }}
        onCancel={() => setDeleteCampaignId(null)}
      />
      <ConfirmDialog
        open={confirmClearNotifications}
        title={tx('Benachrichtigungen löschen?', 'Clear notifications?')}
        message={tx('Alle Benachrichtigungen werden gelöscht.', 'All notifications will be cleared.')}
        confirmLabel={tx('Löschen', 'Clear')}
        cancelLabel={tx('Abbrechen', 'Cancel')}
        variant="warning"
        onConfirm={() => { setNotifications([]); addToast(tx('Benachrichtigungen gelöscht', 'Notifications cleared')); setConfirmClearNotifications(false); }}
        onCancel={() => setConfirmClearNotifications(false)}
      />
      <ConfirmDialog
        open={!!disconnectApiId}
        title={tx('Verbindung trennen?', 'Disconnect?')}
        message={tx('Die API-Verbindung wird getrennt.', 'The API connection will be disconnected.')}
        confirmLabel={tx('Trennen', 'Disconnect')}
        cancelLabel={tx('Abbrechen', 'Cancel')}
        variant="danger"
        onConfirm={() => { setConnections(c => c.map(x => x.id === disconnectApiId ? { ...x, connected: false, lastSync: undefined, accountName: undefined } : x)); addToast(tx('Verbindung getrennt', 'Disconnected')); setDisconnectApiId(null); }}
        onCancel={() => setDisconnectApiId(null)}
      />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-[110] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-bottom-2 fade-in duration-200 ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
              {t.msg}
            </div>
          ))}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-40 flex flex-col transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>Flowstack</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors" title={tx('Design umschalten', 'Toggle theme')}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-500" />}
            </button>
            <button onClick={() => { setSidebarCollapsed(true); setMobileSidebarOpen(false); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors" title={tx("Sidebar einklappen", "Collapse sidebar")}>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
          <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-medium px-4 mb-2">{tx("Übersicht", "Overview")}</p>
          {([
            { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", key: "dashboard" },
            { icon: <Layers className="w-5 h-5" />, label: tx("Kampagnen", "Campaigns"), key: "campaigns" },
            { icon: <Users className="w-5 h-5" />, label: "Leads", key: "leads" },
          ] as const).map(i => (
            <button key={i.key} onClick={() => { setSection(i.key); setPage(1); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${section === i.key ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-medium" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>{i.icon}{i.label}</button>
          ))}
          <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-medium px-4 mt-6 mb-2">{tx("Analyse", "Analysis")}</p>
          {([
            { icon: <Filter className="w-5 h-5" />, label: "Funnel", key: "funnel" },
            { icon: <Flag className="w-5 h-5" />, label: tx("Ziele", "Goals"), key: "goals" },
            { icon: <Wallet className="w-5 h-5" />, label: "Budget", key: "budget" },
            { icon: <GitCompare className="w-5 h-5" />, label: tx("Vergleich", "Compare"), key: "compare" },
            { icon: <DollarSign className="w-5 h-5" />, label: tx("Umsatz", "Revenue"), key: "revenue" },
          ] as const).map(i => (
            <button key={i.key} onClick={() => { setSection(i.key); setPage(1); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${section === i.key ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-medium" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>{i.icon}{i.label}</button>
          ))}
          <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase font-medium px-4 mt-6 mb-2">{tx("System", "System")}</p>
          {([
            { icon: <PieChart className="w-5 h-5" />, label: tx("Reports", "Reports"), key: "reports" },
            { icon: <Activity className="w-5 h-5" />, label: tx("Live Monitor", "Live Monitor"), key: "monitor" },
            { icon: <Settings className="w-5 h-5" />, label: tx("Einstellungen", "Settings"), key: "settings" },
          ] as const).map(i => (
            <button key={i.key} onClick={() => { setSection(i.key); setPage(1); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${section === i.key ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-medium" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>{i.icon}{i.label}</button>
          ))}
        </nav>
        <div className="p-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <p className="font-semibold mb-1">{tx("API Status", "API Status")}</p>
            <p className="text-sm text-white/80 mb-3">{connections.filter(c => c.connected).length}/{connections.length} {tx("verbunden", "connected")}</p>
            <div className="flex gap-2">{connections.map(c => <div key={c.id} className={`w-2 h-2 rounded-full ${c.connected ? "bg-emerald-400" : "bg-white/30"}`} />)}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`transition-all duration-300 pb-20 md:pb-0 ${sidebarCollapsed ? '' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Menü öffnen', 'Open menu')}><Menu className="w-5 h-5 text-gray-500" /></button>
              {sidebarCollapsed && <button onClick={() => setSidebarCollapsed(false)} className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title={tx('Sidebar ausklappen', 'Expand sidebar')}><ChevronRight className="w-5 h-5 text-gray-500" /></button>}
              <div>
              <h1 className="text-xl sm:text-2xl font-bold">{{ dashboard: "Dashboard", campaigns: tx("Kampagnen", "Campaigns"), leads: "Leads", funnel: tx("Funnel-Analyse", "Funnel Analysis"), goals: tx("Ziele & Tracking", "Goals & Tracking"), budget: tx("Budget Pacing", "Budget Pacing"), compare: tx("Zeitraum-Vergleich", "Period Comparison"), revenue: tx("Umsatz & Sales", "Revenue & Sales"), reports: tx("Reports", "Reports"), monitor: tx("Live Monitor", "Live Monitor"), settings: tx("Einstellungen", "Settings") }[section]}</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{section === "dashboard" ? `${dateLabels[dateRange]} · ${platform === "all" ? tx("Alle Plattformen", "All platforms") : platform}` : `${section === "campaigns" ? filteredCampaigns.length + tx(" Kampagnen", " campaigns") : section === "leads" ? filteredLeads.length + " Leads" : ""}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder={tx("Suchen...", "Search...")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm w-64 focus:ring-2 focus:ring-purple-500 outline-none" /></div>
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                <button onClick={() => setLang('de')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${lang === 'de' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>DE</button>
                <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>EN</button>
              </div>
              <NotificationDropdown notifications={notifications} onMarkRead={handleMarkRead} onClear={handleClearNotifications} />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold hidden sm:flex">K</div>
            </div>
          </div>
          {section === "dashboard" && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800">
              <CustomDropdown
                value={dateRange}
                onChange={setDateRange}
                options={[
                  { value: "today", label: tx("Heute", "Today") },
                  { value: "7d", label: tx("Letzte 7 Tage", "Last 7 days") },
                  { value: "30d", label: tx("Letzte 30 Tage", "Last 30 days") },
                  { value: "90d", label: tx("Letzte 90 Tage", "Last 90 days") },
                  { value: "6m", label: tx("Letzte 6 Monate", "Last 6 months") },
                  { value: "12m", label: tx("Letzte 12 Monate", "Last 12 months") },
                  { value: "custom", label: tx("Benutzerdefiniert", "Custom") },
                ]}
                icon={<Calendar className="w-4 h-4 text-gray-500" />}
              />
              {dateRange === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-colors" />
                  <span className="text-gray-400 text-sm">–</span>
                  <input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-colors" />
                </div>
              )}
              <CustomDropdown
                value={platform}
                onChange={setPlatform}
                options={[
                  { value: "all", label: tx("Alle Plattformen", "All platforms") },
                  { value: "meta", label: "Meta" },
                  { value: "google", label: "Google" },
                  { value: "tiktok", label: "TikTok" },
                  { value: "linkedin", label: "LinkedIn" },
                ]}
                icon={<Filter className="w-4 h-4 text-gray-500" />}
              />
              <div className="flex-1" />
              <button onClick={handleRefresh} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /><span className="hidden sm:inline">{tx("Aktualisieren", "Refresh")}</span></button>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-xl hover:bg-purple-600"><Download className="w-4 h-4" /><span className="hidden sm:inline">{tx("Exportieren", "Export")}</span></button>
            </div>
          )}
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* DASHBOARD */}
          {section === "dashboard" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ t: tx("Werbeausgaben", "Ad spend"), v: `€${formatCurrency(metrics.totalSpend)}`, c: -12.5, i: <DollarSign className="w-6 h-6 text-purple-500" />, bg: "bg-purple-100" }, { t: tx("Umsatz", "Revenue"), v: `€${formatCurrency(metrics.totalRevenue)}`, c: 24.8, i: <TrendingUp className="w-6 h-6 text-emerald-500" />, bg: "bg-emerald-100" }, { t: "ROAS", v: `${metrics.totalRoas.toFixed(2)}x`, c: 18.2, i: <Target className="w-6 h-6 text-blue-500" />, bg: "bg-blue-100" }, { t: "Leads", v: metrics.totalLeads.toString(), c: 32.1, i: <Users className="w-6 h-6 text-orange-500" />, bg: "bg-orange-100" }].map((m, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-4"><div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center`}>{m.i}</div><div className={`flex items-center gap-1 text-sm font-medium ${m.c >= 0 ? "text-emerald-500" : "text-red-500"}`}>{m.c >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{Math.abs(m.c)}%</div></div>
                    <p className="text-gray-500 text-sm mb-1">{m.t}</p><p className="text-3xl font-bold">{m.v}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[{ l: "CPL", v: `€${metrics.avgCpl.toFixed(2)}`, t: -8.3 }, { l: "CPA", v: `€${metrics.avgCpa.toFixed(2)}`, t: -5.1 }, { l: "CTR", v: `${metrics.avgCtr.toFixed(2)}%`, t: 12.4 }, { l: "CVR", v: `${metrics.avgCvr.toFixed(2)}%`, t: 6.7 }, { l: "CPM", v: `€${metrics.avgCpm.toFixed(2)}`, t: -3.2 }, { l: "Conv.", v: metrics.totalConversions.toString(), t: 28.9 }].map((k, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"><p className="text-gray-500 text-xs mb-1">{k.l}</p><p className="text-xl font-bold">{k.v}</p><div className={`flex items-center gap-1 text-xs mt-1 ${k.t >= 0 ? "text-emerald-500" : "text-red-500"}`}>{k.t >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(k.t)}%</div></div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6"><div><h3 className="font-semibold">{tx("Ausgaben vs. Umsatz", "Spend vs. Revenue")}</h3><p className="text-sm text-gray-500">{dateLabels[dateRange]}</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-sm text-gray-500">{tx("Ausgaben", "Spend")}</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm text-gray-500">{tx("Umsatz", "Revenue")}</span></div></div></div>
                  <AreaChart data={chartData} />
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold mb-6">{tx("Ausgaben nach Plattform", "Spend by platform")}</h3>
                  <DonutChart data={platformSpend} />
                  <div className="mt-6 space-y-3">{platformSpend.map((p, i) => (<div key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${p.color.replace("fill-", "bg-")}`} /><span className="text-sm">{p.label}</span></div><span className="text-sm font-medium">€{formatCurrency(p.value)}</span></div>))}</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div><h3 className="font-semibold">{{ campaigns: tx("Kampagnen", "Campaigns"), adsets: "Ad Sets", ads: "Ads" }[viewMode]}</h3><p className="text-sm text-gray-500">{viewMode === "campaigns" ? `${filteredCampaigns.length} ${tx("Kampagnen", "campaigns")}` : viewMode === "adsets" ? `${filteredCampaigns.length * 2} Ad Sets` : `${filteredCampaigns.length * 4} Ads`}</p></div>
                  <div className="flex items-center gap-2">{(["campaigns", "adsets", "ads"] as const).map(m => (<button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 text-sm font-medium rounded-xl ${viewMode === m ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>{m === "campaigns" ? tx("Kampagnen", "Campaigns") : m === "adsets" ? "Ad Sets" : "Ads"}</button>))}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 dark:border-gray-800 text-left text-sm text-gray-500"><th className="py-4 px-4 font-medium cursor-pointer" onClick={() => handleSort("name")}>{viewMode === "campaigns" ? tx("Kampagne", "Campaign") : viewMode === "adsets" ? "Ad Set" : "Ad"} {sortField === "name" && (sortDir === "asc" ? "\u2191" : "\u2193")}</th><SortHeader field="spend" label={tx("Ausgaben", "Spend")} /><SortHeader field="revenue" label={tx("Umsatz", "Revenue")} /><SortHeader field="roas" label="ROAS" /><SortHeader field="leads" label="Leads" /><SortHeader field="cpl" label="CPL" /><th className="py-4 px-4 font-medium text-right">Impr.</th><SortHeader field="ctr" label="CTR" /><SortHeader field="cvr" label="CVR" /><th className="py-4 px-4"></th></tr></thead>
                    <tbody>{paginatedCampaigns.flatMap(c => {
                      const col = platformColors[c.platform];
                      if (viewMode === "campaigns") {
                        return [(
                          <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedCampaign(c)}>
                            <td className="py-4 px-4"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} /><div><p className="font-medium">{c.name}</p><span className={`text-xs px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}</span></div></div></td>
                            <td className="py-4 px-4 text-right font-medium">{"\u20AC"}{formatCurrency(c.spend)}</td>
                            <td className="py-4 px-4 text-right font-medium text-emerald-500">{"\u20AC"}{formatCurrency(c.revenue)}</td>
                            <td className="py-4 px-4 text-right font-medium" style={{ color: c.roas >= 3 ? "#10b981" : c.roas >= 2 ? "#eab308" : "#ef4444" }}>{c.roas.toFixed(2)}x</td>
                            <td className="py-4 px-4 text-right">{c.leads}</td>
                            <td className="py-4 px-4 text-right">{"\u20AC"}{c.cpl.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right">{formatNumber(c.impressions)}</td>
                            <td className="py-4 px-4 text-right">{formatPercent(c.ctr)}</td>
                            <td className="py-4 px-4 text-right">{formatPercent(c.cvr)}</td>
                            <td className="py-4 px-4 text-right"><button onClick={e => { e.stopPropagation(); setActionCampaign(c); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={tx('Aktionen', 'Actions')}><MoreHorizontal className="w-4 h-4 text-gray-400" /></button></td>
                          </tr>
                        )];
                      }
                      const subItems = viewMode === "adsets"
                        ? [{ suffix: " - Broad", factor: 0.6 }, { suffix: " - Retargeting", factor: 0.4 }]
                        : [{ suffix: " - Image Ad", factor: 0.3 }, { suffix: " - Video Ad", factor: 0.35 }, { suffix: " - Carousel", factor: 0.2 }, { suffix: " - Story", factor: 0.15 }];
                      return subItems.map((sub, si) => {
                        const spend = Math.round(c.spend * sub.factor);
                        const revenue = Math.round(c.revenue * sub.factor);
                        const roas = spend > 0 ? Math.round((revenue / spend) * 100) / 100 : 0;
                        const leads = Math.round(c.leads * sub.factor);
                        const cpl = leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0;
                        const impressions = Math.round(c.impressions * sub.factor);
                        const clicks = Math.round(c.clicks * sub.factor);
                        const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
                        const conversions = Math.round(c.conversions * sub.factor);
                        const cvr = impressions > 0 ? Math.round((conversions / impressions) * 10000) / 100 : 0;
                        return (
                          <tr key={`${c.id}-${si}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedCampaign(c)}>
                            <td className="py-4 px-4"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} /><div><p className="font-medium text-sm">{c.name}{sub.suffix}</p><span className={`text-xs px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}</span></div></div></td>
                            <td className="py-4 px-4 text-right font-medium">{"\u20AC"}{formatCurrency(spend)}</td>
                            <td className="py-4 px-4 text-right font-medium text-emerald-500">{"\u20AC"}{formatCurrency(revenue)}</td>
                            <td className="py-4 px-4 text-right font-medium" style={{ color: roas >= 3 ? "#10b981" : roas >= 2 ? "#eab308" : "#ef4444" }}>{roas.toFixed(2)}x</td>
                            <td className="py-4 px-4 text-right">{leads}</td>
                            <td className="py-4 px-4 text-right">{"\u20AC"}{cpl.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right">{formatNumber(impressions)}</td>
                            <td className="py-4 px-4 text-right">{formatPercent(ctr)}</td>
                            <td className="py-4 px-4 text-right">{formatPercent(cvr)}</td>
                            <td className="py-4 px-4 text-right"><button onClick={e => { e.stopPropagation(); setActionCampaign(c); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={tx('Aktionen', 'Actions')}><MoreHorizontal className="w-4 h-4 text-gray-400" /></button></td>
                          </tr>
                        );
                      });
                    })}</tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{tx("Seite", "Page")} {page} {tx("von", "of")} {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">{tx("Zurück", "Back")}</button>
                    {Array.from({ length: totalPages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded-xl ${page === i + 1 ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100"}`}>{i + 1}</button>))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">{tx("Weiter", "Next")}</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CAMPAIGNS */}
          {section === "campaigns" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <CustomDropdown
                  value={platform}
                  onChange={setPlatform}
                  options={[
                    { value: "all", label: tx("Alle Plattformen", "All platforms") },
                    { value: "meta", label: "Meta" },
                    { value: "google", label: "Google" },
                    { value: "tiktok", label: "TikTok" },
                    { value: "linkedin", label: "LinkedIn" },
                  ]}
                  icon={<Filter className="w-4 h-4 text-gray-500" />}
                />
                {(search || platform !== "all") && filteredCampaigns.length !== campaigns.length && (
                  <span className="text-xs text-gray-400">{filteredCampaigns.length} / {campaigns.length}</span>
                )}
                <div className="flex-1" />
                <button onClick={handleCreateCampaign} className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 flex items-center gap-2"><Zap className="w-4 h-4" />{tx("Neue Kampagne", "New Campaign")}</button>
                <button onClick={handleExport} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"><Download className="w-4 h-4" />{tx("Exportieren", "Export")}</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCampaigns.map(c => {
                  const col = platformColors[c.platform];
                  return (
                    <div key={c.id} onClick={() => setActionCampaign(c)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-purple-200 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4"><div className={`w-3 h-3 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-yellow-500"}`} /><span className={`text-xs px-2 py-1 rounded-full ${col.bg} ${col.text}`}>{c.platform.toUpperCase()}</span></div>
                      <h3 className="font-semibold mb-2 group-hover:text-purple-600">{c.name}</h3>
                      <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-400">{tx("Ausgaben", "Spend")}</p><p className="font-semibold">€{formatCurrency(c.spend)}</p></div><div><p className="text-xs text-gray-400">ROAS</p><p className={`font-semibold ${c.roas >= 3 ? "text-emerald-500" : c.roas >= 2 ? "text-yellow-500" : "text-red-500"}`}>{c.roas.toFixed(2)}x</p></div><div><p className="text-xs text-gray-400">Leads</p><p className="font-semibold">{c.leads}</p></div><div><p className="text-xs text-gray-400">CVR</p><p className="font-semibold">{formatPercent(c.cvr)}</p></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEADS */}
          {section === "leads" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ l: tx("Gesamt", "Total"), v: filteredLeads.length }, { l: tx("Neu", "New"), v: filteredLeads.filter(l => l.status === "new").length, c: "text-purple-500" }, { l: tx("Qualifiziert", "Qualified"), v: filteredLeads.filter(l => l.status === "qualified").length, c: "text-emerald-500" }, { l: tx("Konvertiert", "Converted"), v: filteredLeads.filter(l => l.status === "converted").length, c: "text-blue-500" }].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"><p className="text-sm text-gray-500 mb-1">{s.l}</p><p className={`text-3xl font-bold ${s.c || ""}`}>{s.v}</p></div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <CustomDropdown
                  value={platform}
                  onChange={setPlatform}
                  options={[
                    { value: "all", label: tx("Alle Quellen", "All sources") },
                    { value: "meta", label: "Meta" },
                    { value: "google", label: "Google" },
                    { value: "tiktok", label: "TikTok" },
                    { value: "linkedin", label: "LinkedIn" },
                  ]}
                  icon={<Filter className="w-4 h-4 text-gray-500" />}
                />
                <CustomDropdown
                  value={leadStatusFilter}
                  onChange={setLeadStatusFilter}
                  options={[
                    { value: "all", label: tx("Alle Status", "All statuses") },
                    { value: "new", label: tx("Neu", "New") },
                    { value: "contacted", label: tx("Kontaktiert", "Contacted") },
                    { value: "qualified", label: tx("Qualifiziert", "Qualified") },
                    { value: "converted", label: tx("Konvertiert", "Converted") },
                    { value: "lost", label: tx("Verloren", "Lost") },
                  ]}
                  icon={<Users className="w-4 h-4 text-gray-500" />}
                />
                <span className="text-sm text-gray-500">{filteredLeads.length} Leads{(search || platform !== "all" || leadStatusFilter !== "all") && filteredLeads.length !== leads.length ? <span className="text-xs text-gray-400 ml-1">/ {leads.length}</span> : null}</span>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr className="border-b border-gray-100 dark:border-gray-800 text-left text-sm text-gray-500"><th className="py-3 px-4 font-medium">{tx("Name", "Name")}</th><th className="py-3 px-4 font-medium">{tx("E-Mail", "Email")}</th><th className="py-3 px-4 font-medium">{tx("Quelle", "Source")}</th><th className="py-3 px-4 font-medium">{tx("Kampagne", "Campaign")}</th><th className="py-3 px-4 font-medium">{tx("Status", "Status")}</th><th className="py-3 px-4 font-medium">{tx("Wert", "Value")}</th><th className="py-3 px-4 font-medium">{tx("Datum", "Date")}</th></tr></thead>
                  <tbody>{filteredLeads.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">{tx("Keine Leads gefunden.", "No leads found.")}</td></tr>
                  ) : filteredLeads.map(l => {
                    const col = platformColors[l.source], sc = statusColors[l.status];
                    return (
                      <tr key={l.id} onClick={() => setSelectedLead(l)} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                        <td className="py-3 px-4 font-medium">{l.name}</td>
                        <td className="py-3 px-4 text-gray-500">{l.email}</td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${col.bg} ${col.text}`}>{l.source.charAt(0).toUpperCase() + l.source.slice(1)}</span></td>
                        <td className="py-3 px-4 text-gray-500">{l.campaign}</td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>{statusLabels[l.status]}</span></td>
                        <td className="py-3 px-4 font-medium text-emerald-500">{l.value > 0 ? `€${formatCurrency(l.value)}` : "—"}</td>
                        <td className="py-3 px-4 text-gray-400">{l.date}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* FUNNEL */}
          {section === "funnel" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xl font-semibold mb-2">{tx("Conversion Funnel", "Conversion Funnel")}</h3>
                  <p className="text-gray-500 mb-8">{tx("Vom ersten Kontakt bis zur Conversion", "From first contact to conversion")}</p>
                  <FunnelChart data={funnelData} />
                </div>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold mb-4">{tx("Funnel-Metriken", "Funnel Metrics")}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">{tx("Klickrate (CTR)", "Click rate (CTR)")}</p>
                        <p className="text-2xl font-bold">{((funnelData[1].value / funnelData[0].value) * 100).toFixed(2)}%</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">{tx("Lead-Rate", "Lead rate")}</p>
                        <p className="text-2xl font-bold">{((funnelData[2].value / funnelData[1].value) * 100).toFixed(2)}%</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">{tx("Qualifizierungsrate", "Qualification rate")}</p>
                        <p className="text-2xl font-bold">{((funnelData[3].value / funnelData[2].value) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">{tx("Conversion-Rate", "Conversion rate")}</p>
                        <p className="text-2xl font-bold text-emerald-500">{((funnelData[4].value / funnelData[3].value) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold mb-4">{tx("Drop-off Analyse", "Drop-off Analysis")}</h3>
                    <div className="space-y-3">
                      {funnelData.slice(0, -1).map((step, i) => {
                        const dropOff = step.value - funnelData[i + 1].value;
                        const dropOffPct = ((dropOff / step.value) * 100).toFixed(1);
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-sm text-gray-600 dark:text-gray-300">{step.label} → {funnelData[i + 1].label}</span>
                            <span className="text-sm font-medium text-red-500">-{formatNumber(dropOff)} ({dropOffPct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GOALS */}
          {section === "goals" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{tx("Monatliche Ziele", "Monthly Goals")}</h2>
                  <p className="text-gray-500">{tx("Fortschritt für Januar 2025", "Progress for January 2025")}</p>
                </div>
                <p className="text-xs text-gray-400">{tx("Klicke auf ein Ziel um es zu bearbeiten", "Click a goal to edit it")}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
                ))}
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold mb-6">{tx("Ziel-Verlauf", "Goal Progress")}</h3>
                <div className="space-y-4">
                  {goals.map(goal => {
                    const progress = (goal.current / goal.target) * 100;
                    const daysInMonth = 31;
                    const currentDay = 23;
                    const expectedProgress = (currentDay / daysInMonth) * 100;
                    const status = progress >= expectedProgress ? "ahead" : progress >= expectedProgress * 0.8 ? "on" : "behind";
                    return (
                      <div key={goal.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className={`w-10 h-10 rounded-xl ${goal.color} flex items-center justify-center text-white`}>
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{goal.name}</span>
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${status === "ahead" ? "bg-emerald-100 text-emerald-600" : status === "on" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                              {status === "ahead" ? tx("Voraus", "Ahead") : status === "on" ? tx("Im Plan", "On track") : tx("Hinterher", "Behind")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{tx("Aktuell", "Current")}: <strong className="text-gray-900 dark:text-white">{formatNumber(goal.current)}</strong></span>
                            <span>{tx("Ziel", "Target")}: <strong>{formatNumber(goal.target)}</strong></span>
                            <span>{tx("Verbleibend", "Remaining")}: <strong className="text-purple-500">{formatNumber(goal.target - goal.current)}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* BUDGET */}
          {section === "budget" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 mb-1">{tx("Gesamt-Budget", "Total Budget")}</p>
                  <p className="text-3xl font-bold">€{formatCurrency(budgetData.reduce((s, b) => s + b.budget, 0))}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 mb-1">{tx("Ausgegeben", "Spent")}</p>
                  <p className="text-3xl font-bold text-purple-500">€{formatCurrency(budgetData.reduce((s, b) => s + b.spent, 0))}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 mb-1">{tx("Verbleibend", "Remaining")}</p>
                  <p className="text-3xl font-bold text-emerald-500">€{formatCurrency(budgetData.reduce((s, b) => s + b.remaining, 0))}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 mb-1">{tx("Tage verbleibend", "Days remaining")}</p>
                  <p className="text-3xl font-bold">{budgetData[0]?.daysLeft || 0}</p>
                </div>
              </div>
              <BudgetPacing data={budgetData} />
            </div>
          )}

          {/* COMPARE */}
          {section === "compare" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <CustomDropdown
                  value={compareRange}
                  onChange={setCompareRange}
                  options={[
                    { value: "7d", label: tx("Letzte 7 Tage", "Last 7 days") },
                    { value: "30d", label: tx("Letzte 30 Tage", "Last 30 days") },
                    { value: "90d", label: tx("Letzte 90 Tage", "Last 90 days") },
                  ]}
                  icon={<Calendar className="w-4 h-4 text-gray-500" />}
                />
                <span className="text-gray-400">vs.</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{tx("Vorherige", "Previous")} {compareRange === "7d" ? tx("7 Tage", "7 days") : compareRange === "30d" ? tx("30 Tage", "30 days") : tx("90 Tage", "90 days")}</span>
                </div>
              </div>
              {(() => {
                const multiplier = compareRange === "7d" ? 1 : compareRange === "30d" ? 4.2 : 12;
                const baseData = {
                  spend: { current: Math.round(24850 * multiplier), previous: Math.round(22340 * multiplier) },
                  revenue: { current: Math.round(89460 * multiplier), previous: Math.round(71200 * multiplier) },
                  roas: { current: 3.6, previous: 3.19 },
                  leads: { current: Math.round(342 * multiplier), previous: Math.round(287 * multiplier) },
                  impressions: { current: Math.round(1245000 * multiplier), previous: Math.round(1089000 * multiplier) },
                  clicks: { current: Math.round(18675 * multiplier), previous: Math.round(15420 * multiplier) },
                  ctr: { current: 1.5, previous: 1.42 },
                  cpl: { current: 72.66, previous: 77.84 },
                  conversions: { current: Math.round(171 * multiplier), previous: Math.round(142 * multiplier) },
                  cvr: { current: 1.83, previous: 1.68 },
                };
                return (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <CompareCard label={tx("Werbeausgaben", "Ad spend")} current={baseData.spend.current} previous={baseData.spend.previous} prefix="€" />
                      <CompareCard label={tx("Umsatz", "Revenue")} current={baseData.revenue.current} previous={baseData.revenue.previous} prefix="€" />
                      <CompareCard label="ROAS" current={baseData.roas.current} previous={baseData.roas.previous} unit="x" />
                      <CompareCard label="Leads" current={baseData.leads.current} previous={baseData.leads.previous} />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <CompareCard label={tx("Impressionen", "Impressions")} current={baseData.impressions.current} previous={baseData.impressions.previous} />
                      <CompareCard label={tx("Klicks", "Clicks")} current={baseData.clicks.current} previous={baseData.clicks.previous} />
                      <CompareCard label="CTR" current={baseData.ctr.current} previous={baseData.ctr.previous} unit="%" />
                      <CompareCard label="CPL" current={baseData.cpl.current} previous={baseData.cpl.previous} prefix="€" />
                      <CompareCard label="Conversions" current={baseData.conversions.current} previous={baseData.conversions.previous} />
                      <CompareCard label="CVR" current={baseData.cvr.current} previous={baseData.cvr.previous} unit="%" />
                    </div>
                  </>
                );
              })()}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold mb-6">{tx("Plattform-Vergleich", "Platform Comparison")}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-sm text-gray-500">
                        <th className="py-3 px-4 font-medium">{tx("Plattform", "Platform")}</th>
                        <th className="py-3 px-4 font-medium text-right">{tx("Ausgaben", "Spend")}</th>
                        <th className="py-3 px-4 font-medium text-right">Δ</th>
                        <th className="py-3 px-4 font-medium text-right">ROAS</th>
                        <th className="py-3 px-4 font-medium text-right">Δ</th>
                        <th className="py-3 px-4 font-medium text-right">Leads</th>
                        <th className="py-3 px-4 font-medium text-right">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { platform: "Meta", spend: 18000, spendPrev: 15800, roas: 3.5, roasPrev: 3.2, leads: 213, leadsPrev: 178 },
                        { platform: "Google", spend: 7000, spendPrev: 6200, roas: 4.2, roasPrev: 3.9, leads: 91, leadsPrev: 82 },
                        { platform: "TikTok", spend: 2750, spendPrev: 2400, roas: 2.1, roasPrev: 1.8, leads: 26, leadsPrev: 19 },
                        { platform: "LinkedIn", spend: 2400, spendPrev: 2100, roas: 2.8, roasPrev: 2.5, leads: 12, leadsPrev: 8 },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4 font-medium">{row.platform}</td>
                          <td className="py-3 px-4 text-right">€{formatCurrency(row.spend)}</td>
                          <td className={`py-3 px-4 text-right text-sm ${row.spend >= row.spendPrev ? "text-emerald-500" : "text-red-500"}`}>
                            {row.spend >= row.spendPrev ? "+" : ""}{(((row.spend - row.spendPrev) / row.spendPrev) * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-right">{row.roas.toFixed(2)}x</td>
                          <td className={`py-3 px-4 text-right text-sm ${row.roas >= row.roasPrev ? "text-emerald-500" : "text-red-500"}`}>
                            {row.roas >= row.roasPrev ? "+" : ""}{(((row.roas - row.roasPrev) / row.roasPrev) * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-right">{row.leads}</td>
                          <td className={`py-3 px-4 text-right text-sm ${row.leads >= row.leadsPrev ? "text-emerald-500" : "text-red-500"}`}>
                            {row.leads >= row.leadsPrev ? "+" : ""}{(((row.leads - row.leadsPrev) / row.leadsPrev) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE / SALES */}
          {section === "revenue" && (
            <div className="space-y-6">
              {/* Timeframe Toggle */}
              <div className="flex items-center gap-2">
                {([
                  { key: "day" as RevenueTimeframe, label: tx("Tag", "Day") },
                  { key: "week" as RevenueTimeframe, label: tx("Woche", "Week") },
                  { key: "month" as RevenueTimeframe, label: tx("Monat", "Month") },
                  { key: "year" as RevenueTimeframe, label: tx("Jahr", "Year") },
                ]).map(tf => (
                  <button key={tf.key} onClick={() => setRevenueTimeframe(tf.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${revenueTimeframe === tf.key ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>{tf.label}</button>
                ))}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: tx("Gesamtumsatz", "Total Revenue"), value: `€${formatCurrency(revenueTotalCurrent)}`, icon: <DollarSign className="w-5 h-5" />, change: "+12.4%", up: true, color: "bg-emerald-500" },
                  { label: tx("Abschlüsse", "Deals Closed"), value: revenueTotalDeals.toString(), icon: <Briefcase className="w-5 h-5" />, change: "+8.2%", up: true, color: "bg-purple-500" },
                  { label: tx("Ø Dealwert", "Avg. Deal Value"), value: `€${formatCurrency(revenueAvgDeal)}`, icon: <Receipt className="w-5 h-5" />, change: "+3.1%", up: true, color: "bg-blue-500" },
                  { label: tx("Ø Tage bis Sale", "Avg. Days to Sale"), value: `${avgDaysToClose} ${tx("Tage", "days")}`, icon: <Timer className="w-5 h-5" />, change: "-2.3", up: true, color: "bg-orange-500" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center text-white`}>{kpi.icon}</div>
                      <span className={`text-sm font-medium flex items-center gap-1 ${kpi.up ? "text-emerald-500" : "text-red-500"}`}>
                        {kpi.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{kpi.change}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Chart (Bar visualization) */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold mb-6">{tx("Umsatz-Entwicklung", "Revenue Trend")}</h3>
                <div className="flex items-end gap-3 h-48">
                  {revenueSales.slice().reverse().map((entry, i) => {
                    const maxRev = Math.max(...revenueSales.map(r => r.revenue), 1);
                    const heightPct = (entry.revenue / maxRev) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">€{formatCurrency(entry.revenue)}</span>
                        <div className="w-full relative group">
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all hover:from-purple-500 hover:to-purple-300 cursor-pointer" style={{ height: `${Math.max(heightPct * 1.6, 4)}px` }} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                            {entry.deals} {tx("Deals", "deals")} · {entry.source}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{entry.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline + Source Performance */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Deal Pipeline */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold mb-6">{tx("Deal-Pipeline", "Deal Pipeline")}</h3>
                  <div className="space-y-4">
                    {revenuePipeline.map((stage, i) => {
                      const maxCount = Math.max(...revenuePipeline.map(s => s.count));
                      const widthPct = (stage.count / maxCount) * 100;
                      const convRate = i > 0 ? ((stage.count / revenuePipeline[i - 1].count) * 100).toFixed(1) : null;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{stage.stage}</span>
                            <div className="flex items-center gap-3">
                              {convRate && <span className="text-xs text-gray-400">{convRate}%</span>}
                              <span className="text-sm font-semibold">{stage.count}</span>
                            </div>
                          </div>
                          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${widthPct}%` }} />
                          </div>
                          {stage.value > 0 && <p className="text-xs text-gray-400 mt-1">€{formatCurrency(stage.value)} {tx("Pipeline-Wert", "pipeline value")}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue by Source + Time to Close */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold mb-6">{tx("Umsatz nach Quelle", "Revenue by Source")}</h3>
                  <div className="space-y-2">
                    {revenueBySource.map((src, i) => (
                      <div key={i}>
                        <div onClick={() => setExpandedRevenueSource(expandedRevenueSource === src.source ? null : src.source)} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${expandedRevenueSource === src.source ? "bg-gray-50 dark:bg-gray-800" : ""}`}>
                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-600">{src.pct.toFixed(0)}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{src.source}</span>
                              <span className="font-semibold">{"\u20AC"}{formatCurrency(src.revenue)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-400">{src.deals} {tx("Deals", "deals")}</span>
                              <span className="text-xs text-gray-400">{"\u00B7"}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Timer className="w-3 h-3" /> {"\u00D8"} {src.avgDays} {tx("Tage", "days")}</span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedRevenueSource === src.source ? "rotate-180" : ""}`} />
                        </div>
                        {expandedRevenueSource === src.source && (
                          <div className="ml-14 mr-3 mt-1 mb-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">{tx("Umsatz", "Revenue")}</p>
                                <p className="text-sm font-bold text-emerald-500">{"\u20AC"}{formatCurrency(src.revenue)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">{tx("Abschlüsse", "Deals")}</p>
                                <p className="text-sm font-bold">{src.deals}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">{"\u00D8"} {tx("Deal-Wert", "Deal Value")}</p>
                                <p className="text-sm font-bold">{"\u20AC"}{formatCurrency(Math.round(src.revenue / src.deals))}</p>
                              </div>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${src.pct}%` }} />
                            </div>
                            <p className="text-xs text-gray-400">{src.pct.toFixed(1)}% {tx("des Gesamtumsatzes", "of total revenue")}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time-to-Close Breakdown */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold mb-2">{tx("Dauer: Marketing-Kontakt → Sale", "Duration: Marketing Contact → Sale")}</h3>
                <p className="text-sm text-gray-500 mb-6">{tx("Wie lange ein Kunde vom ersten Marketing-Kontakt bis zum Abschluss braucht", "How long a customer takes from first marketing contact to close")}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { range: "0–7 " + tx("Tage", "days"), count: 8, pct: 16.3, color: "bg-emerald-500" },
                    { range: "8–14 " + tx("Tage", "days"), count: 14, pct: 28.6, color: "bg-blue-500" },
                    { range: "15–30 " + tx("Tage", "days"), count: 18, pct: 36.7, color: "bg-purple-500" },
                    { range: "30+ " + tx("Tage", "days"), count: 9, pct: 18.4, color: "bg-orange-500" },
                  ].map((bucket, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className={`w-8 h-8 rounded-lg ${bucket.color} mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold`}>{bucket.count}</div>
                      <p className="text-sm font-medium">{bucket.range}</p>
                      <p className="text-xs text-gray-400">{bucket.pct}%</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <Timer className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-semibold text-purple-700 dark:text-purple-300">{tx("Durchschnittliche Dauer", "Average Duration")}: {avgDaysToClose} {tx("Tage", "days")}</p>
                    <p className="text-sm text-purple-600/70 dark:text-purple-400/70">{tx("Median: 18 Tage · Schnellster: 7 Tage · Längster: 42 Tage", "Median: 18 days · Fastest: 7 days · Longest: 42 days")}</p>
                  </div>
                </div>
              </div>

              {/* Recent Deals Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold">{tx("Letzte Abschlüsse", "Recent Deals")}</h3>
                  <button onClick={handleExport} className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-600"><Download className="w-4 h-4" />{tx("Exportieren", "Export")}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                        <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase">{tx("Kunde", "Customer")}</th>
                        <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase">{tx("Umsatz", "Revenue")}</th>
                        <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase">{tx("Quelle", "Source")}</th>
                        <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase">{tx("Tage bis Sale", "Days to Sale")}</th>
                        <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase">{tx("Datum", "Date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueDeals.map(deal => (
                        <React.Fragment key={deal.id}>
                        <tr onClick={() => setRevenueDealDetail(revenueDealDetail === deal.id ? null : deal.id)} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${revenueDealDetail === deal.id ? "bg-purple-50/50 dark:bg-purple-500/5" : ""}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">{deal.customer.charAt(0)}</div>
                              <span className="font-medium text-sm">{deal.customer}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${revenueDealDetail === deal.id ? "rotate-180" : ""}`} />
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-emerald-600">{"\u20AC"}{formatCurrency(deal.revenue)}</td>
                          <td className="py-4 px-6"><span className={`text-xs px-2 py-1 rounded-full ${deal.source === "Meta Ads" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : deal.source === "Google Ads" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"}`}>{deal.source}</span></td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${deal.daysToClose <= 14 ? "text-emerald-600" : deal.daysToClose <= 28 ? "text-orange-500" : "text-red-500"}`}>{deal.daysToClose} {tx("Tage", "days")}</span>
                              {deal.daysToClose <= 14 && <Zap className="w-3 h-3 text-emerald-500" />}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">{deal.date}</td>
                        </tr>
                        {revenueDealDetail === deal.id && (
                          <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl">
                                  <p className="text-xs text-gray-500 mb-1">{tx("Deal-Nr.", "Deal No.")}</p>
                                  <p className="font-semibold text-purple-600">{deal.id}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl">
                                  <p className="text-xs text-gray-500 mb-1">{tx("Umsatz", "Revenue")}</p>
                                  <p className="font-semibold text-emerald-600">{"\u20AC"}{formatCurrency(deal.revenue)}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl">
                                  <p className="text-xs text-gray-500 mb-1">{tx("Abschlussdatum", "Closing Date")}</p>
                                  <p className="font-semibold">{deal.date}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl">
                                  <p className="text-xs text-gray-500 mb-1">{tx("Geschätzter LTV", "Est. LTV")}</p>
                                  <p className="font-semibold text-purple-500">{"\u20AC"}{formatCurrency(deal.revenue * 3)}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs text-gray-400">{tx("Kampagnen-Attribution", "Campaign Attribution")}:</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">{deal.source}</span>
                                <span className="text-xs text-gray-400">|</span>
                                <span className="text-xs text-gray-500">{tx("Touchpoints", "Touchpoints")}: {Math.max(2, Math.floor(deal.daysToClose / 5))}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {section === "reports" && (
            <div className="space-y-6">
              {reportToast && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl animate-pulse">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{tx(`Report "${reportToast}" wird generiert...`, `Report "${reportToast}" is being generated...`)}</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[{ t: tx("Wöchentlicher Überblick", "Weekly Overview"), k: "active", s: tx("Aktiv", "Active"), d: tx("Jeden Montag automatisch", "Every Monday automatically") }, { t: tx("Monatlicher ROI Report", "Monthly ROI Report"), k: "active", s: tx("Aktiv", "Active"), d: tx("01. jeden Monats", "1st of each month") }, { t: tx("Kampagnen-Vergleich", "Campaign Comparison"), k: "ready", s: tx("Bereit", "Ready"), d: tx("Manuell generieren", "Generate manually") }, { t: tx("Lead-Qualität Analyse", "Lead Quality Analysis"), k: "active", s: tx("Aktiv", "Active"), d: tx("Täglich automatisch", "Daily automatically") }, { t: tx("Channel Attribution", "Channel Attribution"), k: "ready", s: tx("Bereit", "Ready"), d: tx("Manuell generieren", "Generate manually") }, { t: tx("Custom Report", "Custom Report"), k: "new", s: tx("Neu", "New"), d: tx("Jetzt erstellen", "Create now") }].map((r, i) => (
                  <div key={i} onClick={() => { if (r.k === "active") { handleGenerateReport(r.t); } else if (r.k === "ready") { handleGenerateReport(r.t); handleExport(); } else { handleGenerateReport(r.t); } }} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-500/30 cursor-pointer group transition-colors">
                    <div className="flex items-start justify-between mb-4"><div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div><span className={`text-xs px-2 py-1 rounded-full ${r.k === "active" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : r.k === "ready" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{r.s}</span></div>
                    <h3 className="font-semibold mb-1 group-hover:text-purple-600">{r.t}</h3>
                    <p className="text-sm text-gray-500 mb-3">{r.d}</p>
                    <div className="flex items-center gap-2 text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.k === "active" ? <><RefreshCw className="w-3 h-3" />{tx("Jetzt generieren", "Generate now")}</> : r.k === "ready" ? <><Download className="w-3 h-3" />{tx("Herunterladen", "Download")}</> : <><Zap className="w-3 h-3" />{tx("Erstellen", "Create")}</>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MONITOR */}
          {section === "monitor" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /><span className="text-sm text-gray-500">{tx("Live – Updates alle 30s", "Live – Updates every 30s")}</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: tx("Aktive Nutzer", "Active users"), v: "247", t: "+12" }, { l: tx("Klicks/Std", "Clicks/hr"), v: "1,842", t: "+89" }, { l: tx("Conv. heute", "Conv. today"), v: "23", t: "+5" }, { l: tx("Ausgaben heute", "Spend today"), v: `€${formatCurrency(Math.round(metrics.totalSpend * 0.15))}`, t: "" }].map((s, i) => (<div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"><p className="text-sm text-gray-500 mb-1">{s.l}</p><div className="flex items-end gap-2"><p className="text-3xl font-bold">{s.v}</p>{s.t && <span className="text-sm text-emerald-500 mb-1">{s.t}</span>}</div></div>))}</div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"><h3 className="font-semibold mb-6">{tx("Live Activity", "Live Activity")}</h3><div className="space-y-2">{[{ t: tx("Gerade", "Just now"), e: tx("Neuer Lead", "New lead"), d: "Google Search", c: "bg-emerald-500", nav: "leads" as ActiveSection }, { t: tx("Vor 2 Min", "2 min ago"), e: tx("Conversion", "Conversion"), d: tx("Meta Retargeting – €2.500", "Meta Retargeting – €2,500"), c: "bg-purple-500", nav: "revenue" as ActiveSection }, { t: tx("Vor 5 Min", "5 min ago"), e: tx("Neuer Lead", "New lead"), d: "Meta Awareness", c: "bg-emerald-500", nav: "leads" as ActiveSection }, { t: tx("Vor 8 Min", "8 min ago"), e: tx("Klick-Spike", "Click spike"), d: "+45% in 10 Min", c: "bg-blue-500", nav: "campaigns" as ActiveSection }, { t: tx("Vor 12 Min", "12 min ago"), e: tx("Neuer Lead", "New lead"), d: "LinkedIn B2B", c: "bg-emerald-500", nav: "leads" as ActiveSection }].map((a, i) => (<div key={i} onClick={() => { setHighlightedMonitorItem(i); setTimeout(() => { setSection(a.nav); setHighlightedMonitorItem(null); }, 600); }} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${highlightedMonitorItem === i ? "bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-300 dark:ring-purple-500/30 scale-[1.01]" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}><div className={`w-2 h-2 rounded-full ${a.c} ${i === 0 ? "animate-pulse" : ""}`} /><span className="text-sm text-gray-400 w-24">{a.t}</span><span className="font-medium">{a.e}</span><span className="text-sm text-gray-500 flex-1">{a.d}</span><ChevronRight className="w-4 h-4 text-gray-300" /></div>))}</div></div>
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h2 className="text-xl font-semibold mb-4">{tx("API-Verbindungen", "API Connections")}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {connections.map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center`}>{c.icon}</div><div><h3 className="font-semibold">{c.name}</h3>{c.connected ? <p className="text-sm text-gray-500">{c.accountName} · {c.lastSync}</p> : <p className="text-sm text-gray-400">{tx("Nicht verbunden", "Not connected")}</p>}</div></div>
                        <div className={`w-3 h-3 rounded-full ${c.connected ? "bg-emerald-500" : "bg-gray-300"}`} />
                      </div>
                      {c.connected ? (
                        <div className="flex gap-2"><button onClick={handleRefresh} className="flex-1 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center gap-2"><RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />{tx("Sync", "Sync")}</button><button onClick={() => handleDisconnect(c.id)} className="flex-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl">{tx("Trennen", "Disconnect")}</button></div>
                      ) : (
                        <button onClick={() => setConnectionModal(c)} className="w-full py-3 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 flex items-center justify-center gap-2">{tx("Verbinden", "Connect")}<ExternalLink className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">{tx("Benachrichtigungen", "Notifications")}</h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
                  {([{ k: "emailLeads", l: tx("E-Mail bei neuen Leads", "Email on new leads") }, { k: "dailyReport", l: tx("Täglicher Performance Report", "Daily performance report") }, { k: "budgetAlerts", l: tx("Budget-Warnungen (>80%)", "Budget warnings (>80%)") }, { k: "roasAlerts", l: tx("ROAS unter Zielwert", "ROAS below target") }] as const).map(s => (
                    <div key={s.k} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <span>{s.l}</span>
                      <button onClick={() => handleToggleSetting(s.k)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${settings[s.k] ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-600"}`}><span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-200 ease-in-out ${settings[s.k] ? "translate-x-6" : "translate-x-1"}`} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="bottom-nav md:hidden">
        {[
          { icon: LayoutDashboard, label: tx('Übersicht', 'Overview'), href: '/dashboard', active: true },
          { icon: Calendar, label: 'Hub', href: '/hub', active: false },
          { icon: FileText, label: 'Content', href: '/content', active: false },
          { icon: Cpu, label: lang === 'de' ? 'Systeme' : 'Systems', href: '/system', active: false },
          { icon: Mail, label: 'Cold Mail', href: '/cold-mail', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors text-[10px] font-medium ${item.active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-zinc-500'}`}>
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}
