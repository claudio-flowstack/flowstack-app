import { useState } from "react";
import Badge from "../ui/components/badge/Badge";
import Button from "../ui/components/button/Button";
import Input from "../ui/form/input/InputField";
import Select from "../ui/form/Select";
import { Modal } from "../ui/components/modal";
import { useLanguage } from "../i18n/LanguageContext";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "kickoff" | "review" | "launch" | "other";
  participants: string[];
}

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Kickoff Call", date: "2026-03-20", time: "10:00", type: "kickoff", participants: ["Claudio", "Sandra Müller"] },
  { id: "e2", title: "Strategie Review", date: "2026-03-25", time: "14:00", type: "review", participants: ["Claudio", "Anak"] },
  { id: "e3", title: "Launch-Termin", date: "2026-04-01", time: "09:00", type: "launch", participants: ["Claudio", "Anak", "Sandra Müller"] },
];

const typeBadgeColor: Record<string, "primary" | "warning" | "success" | "light"> = {
  kickoff: "primary",
  review: "warning",
  launch: "success",
  other: "light",
};

interface CalendarTabProps {
  clientId: string;
}

export default function CalendarTab({ clientId: _clientId }: CalendarTabProps) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [showModal, setShowModal] = useState(false);

  // New event form
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("");

  const today = new Date().toISOString().split("T")[0]!;

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = `${a.date}T${a.time}`;
    const dateB = `${b.date}T${b.time}`;
    return dateA.localeCompare(dateB);
  });

  const timeOptions = (() => {
    const options = [];
    for (let h = 9; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m > 0) break;
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        options.push({ value: time, label: time });
      }
    }
    return options;
  })();

  const typeOptions = [
    { value: "kickoff", label: t("calendar.type.kickoff") },
    { value: "review", label: t("calendar.type.review") },
    { value: "launch", label: t("calendar.type.launch") },
    { value: "other", label: "Sonstiges" },
  ];

  const handleCreate = () => {
    if (!newTitle.trim() || !newDate) return;
    const newEvent: CalendarEvent = {
      id: `e-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      time: newTime || "10:00",
      type: (newType as CalendarEvent["type"]) || "other",
      participants: ["Claudio"],
    };
    setEvents((prev) => [...prev, newEvent]);
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setNewType("");
    setShowModal(false);
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      kickoff: t("calendar.type.kickoff"),
      review: t("calendar.type.review"),
      launch: t("calendar.type.launch"),
      other: "Sonstiges",
    };
    return map[type] || type;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {t("calendar.title")}
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          + {t("calendar.newEvent")}
        </Button>
      </div>

      {/* Events list */}
      {sortedEvents.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("calendar.noEvents")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const isPast = event.date < today;

            return (
              <div
                key={event.id}
                className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${
                  isPast ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isPast
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-800 dark:text-white/90"
                      }`}
                    >
                      {event.title}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.date).toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      - {event.time} Uhr
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      size="sm"
                      variant="light"
                      color={typeBadgeColor[event.type] || "light"}
                    >
                      {getTypeLabel(event.type)}
                    </Badge>
                    {isPast && (
                      <Badge size="sm" variant="light" color="light">
                        {t("calendar.past")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t("calendar.participants")}:
                  </span>
                  <div className="flex items-center gap-1">
                    {event.participants.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Event Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("calendar.newEvent")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("calendar.eventTitle")}
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("calendar.eventTitle")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("calendar.date")}
            </label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("calendar.time")}
            </label>
            <Select
              options={timeOptions}
              placeholder={t("calendar.time")}
              onChange={(val) => setNewTime(val)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("calendar.type")}
            </label>
            <Select
              options={typeOptions}
              placeholder={t("calendar.type")}
              onChange={(val) => setNewType(val)}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!newTitle.trim() || !newDate}
            onClick={handleCreate}
          >
            {t("action.create")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
