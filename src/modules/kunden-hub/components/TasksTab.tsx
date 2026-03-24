import { useState } from "react";
import Badge from "../ui/components/badge/Badge";
import Button from "../ui/components/button/Button";
import Input from "../ui/form/input/InputField";
import Select from "../ui/form/Select";
import { Modal } from "../ui/components/modal";
import { useLanguage } from "../i18n/LanguageContext";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  assignee: string;
  dueDate: string;
  priority: "urgent" | "high" | "normal" | "low";
}

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Pixel besorgen", status: "todo", assignee: "Anak", dueDate: "2026-03-22", priority: "urgent" },
  { id: "t2", title: "Kickoff vorbereiten", status: "in_progress", assignee: "Claudio", dueDate: "2026-03-20", priority: "high" },
  { id: "t3", title: "Materialien einsammeln", status: "todo", assignee: "Claudio", dueDate: "2026-03-25", priority: "normal" },
  { id: "t4", title: "Videodreh planen", status: "done", assignee: "Anak", dueDate: "2026-03-18", priority: "high" },
  { id: "t5", title: "Strategie reviewen", status: "todo", assignee: "Claudio", dueDate: "2026-03-21", priority: "normal" },
];

type Filter = "all" | "open" | "done";

const priorityBadgeColor: Record<string, "error" | "warning" | "info" | "light"> = {
  urgent: "error",
  high: "warning",
  normal: "info",
  low: "light",
};

interface TasksTabProps {
  clientId: string;
}

export default function TasksTab({ clientId: _clientId }: TasksTabProps) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("");

  const today = new Date().toISOString().split("T")[0]!;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "open") return task.status !== "done";
    if (filter === "done") return task.status === "done";
    return true;
  });

  const toggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "done" ? "todo" : "done" }
          : task
      )
    );
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      status: "todo",
      assignee: newAssignee || "Claudio",
      dueDate: newDueDate || today,
      priority: (newPriority as Task["priority"]) || "normal",
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTitle("");
    setNewAssignee("");
    setNewDueDate("");
    setNewPriority("");
    setShowModal(false);
  };

  const getInitials = (name: string) =>
    (name || '')
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("tasks.all") },
    { key: "open", label: t("tasks.open") },
    { key: "done", label: t("tasks.done") },
  ];

  const assigneeOptions = [
    { value: "Claudio", label: "Claudio" },
    { value: "Anak", label: "Anak" },
  ];

  const priorityOptions = [
    { value: "urgent", label: t("tasks.priority.urgent") },
    { value: "high", label: t("tasks.priority.high") },
    { value: "normal", label: t("tasks.priority.normal") },
    { value: "low", label: t("tasks.priority.low") },
  ];

  return (
    <div>
      {/* Filter pills + new task button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          + {t("tasks.newTask")}
        </Button>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/30">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("tasks.noTasks")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === "done";
            const isOverdue = !isDone && task.dueDate < today;

            return (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleDone(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                    isDone
                      ? "border-success-500 bg-success-500"
                      : "border-gray-300 dark:border-gray-600 hover:border-brand-500"
                  }`}
                >
                  {isDone && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isDone
                        ? "text-gray-400 line-through dark:text-gray-500"
                        : "text-gray-800 dark:text-white/90"
                    }`}
                  >
                    {task.title}
                  </p>
                </div>

                {/* Assignee */}
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">
                      {getInitials(task.assignee)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {task.assignee}
                  </span>
                </div>

                {/* Due date */}
                <span
                  className={`text-xs ${
                    isOverdue
                      ? "font-medium text-error-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {new Date(task.dueDate).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  {isOverdue && (
                    <span className="ml-1">({t("tasks.overdue")})</span>
                  )}
                </span>

                {/* Priority badge */}
                <Badge size="sm" variant="light" color={priorityBadgeColor[task.priority]}>
                  {t(`tasks.priority.${task.priority}`)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("tasks.newTask")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tasks.taskTitle")}
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("tasks.taskTitle")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tasks.assignee")}
            </label>
            <Select
              options={assigneeOptions}
              placeholder={t("tasks.assignee")}
              onChange={(val) => setNewAssignee(val)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tasks.dueDate")}
            </label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tasks.priority")}
            </label>
            <Select
              options={priorityOptions}
              placeholder={t("tasks.priority")}
              onChange={(val) => setNewPriority(val)}
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
            disabled={!newTitle.trim()}
            onClick={handleCreate}
          >
            {t("action.create")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
