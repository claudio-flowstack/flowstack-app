import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/components/modal";
import Button from "../ui/components/button/Button";
import Input from "../ui/form/input/InputField";
import Select from "../ui/form/Select";
import { useLanguage } from "../i18n/LanguageContext";
import { useFulfillmentStore } from "../store/fulfillment-store";
import { useNotification } from "../contexts/NotificationContext";
import { api } from "../services/api";
import type { Client, ClientStatus } from "../data/types";

type SetupStepStatus = "pending" | "running" | "done" | "error";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  asPage?: boolean;
}

const STEPS = ["firmendaten", "paketKonditionen", "projektDetails", "zusammenfassung"] as const;

/**
 * Maps each setup step index to the backend node ID that confirms completion.
 * Order matches SETUP_STEP_KEYS.
 */
const SETUP_NODE_MAP: { nodeId: string }[] = [
  { nodeId: "v3-is02" },  // CRM-Eintrag
  { nodeId: "v3-is06" },  // Drive-Ordner
  { nodeId: "v3-is03" },  // Slack-Channel
  { nodeId: "v3-is08" },  // ClickUp-Projekt
  { nodeId: "v3-is05" },  // Kickoff-Termin
  { nodeId: "v3-is04" },  // Welcome-Email
];

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;
const SHOW_SKIP_AFTER_MS = 90000;

const SETUP_STEP_KEYS = [
  "wizard.setupCrm",
  "wizard.setupDrive",
  "wizard.setupSlack",
  "wizard.setupClickup",
  "wizard.setupKickoff",
  "wizard.setupEmail",
];

function formatDateDE(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatPrice(val: string): string {
  if (!val) return "-";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("de-DE");
}

export default function OnboardingWizard({ isOpen, onClose, asPage = false }: OnboardingWizardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const addClient = useFulfillmentStore((s) => s.addClient);
  const { notify } = useNotification();

  const [currentStep, setCurrentStep] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [setupSteps, setSetupSteps] = useState<SetupStepStatus[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newClientIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Step 1: Firmendaten
  const [company, setCompany] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Paket & Konditionen
  const [paket, setPaket] = useState("");
  const [preis, setPreis] = useState("");
  const [zahlungsweise, setZahlungsweise] = useState("");
  const [vertragslaufzeit, setVertragslaufzeit] = useState("");
  const [startdatum, setStartdatum] = useState("");

  // Step 3: Projekt-Details
  const [branche, setBranche] = useState("");
  const [website, setWebsite] = useState("");
  const [zielgruppe, setZielgruppe] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [notizen, setNotizen] = useState("");

  const stepLabels = [
    t("wizard.firmendaten"),
    t("wizard.step2Title"),
    t("wizard.projektDetails"),
    t("wizard.summary"),
  ];

  const isStep1Valid = company.trim() && contactPerson.trim() && email.trim();
  const isStep2Valid = paket && preis.trim() && startdatum;

  const canProceed = (step: number): boolean => {
    if (step === 0) return !!isStep1Valid;
    if (step === 1) return !!isStep2Valid;
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setCompany("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setPaket("");
    setPreis("");
    setZahlungsweise("");
    setVertragslaufzeit("");
    setStartdatum("");
    setBranche("");
    setWebsite("");
    setZielgruppe("");
    setAccountManager("");
    setNotizen("");
  };

  const runSetupWithVerification = useCallback(
    (executionId: string) => {
      const initialStates: SetupStepStatus[] = SETUP_STEP_KEYS.map(() => "pending");
      setSetupSteps(initialStates);
      setShowSetup(true);
      newClientIdRef.current = executionId;

      // Track which steps have started their "running" animation
      const animatedRunning = new Set<number>();
      const startedAt = Date.now();
      let finished = false;

      // Set the first step to "running" immediately for visual feedback
      setSetupSteps((prev) => {
        const next = [...prev];
        next[0] = "running";
        return next;
      });
      animatedRunning.add(0);

      const finishAndNavigate = () => {
        if (finished) return;
        finished = true;
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setTimeout(() => {
          resetForm();
          setShowSetup(false);
          onClose();
          navigate(`/kunden-hub/clients/${executionId}`);
        }, 800);
      };

      pollingRef.current = setInterval(async () => {
        const elapsed = Date.now() - startedAt;

        // After 90s: show skip button (but keep polling)
        if (elapsed > SHOW_SKIP_AFTER_MS) {
          setShowSkipButton(true);
        }

        // Hard timeout after 120s — mark remaining as done and navigate
        if (elapsed > POLL_TIMEOUT_MS) {
          setSetupSteps((prev) => prev.map((s) => (s === "done" || s === "error" ? s : "done")));
          finishAndNavigate();
          return;
        }

        try {
          const status = await api.execution.getStatus(executionId);
          const nodes = status.nodes;

          setSetupSteps((prev) => {
            const next = [...prev] as SetupStepStatus[];
            let allDoneOrError = true;

            for (let i = 0; i < SETUP_NODE_MAP.length; i++) {
              const mapping = SETUP_NODE_MAP[i];
              if (!mapping) continue;
              const nodeData = nodes[mapping.nodeId];
              const nodeStatus = nodeData?.status;

              if (nodeStatus === "completed") {
                next[i] = "done";
              } else if (nodeStatus === "failed") {
                next[i] = "error";
              } else if (nodeStatus === "running") {
                next[i] = "running";
                animatedRunning.add(i);
                allDoneOrError = false;
              } else {
                // pending/blocked — show as running if it is the next in line
                // to keep the animation smooth
                const prevAllDone = next.slice(0, i).every((s) => s === "done" || s === "error");
                if (prevAllDone && !animatedRunning.has(i)) {
                  next[i] = "running";
                  animatedRunning.add(i);
                }
                allDoneOrError = false;
              }
            }

            if (allDoneOrError) {
              // All steps resolved — navigate after brief delay
              setTimeout(() => finishAndNavigate(), 0);
            }

            return next;
          });
        } catch {
          // Network error during polling — don't break animation,
          // just keep trying on next interval
        }
      }, POLL_INTERVAL_MS);
    },
    [navigate, onClose]
  );

  const handleCreate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1) Create client in Airtable first
      const airtableResult = await api.clients.create({
        company: company.trim(),
        contact: contactPerson.trim(),
        email: email.trim(),
        branche: branche || undefined,
        account_manager: accountManager || 'Claudio',
      });

      // 2) Then start V3 execution
      const result = await api.execution.start({
        company: company.trim(),
        email: email.trim(),
        contact: contactPerson.trim(),
        phone: phone.trim() || undefined,
        branche: branche || undefined,
        website: website.trim() || undefined,
        stellen: undefined,
        budget: preis.trim() || undefined,
        account_manager: accountManager || 'Claudio',
      });

      // Keep airtableResult reference for potential future use
      void airtableResult;

      // Also add to local store as fallback/cache
      const newClient: Client = {
        id: result.execution_id,
        name: contactPerson.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        branche: branche || "other",
        status: "onboarding" as ClientStatus,
        currentPhase: "onboarding",
        accountManager: accountManager || "Claudio Di Franco",
        kickoffDate: startdatum || undefined,
        createdAt: new Date().toISOString().split("T")[0]!,
        paket: paket || undefined,
        monatspreis: preis ? parseFloat(preis) : undefined,
        connections: [],
      };
      addClient(newClient);

      notify({
        id: `onboarding-success-${Date.now()}`,
        type: 'success',
        title: t('wizard.setupDone'),
        message: `${company.trim()} — Execution gestartet`,
      });

      // Run setup with real backend verification, then navigate to client detail
      try {
        runSetupWithVerification(result.execution_id);
      } catch (animErr) {
        console.warn('[Kunden-Hub] Setup-Verification fehlgeschlagen:', animErr);
        // Clean up polling interval if set
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Navigate directly as fallback
        resetForm();
        onClose();
        navigate(`/kunden-hub/clients/${result.execution_id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      notify({
        id: `onboarding-error-${Date.now()}`,
        type: 'error',
        title: 'Onboarding fehlgeschlagen',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getStepColor = (index: number) => {
    if (index < currentStep) return "bg-success-500 text-white";
    if (index === currentStep) return "bg-brand-500 text-white";
    return "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  };

  const getLineColor = (index: number) => {
    if (index < currentStep) return "bg-success-500";
    return "bg-gray-200 dark:bg-gray-700";
  };

  // Helper: get display label for select values
  const paketLabel = paket || "-";
  const zahlungsweiseLabel = zahlungsweise || "-";
  const vertragslaufzeitLabel = vertragslaufzeit || "-";
  const brancheLabel = branche
    ? t(`industry.${branche}`)
    : "-";
  const managerLabel = accountManager || "-";

  const wizardContent = (
    <>
      <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t("wizard.title")}
      </h3>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center">
        {STEPS.map((_, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${getStepColor(index)}`}
              >
                {index < currentStep ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 hidden sm:block whitespace-nowrap">
                {stepLabels[index]}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 sm:w-12 transition ${getLineColor(index)}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Firmendaten */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dialog.companyName")} *
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t("dialog.companyName")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dialog.contactPerson")} *
            </label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder={t("dialog.contactPerson")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dialog.email")} *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("dialog.email")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dialog.phone")}
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("dialog.phone")}
            />
          </div>
        </div>
      )}

      {/* Step 2: Paket & Konditionen */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Gebuchtes Paket */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.package")} *
            </label>
            <Select
              value={paket}
              onChange={(value) => setPaket(value)}
              placeholder={t("wizard.packagePlaceholder")}
              options={[
                { value: "Recruiting Starter", label: "Recruiting Starter" },
                { value: "Recruiting Pro", label: "Recruiting Pro" },
                { value: "Marketing Starter", label: "Marketing Starter" },
                { value: "Marketing Pro", label: "Marketing Pro" },
                { value: "Full-Service", label: "Full-Service" },
              ]}
            />
          </div>

          {/* Monatlicher Preis */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.price")} *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400">
                {"\u20AC"}
              </span>
              <Input
                type="number"
                value={preis}
                onChange={(e) => setPreis(e.target.value)}
                placeholder="z.B. 2500"
                className="pl-8"
              />
            </div>
          </div>

          {/* Zahlungsweise */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.payment")}
            </label>
            <Select
              value={zahlungsweise}
              onChange={(value) => setZahlungsweise(value)}
              placeholder={t("wizard.paymentPlaceholder")}
              options={[
                { value: "Monatlich", label: t("wizard.paymentMonthly") },
                { value: "Quartalsweise", label: t("wizard.paymentQuarterly") },
                { value: "Halbjährlich", label: t("wizard.paymentBiannual") },
                { value: "Jährlich", label: t("wizard.paymentYearly") },
              ]}
            />
          </div>

          {/* Vertragslaufzeit */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.duration")}
            </label>
            <Select
              value={vertragslaufzeit}
              onChange={(value) => setVertragslaufzeit(value)}
              placeholder={t("wizard.durationPlaceholder")}
              options={[
                { value: "3 Monate", label: t("wizard.duration3") },
                { value: "6 Monate", label: t("wizard.duration6") },
                { value: "12 Monate", label: t("wizard.duration12") },
                { value: "Unbefristet", label: t("wizard.durationUnlimited") },
              ]}
            />
          </div>

          {/* Startdatum */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.startDate")} *
            </label>
            <div className="relative">
              <input
                type="date"
                value={startdatum}
                onChange={(e) => setStartdatum(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm font-medium shadow-sm transition-all focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:border-gray-600 dark:focus:border-brand-800"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Projekt-Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Branche */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.branche")} *
            </label>
            <Select
              value={branche}
              onChange={(value) => setBranche(value)}
              placeholder={t("wizard.branchePlaceholder")}
              options={[
                { value: "healthcare", label: t("industry.healthcare") },
                { value: "it", label: t("industry.it") },
                { value: "crafts", label: t("industry.crafts") },
                { value: "marketing", label: t("industry.marketing") },
                { value: "coaching", label: t("industry.coaching") },
                { value: "solar", label: t("industry.solar") },
                { value: "recruiting", label: t("industry.recruiting") },
                { value: "other", label: t("industry.other") },
              ]}
            />
          </div>

          {/* Website */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.de"
            />
          </div>

          {/* Zielgruppe */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.zielgruppe")}
            </label>
            <textarea
              value={zielgruppe}
              onChange={(e) => setZielgruppe(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder={t("wizard.zielgruppePlaceholder")}
            />
          </div>

          {/* Account Manager */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dialog.accountManager")}
            </label>
            <Select
              value={accountManager}
              onChange={(value) => setAccountManager(value)}
              placeholder={t("wizard.managerPlaceholder")}
              options={[
                { value: "Claudio Di Franco", label: "Claudio Di Franco" },
                { value: "Anak", label: "Anak" },
              ]}
            />
          </div>

          {/* Notizen */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("wizard.projectNotes")}
            </label>
            <textarea
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder={t("wizard.projectNotesPlaceholder")}
            />
          </div>
        </div>
      )}

      {/* Step 4: Zusammenfassung */}
      {currentStep === 3 && !showSetup && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          {/* Firmendaten */}
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("wizard.firmendaten")}
            </h4>
            <div className="space-y-1.5">
              <SummaryRow label={t("dialog.companyName")} value={company} />
              <SummaryRow label={t("dialog.contactPerson")} value={contactPerson} />
              <SummaryRow label={t("dialog.email")} value={email} />
              <SummaryRow label={t("dialog.phone")} value={phone || "-"} />
            </div>
          </div>

          {/* Paket & Konditionen */}
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("wizard.step2Title")}
            </h4>
            <div className="space-y-1.5">
              <SummaryRow label={t("wizard.package")} value={paketLabel} />
              <SummaryRow
                label={t("wizard.price")}
                value={preis ? `\u20AC${formatPrice(preis)}/Monat` : "-"}
              />
              <SummaryRow label={t("wizard.payment")} value={zahlungsweiseLabel || "-"} />
              <SummaryRow label={t("wizard.duration")} value={vertragslaufzeitLabel || "-"} />
              <SummaryRow label={t("wizard.startDate")} value={formatDateDE(startdatum)} />
            </div>
          </div>

          {/* Projekt-Details */}
          <div className="px-5 py-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("wizard.projektDetails")}
            </h4>
            <div className="space-y-1.5">
              <SummaryRow label={t("wizard.branche")} value={brancheLabel} />
              <SummaryRow label="Website" value={website || "-"} />
              <SummaryRow label={t("wizard.zielgruppe")} value={zielgruppe || "-"} />
              <SummaryRow label={t("dialog.accountManager")} value={managerLabel} />
              {notizen && <SummaryRow label={t("wizard.projectNotes")} value={notizen} />}
            </div>
          </div>
        </div>
      )}

      {/* Setup Animation Overlay */}
      {showSetup && (
        <div
          className={`${
            asPage ? "relative" : "absolute inset-0"
          } z-10 flex flex-col items-center justify-center rounded-2xl bg-white p-8 dark:bg-gray-900`}
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("wizard.settingUp")}
          </h3>
          <div className="mb-6 w-full max-w-sm space-y-3">
            {SETUP_STEP_KEYS.map((key, idx) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-6 text-center text-base">
                  {setupSteps[idx] === "done" ? (
                    <svg className="mx-auto h-5 w-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : setupSteps[idx] === "error" ? (
                    <svg className="mx-auto h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : setupSteps[idx] === "running" ? (
                    <svg className="mx-auto h-5 w-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="mx-auto block h-5 w-5 rounded border-2 border-gray-200 dark:border-gray-600" />
                  )}
                </span>
                <span
                  className={`text-sm ${
                    setupSteps[idx] === "done"
                      ? "text-success-500"
                      : setupSteps[idx] === "error"
                      ? "text-red-500"
                      : setupSteps[idx] === "running"
                      ? "font-medium text-brand-500"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {t(key)}
                  {setupSteps[idx] === "running" && "..."}
                  {setupSteps[idx] === "error" && ` — ${t("wizard.stepFailed")}`}
                </span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-sm">
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  setupSteps.some((s) => s === "error") ? "bg-amber-500" : "bg-brand-500"
                }`}
                style={{
                  width: `${Math.round(
                    (setupSteps.filter((s) => s === "done" || s === "error").length / setupSteps.length) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
              {Math.round(
                (setupSteps.filter((s) => s === "done" || s === "error").length / setupSteps.length) * 100
              )}
              %
            </p>
          </div>
          {setupSteps.every((s) => s === "done") && (
            <p className="mt-4 text-sm font-medium text-success-500">{t("wizard.setupDone")}</p>
          )}
          {setupSteps.every((s) => s === "done" || s === "error") && setupSteps.some((s) => s === "error") && (
            <p className="mt-4 text-sm font-medium text-amber-500">{t("wizard.setupPartial")}</p>
          )}
          {showSkipButton && !setupSteps.every((s) => s === "done" || s === "error") && (
            <div className="mt-4 text-center">
              <p className="mb-2 text-xs text-gray-400">Setup dauert laenger als erwartet.</p>
              <button
                onClick={() => {
                  setSetupSteps((prev) => prev.map((s) => (s === "done" || s === "error" ? s : "done")));
                }}
                className="text-sm font-medium text-brand-500 hover:text-brand-600 underline"
              >
                Trotzdem weiter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      {!showSetup && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={currentStep === 0} onClick={handleBack}>
            {t("wizard.back")}
          </Button>
          <div className="flex items-center gap-3">
            {!asPage && (
              <Button variant="outline" size="sm" onClick={handleClose}>
                {t("action.cancel")}
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!canProceed(currentStep)}
                onClick={handleNext}
              >
                {t("wizard.next")}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={!isStep1Valid || !isStep2Valid || isSubmitting}
                onClick={handleCreate}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("wizard.createClient")}
                  </span>
                ) : (
                  t("wizard.createClient")
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (asPage) {
    return (
      <div className="relative mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 dark:border-gray-800 dark:bg-white/[0.03]">
        {wizardContent}
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl p-6 sm:p-8">
      {wizardContent}
    </Modal>
  );
}

/** Small helper for the summary rows */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </span>
    </div>
  );
}
