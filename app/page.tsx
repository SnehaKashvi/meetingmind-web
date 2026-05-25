"use client";

import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileUp,
  Home as HomeIcon,
  ListChecks,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AppTab = "today" | "calendar" | "reminders" | "settings";
type CalendarView = "month" | "week" | "day";
type ReminderOption = "at-time" | "5-min" | "15-min" | "1-hour" | "1-day";
type RepeatOption = "none" | "daily" | "weekly" | "monthly";
type SnoozeOption = "10-min" | "1-hour" | "tomorrow";
type ThemeMode = "light" | "dark";

type MyDayItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  category: string;
  reminderTime: ReminderOption;
  repeat: RepeatOption;
  completedDates: string[];
  snoozedUntil?: string;
  notifiedKeys?: string[];
};

type MyDayState = {
  version: number;
  items: MyDayItem[];
  theme: ThemeMode;
};

type Occurrence = {
  item: MyDayItem;
  date: string;
  key: string;
  startsAt: Date;
  reminderAt: Date;
  completed: boolean;
};

const storageKey = "myday-state-v2";
const today = new Date();
const todayString = formatDate(today);

const categories = [
  "Work",
  "Personal",
  "Family",
  "School",
  "Health/Fitness",
  "Bills/Payments"
];

const categoryStyles: Record<string, string> = {
  Work: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Personal:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Family:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  School:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
  "Health/Fitness":
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
  "Bills/Payments":
    "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"
};

const reminderOptions: Array<{ label: string; value: ReminderOption; minutes: number }> = [
  { label: "At time", value: "at-time", minutes: 0 },
  { label: "5 minutes before", value: "5-min", minutes: 5 },
  { label: "15 minutes before", value: "15-min", minutes: 15 },
  { label: "1 hour before", value: "1-hour", minutes: 60 },
  { label: "1 day before", value: "1-day", minutes: 1440 }
];

const repeatOptions: Array<{ label: string; value: RepeatOption }> = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" }
];

const blankItem: Omit<MyDayItem, "id" | "completedDates" | "notifiedKeys"> = {
  title: "",
  date: todayString,
  startTime: "09:00",
  endTime: "09:30",
  location: "",
  notes: "",
  category: "Personal",
  reminderTime: "15-min",
  repeat: "none"
};

const sampleItems: MyDayItem[] = [
  {
    id: "sample-1",
    title: "Morning walk",
    date: todayString,
    startTime: "07:30",
    endTime: "08:00",
    location: "Local park",
    notes: "A gentle start to the day.",
    category: "Health/Fitness",
    reminderTime: "15-min",
    repeat: "daily",
    completedDates: [],
    notifiedKeys: []
  },
  {
    id: "sample-2",
    title: "Pay electricity bill",
    date: todayString,
    startTime: "17:00",
    endTime: "17:15",
    location: "Home",
    notes: "Check account balance first.",
    category: "Bills/Payments",
    reminderTime: "1-hour",
    repeat: "monthly",
    completedDates: [],
    notifiedKeys: []
  },
  {
    id: "sample-3",
    title: "School project check-in",
    date: formatDate(addDays(today, 1)),
    startTime: "16:00",
    endTime: "16:30",
    location: "Kitchen table",
    notes: "Review notes and prepare supplies.",
    category: "School",
    reminderTime: "1-hour",
    repeat: "weekly",
    completedDates: [],
    notifiedKeys: []
  },
  {
    id: "sample-4",
    title: "Family call",
    date: formatDate(addDays(today, 2)),
    startTime: "18:00",
    endTime: "18:45",
    location: "Phone",
    notes: "Ask about weekend plans.",
    category: "Family",
    reminderTime: "15-min",
    repeat: "none",
    completedDates: [],
    notifiedKeys: []
  }
];

const tabItems: Array<{ label: string; value: AppTab; icon: React.ReactNode }> = [
  { label: "Today", value: "today", icon: <HomeIcon size={18} /> },
  { label: "Calendar", value: "calendar", icon: <CalendarDays size={18} /> },
  { label: "Reminders", value: "reminders", icon: <ListChecks size={18} /> },
  { label: "Settings", value: "settings", icon: <Settings size={18} /> }
];

function createId() {
  return `myday-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const diff = next.getDay() === 0 ? -6 : 1 - next.getDay();
  next.setDate(next.getDate() + diff);
  return next;
}

function monthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function dateTime(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}`);
}

function reminderDateTime(item: MyDayItem, date: string) {
  const option = reminderOptions.find((entry) => entry.value === item.reminderTime);
  const when = dateTime(date, item.startTime);
  when.setMinutes(when.getMinutes() - (option?.minutes ?? 0));
  return when;
}

function friendlyDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(parseDate(date));
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function timeLabel(time: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(2026, 0, 1, hours, minutes));
}

function occursOn(item: MyDayItem, date: string) {
  if (date < item.date) return false;
  if (item.repeat === "none") return item.date === date;

  const start = parseDate(item.date);
  const target = parseDate(date);
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);

  if (item.repeat === "daily") return diffDays >= 0;
  if (item.repeat === "weekly") return diffDays >= 0 && diffDays % 7 === 0;
  return target.getDate() === start.getDate();
}

function makeOccurrence(item: MyDayItem, date: string): Occurrence {
  const key = `${item.id}:${date}`;
  return {
    item,
    date,
    key,
    startsAt: dateTime(date, item.startTime),
    reminderAt: item.snoozedUntil ? new Date(item.snoozedUntil) : reminderDateTime(item, date),
    completed: item.completedDates.includes(date)
  };
}

function occurrencesBetween(items: MyDayItem[], start: Date, days: number) {
  const dates = Array.from({ length: days }, (_, index) => formatDate(addDays(start, index)));
  return dates
    .flatMap((date) =>
      items.filter((item) => occursOn(item, date)).map((item) => makeOccurrence(item, date))
    )
    .sort((first, second) => first.startsAt.getTime() - second.startsAt.getTime());
}

function importItems(value: unknown): MyDayItem[] | null {
  if (!Array.isArray(value)) return null;

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const entry = item as Partial<MyDayItem>;
      return {
        id: entry.id ?? createId(),
        title: entry.title ?? "Imported reminder",
        date: entry.date ?? todayString,
        startTime: entry.startTime ?? "09:00",
        endTime: entry.endTime ?? "09:30",
        location: entry.location ?? "",
        notes: entry.notes ?? "",
        category: categories.includes(entry.category ?? "") ? entry.category! : "Personal",
        reminderTime: entry.reminderTime ?? "15-min",
        repeat: entry.repeat ?? "none",
        completedDates: entry.completedDates ?? [],
        snoozedUntil: entry.snoozedUntil,
        notifiedKeys: entry.notifiedKeys ?? []
      };
    });
}

export default function Home() {
  const [items, setItems] = useState<MyDayItem[]>(sampleItems);
  const [activeTab, setActiveTab] = useState<AppTab>("today");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankItem);
  const [notice, setNotice] = useState("Notifications are off");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved personal data first. If nothing exists, sample reminders appear.
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as MyDayState;
      setItems(parsed.items ?? sampleItems);
      setTheme(parsed.theme ?? "light");
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  // Save each change locally in this browser.
  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 2, items, theme }));
  }, [items, theme]);

  // Register PWA service worker and read notification state.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setNotice("Notifications are on");
    }
  }, []);

  // Reminder checker. This works while the app is open or installed and active.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();

      setItems((current) =>
        current.map((item) => {
          const next = occurrencesBetween([item], addDays(now, -1), 9).find(
            (occurrence) =>
              !occurrence.completed &&
              occurrence.reminderAt <= now &&
              occurrence.startsAt >= addDays(now, -1) &&
              !item.notifiedKeys?.includes(occurrence.key)
          );

          if (!next) return item;

          new Notification(`MyDay: ${item.title}`, {
            body: `${friendlyDate(next.date)} at ${timeLabel(item.startTime)}`,
            icon: "/icon.svg",
            tag: next.key
          });

          return {
            ...item,
            notifiedKeys: [...(item.notifiedKeys ?? []), next.key]
          };
        })
      );
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const allOccurrences = useMemo(
    () => occurrencesBetween(items, addDays(today, -30), 395),
    [items]
  );

  const todayOccurrences = allOccurrences.filter((occurrence) => occurrence.date === todayString);
  const upcoming = allOccurrences
    .filter((occurrence) => !occurrence.completed && occurrence.startsAt >= new Date())
    .slice(0, 8);
  const pendingCount = allOccurrences.filter(
    (occurrence) => !occurrence.completed && occurrence.startsAt >= parseDate(todayString)
  ).length;
  const searchResults = allOccurrences.filter((occurrence) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return [
      occurrence.item.title,
      occurrence.item.location,
      occurrence.item.notes,
      occurrence.item.category,
      occurrence.date
    ]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  function openAdd(date = selectedDate, quickTitle = "") {
    setEditingId(null);
    setForm({
      ...blankItem,
      title: quickTitle,
      date
    });
    setFormOpen(true);
  }

  function openQuick(range: "today" | "tomorrow" | "weekend" | "next-week") {
    const nextSaturday = addDays(today, (6 - today.getDay() + 7) % 7 || 7);
    const dateMap = {
      today,
      tomorrow: addDays(today, 1),
      weekend: nextSaturday,
      "next-week": addDays(today, 7)
    };
    openAdd(formatDate(dateMap[range]), "Reminder");
  }

  function openEdit(item: MyDayItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      notes: item.notes,
      category: item.category,
      reminderTime: item.reminderTime,
      repeat: item.repeat,
      snoozedUntil: item.snoozedUntil
    });
    setFormOpen(true);
  }

  function saveItem() {
    if (!form.title.trim()) return;

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                title: form.title.trim(),
                notifiedKeys: []
              }
            : item
        )
      );
    } else {
      setItems((current) => [
        ...current,
        {
          ...form,
          id: createId(),
          title: form.title.trim(),
          completedDates: [],
          notifiedKeys: []
        }
      ]);
    }

    setSelectedDate(form.date);
    setCursorDate(parseDate(form.date));
    setFormOpen(false);
  }

  function deleteItem(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!window.confirm(`Delete "${item?.title ?? "this reminder"}"?`)) return;
    setItems((current) => current.filter((entry) => entry.id !== id));
  }

  function completeOccurrence(occurrence: Occurrence) {
    setItems((current) =>
      current.map((item) =>
        item.id === occurrence.item.id
          ? {
              ...item,
              completedDates: Array.from(new Set([...item.completedDates, occurrence.date]))
            }
          : item
      )
    );
  }

  function snoozeOccurrence(occurrence: Occurrence, option: SnoozeOption) {
    const base = new Date();
    if (option === "10-min") base.setMinutes(base.getMinutes() + 10);
    if (option === "1-hour") base.setHours(base.getHours() + 1);
    if (option === "tomorrow") {
      base.setDate(base.getDate() + 1);
      base.setHours(9, 0, 0, 0);
    }

    setItems((current) =>
      current.map((item) =>
        item.id === occurrence.item.id
          ? { ...item, snoozedUntil: base.toISOString(), notifiedKeys: [] }
          : item
      )
    );
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotice("Notifications are not available here");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "Notifications are on" : "Notifications are blocked");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "myday-reminders.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const parsed = importItems(JSON.parse(text));
    if (!parsed) return;
    setItems(parsed);
  }

  function moveCalendar(direction: number) {
    const next = new Date(cursorDate);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction);
    if (calendarView === "week") next.setDate(next.getDate() + direction * 7);
    if (calendarView === "day") next.setDate(next.getDate() + direction);
    setCursorDate(next);
    setSelectedDate(formatDate(next));
  }

  function goToday() {
    setCursorDate(new Date());
    setSelectedDate(todayString);
    setActiveTab("today");
  }

  return (
    <main className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  MyDay
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">Your personal day planner</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-700 px-3 py-1 text-sm font-bold text-white">
                  {pendingCount}
                </span>
                <button
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title="Switch theme"
                  type="button"
                >
                  {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
                </button>
              </div>
            </div>
            <nav className="mt-4 grid grid-cols-4 gap-2">
              {tabItems.map((tab) => (
                <button
                  className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold sm:flex-row sm:text-sm ${
                    activeTab === tab.value
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  type="button"
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {activeTab === "today" && (
            <TodayScreen
              notice={notice}
              onAdd={openAdd}
              onComplete={completeOccurrence}
              onEdit={openEdit}
              onEnableNotifications={enableNotifications}
              onQuick={openQuick}
              onSnooze={snoozeOccurrence}
              todayItems={todayOccurrences}
              upcoming={upcoming}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarScreen
              calendarView={calendarView}
              cursorDate={cursorDate}
              items={items}
              onAdd={openAdd}
              onDelete={deleteItem}
              onEdit={openEdit}
              onMove={moveCalendar}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCursorDate(parseDate(date));
              }}
              onView={setCalendarView}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === "reminders" && (
            <RemindersScreen
              onComplete={completeOccurrence}
              onDelete={deleteItem}
              onEdit={openEdit}
              onSearch={setSearch}
              onSnooze={snoozeOccurrence}
              results={searchResults}
              search={search}
            />
          )}

          {activeTab === "settings" && (
            <SettingsScreen
              notice={notice}
              onEnableNotifications={enableNotifications}
              onExport={exportData}
              onImport={() => fileInputRef.current?.click()}
              onReset={() => {
                if (window.confirm("Replace your reminders with sample data?")) {
                  setItems(sampleItems);
                }
              }}
              theme={theme}
              toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          )}
        </div>

        <button
          className="fixed bottom-5 right-5 z-10 inline-flex min-h-14 items-center gap-2 rounded-full bg-blue-700 px-5 text-base font-bold text-white shadow-2xl hover:bg-blue-800"
          onClick={() => openAdd()}
          type="button"
        >
          <Plus size={22} />
          Add Reminder
        </button>

        <input
          accept="application/json"
          className="hidden"
          onChange={(event) => handleImport(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />

        {formOpen && (
          <ItemForm
            editing={Boolean(editingId)}
            form={form}
            onChange={setForm}
            onClose={() => setFormOpen(false)}
            onSave={saveItem}
          />
        )}
      </div>
    </main>
  );
}

function TodayScreen({
  notice,
  onAdd,
  onComplete,
  onEdit,
  onEnableNotifications,
  onQuick,
  onSnooze,
  todayItems,
  upcoming
}: {
  notice: string;
  onAdd: (date?: string, quickTitle?: string) => void;
  onComplete: (occurrence: Occurrence) => void;
  onEdit: (item: MyDayItem) => void;
  onEnableNotifications: () => void;
  onQuick: (range: "today" | "tomorrow" | "weekend" | "next-week") => void;
  onSnooze: (occurrence: Occurrence, option: SnoozeOption) => void;
  todayItems: Occurrence[];
  upcoming: Occurrence[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Today</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{friendlyDate(todayString)}</p>
          </div>
          <button
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-lg font-bold text-white hover:bg-blue-800"
            onClick={() => onAdd(todayString)}
            type="button"
          >
            <Plus size={22} />
            Add Reminder
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Today", "today"],
            ["Tomorrow", "tomorrow"],
            ["This Weekend", "weekend"],
            ["Next Week", "next-week"]
          ].map(([label, value]) => (
            <button
              className="min-h-12 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              key={value}
              onClick={() => onQuick(value as "today" | "tomorrow" | "weekend" | "next-week")}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {todayItems.length === 0 ? (
            <EmptyState
              action="Add something for today"
              message="Nothing planned yet. Add a reminder, appointment, bill, or task."
              onAction={() => onAdd(todayString)}
            />
          ) : (
            todayItems.map((occurrence) => (
              <OccurrenceCard
                key={occurrence.key}
                occurrence={occurrence}
                onComplete={onComplete}
                onEdit={onEdit}
                onSnooze={onSnooze}
              />
            ))
          )}
        </div>
      </section>

      <aside className="grid gap-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <BellRing size={20} />
            Notifications
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{notice}</p>
          <button
            className="mt-4 min-h-12 w-full rounded-lg bg-slate-950 px-4 font-bold text-white dark:bg-white dark:text-slate-950"
            onClick={onEnableNotifications}
            type="button"
          >
            Turn on notifications
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
            <Clock size={20} />
            Coming up
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming reminders.</p>
            ) : (
              upcoming.map((occurrence) => (
                <MiniOccurrence key={occurrence.key} occurrence={occurrence} />
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function CalendarScreen({
  calendarView,
  cursorDate,
  items,
  onAdd,
  onDelete,
  onEdit,
  onMove,
  onSelectDate,
  onView,
  selectedDate
}: {
  calendarView: CalendarView;
  cursorDate: Date;
  items: MyDayItem[];
  onAdd: (date?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: MyDayItem) => void;
  onMove: (direction: number) => void;
  onSelectDate: (date: string) => void;
  onView: (view: CalendarView) => void;
  selectedDate: string;
}) {
  const selectedItems = occurrencesBetween(items, parseDate(selectedDate), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button className="icon-button" onClick={() => onMove(-1)} type="button">
            <ChevronLeft size={18} />
          </button>
          <h2 className="min-w-48 text-xl font-bold">
            {calendarView === "month"
              ? monthTitle(cursorDate)
              : calendarView === "week"
                ? `Week of ${friendlyDate(formatDate(startOfWeek(cursorDate)))}`
                : friendlyDate(formatDate(cursorDate))}
          </h2>
          <button className="icon-button" onClick={() => onMove(1)} type="button">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(["month", "week", "day"] as CalendarView[]).map((view) => (
            <button
              className={`rounded-md px-4 py-2 text-sm font-bold capitalize ${
                calendarView === view
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              key={view}
              onClick={() => onView(view)}
              type="button"
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {calendarView === "month" && (
          <MonthCalendar
            cursorDate={cursorDate}
            items={items}
            onAdd={onAdd}
            onSelectDate={onSelectDate}
            selectedDate={selectedDate}
          />
        )}
        {calendarView === "week" && (
          <WeekCalendar cursorDate={cursorDate} items={items} onAdd={onAdd} onEdit={onEdit} />
        )}
        {calendarView === "day" && (
          <DayCalendar
            date={formatDate(cursorDate)}
            items={items}
            onAdd={onAdd}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
        <h3 className="mb-3 text-lg font-bold">{friendlyDate(selectedDate)}</h3>
        <div className="space-y-3">
          {selectedItems.length === 0 ? (
            <EmptyState
              action="Add to this day"
              message="This day is open."
              onAction={() => onAdd(selectedDate)}
            />
          ) : (
            selectedItems.map((occurrence) => (
              <ItemLine
                key={occurrence.key}
                occurrence={occurrence}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MonthCalendar({
  cursorDate,
  items,
  onAdd,
  onSelectDate,
  selectedDate
}: {
  cursorDate: Date;
  items: MyDayItem[];
  onAdd: (date?: string) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 pb-2 text-center text-xs font-bold uppercase text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-7">
        {monthGrid(cursorDate).map((day) => {
          const date = formatDate(day);
          const dayItems = occurrencesBetween(items, day, 1).slice(0, 3);
          const selected = selectedDate === date;

          return (
            <button
              className={`min-h-24 rounded-lg border p-2 text-left ${
                selected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              } ${day.getMonth() === cursorDate.getMonth() ? "" : "opacity-50"}`}
              key={date}
              onClick={() => onSelectDate(date)}
              onDoubleClick={() => onAdd(date)}
              type="button"
            >
              <span className="font-bold">{day.getDate()}</span>
              <div className="mt-2 space-y-1">
                {dayItems.map((occurrence) => (
                  <span
                    className={`block truncate rounded border px-2 py-1 text-xs font-bold ${categoryStyles[occurrence.item.category]}`}
                    key={occurrence.key}
                  >
                    {occurrence.item.title}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({
  cursorDate,
  items,
  onAdd,
  onEdit
}: {
  cursorDate: Date;
  items: MyDayItem[];
  onAdd: (date?: string) => void;
  onEdit: (item: MyDayItem) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursorDate), index));
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const date = formatDate(day);
        const dayItems = occurrencesBetween(items, day, 1);
        return (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            key={date}
          >
            <p className="mb-3 font-bold">{friendlyDate(date)}</p>
            <div className="space-y-2">
              {dayItems.map((occurrence) => (
                <button
                  className={`w-full rounded border px-2 py-2 text-left text-xs font-bold ${categoryStyles[occurrence.item.category]}`}
                  key={occurrence.key}
                  onClick={() => onEdit(occurrence.item)}
                  type="button"
                >
                  {timeLabel(occurrence.item.startTime)} {occurrence.item.title}
                </button>
              ))}
              <button className="add-small" onClick={() => onAdd(date)} type="button">
                <Plus size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayCalendar({
  date,
  items,
  onAdd,
  onDelete,
  onEdit
}: {
  date: string;
  items: MyDayItem[];
  onAdd: (date?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: MyDayItem) => void;
}) {
  const dayItems = occurrencesBetween(items, parseDate(date), 1);
  return (
    <div className="space-y-3">
      <button className="primary-button" onClick={() => onAdd(date)} type="button">
        <Plus size={18} />
        Add to this day
      </button>
      {dayItems.length === 0 ? (
        <EmptyState action="Add item" message="No plans for this day." onAction={() => onAdd(date)} />
      ) : (
        dayItems.map((occurrence) => (
          <ItemLine
            key={occurrence.key}
            occurrence={occurrence}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))
      )}
    </div>
  );
}

function RemindersScreen({
  onComplete,
  onDelete,
  onEdit,
  onSearch,
  onSnooze,
  results,
  search
}: {
  onComplete: (occurrence: Occurrence) => void;
  onDelete: (id: string) => void;
  onEdit: (item: MyDayItem) => void;
  onSearch: (value: string) => void;
  onSnooze: (occurrence: Occurrence, option: SnoozeOption) => void;
  results: Occurrence[];
  search: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-bold">Reminders</h2>
      <label className="mt-4 flex min-h-12 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
        <Search size={18} />
        <input
          className="w-full bg-transparent outline-none"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search reminders"
          value={search}
        />
      </label>
      <div className="mt-5 space-y-3">
        {results.length === 0 ? (
          <EmptyState message="No matching reminders found." />
        ) : (
          results.slice(0, 80).map((occurrence) => (
            <OccurrenceCard
              key={occurrence.key}
              occurrence={occurrence}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              onSnooze={onSnooze}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SettingsScreen({
  notice,
  onEnableNotifications,
  onExport,
  onImport,
  onReset,
  theme,
  toggleTheme
}: {
  notice: string;
  onEnableNotifications: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          MyDay is personal-only. Your data stays in this browser unless you export it.
        </p>
        <div className="mt-5 grid gap-3">
          <button className="settings-button" onClick={onEnableNotifications} type="button">
            <BellRing size={19} />
            {notice}
          </button>
          <button className="settings-button" onClick={toggleTheme} type="button">
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            {theme === "dark" ? "Use light mode" : "Use dark mode"}
          </button>
          <button className="settings-button" onClick={onExport} type="button">
            <Download size={19} />
            Export reminders
          </button>
          <button className="settings-button" onClick={onImport} type="button">
            <FileUp size={19} />
            Import reminders
          </button>
          <button className="settings-button" onClick={onReset} type="button">
            <ListChecks size={19} />
            Restore sample reminders
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold">Install on your phone</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <p>Android: open the site in Chrome, open the menu, then choose Add to Home screen.</p>
          <p>iPhone: open the site in Safari, tap Share, then choose Add to Home Screen.</p>
          <p>Keep notifications allowed so reminders can alert you while the app is active.</p>
        </div>
      </div>
    </section>
  );
}

function OccurrenceCard({
  occurrence,
  onComplete,
  onDelete,
  onEdit,
  onSnooze
}: {
  occurrence: Occurrence;
  onComplete: (occurrence: Occurrence) => void;
  onDelete?: (id: string) => void;
  onEdit: (item: MyDayItem) => void;
  onSnooze: (occurrence: Occurrence, option: SnoozeOption) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${categoryStyles[occurrence.item.category]}`}
          >
            {occurrence.item.category}
          </span>
          <h3 className="mt-2 text-lg font-bold">{occurrence.item.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {friendlyDate(occurrence.date)} at {timeLabel(occurrence.item.startTime)}
          </p>
          {occurrence.item.location && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{occurrence.item.location}</p>
          )}
          {occurrence.item.notes && (
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {occurrence.item.notes}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="action-button bg-emerald-600 text-white"
            disabled={occurrence.completed}
            onClick={() => onComplete(occurrence)}
            type="button"
          >
            <Check size={16} />
            {occurrence.completed ? "Done" : "Complete"}
          </button>
          <button className="action-button" onClick={() => onEdit(occurrence.item)} type="button">
            <Edit3 size={16} />
            Edit
          </button>
          {onDelete && (
            <button
              className="action-button"
              onClick={() => onDelete(occurrence.item.id)}
              type="button"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>
      {!occurrence.completed && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["10 min", "10-min"],
            ["1 hour", "1-hour"],
            ["Tomorrow", "tomorrow"]
          ].map(([label, value]) => (
            <button
              className="min-h-10 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              key={value}
              onClick={() => onSnooze(occurrence, value as SnoozeOption)}
              type="button"
            >
              Snooze {label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function MiniOccurrence({ occurrence }: { occurrence: Occurrence }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="font-bold">{occurrence.item.title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {friendlyDate(occurrence.date)} at {timeLabel(occurrence.item.startTime)}
      </p>
    </div>
  );
}

function ItemLine({
  occurrence,
  onDelete,
  onEdit
}: {
  occurrence: Occurrence;
  onDelete: (id: string) => void;
  onEdit: (item: MyDayItem) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold">
          {timeLabel(occurrence.item.startTime)} - {occurrence.item.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {occurrence.item.category} {occurrence.item.repeat !== "none" ? `- ${occurrence.item.repeat}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <button className="icon-button" onClick={() => onEdit(occurrence.item)} type="button">
          <Edit3 size={16} />
        </button>
        <button className="icon-button" onClick={() => onDelete(occurrence.item.id)} type="button">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function ItemForm({
  editing,
  form,
  onChange,
  onClose,
  onSave
}: {
  editing: boolean;
  form: typeof blankItem;
  onChange: (value: typeof blankItem) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-end bg-slate-950/50 sm:place-items-center">
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit reminder" : "Add reminder"}</h2>
          <button className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Title"
            onChange={(title) => onChange({ ...form, title })}
            placeholder="What do you need to remember?"
            value={form.title}
          />
          <SelectField
            label="Category"
            onChange={(category) => onChange({ ...form, category })}
            options={categories.map((category) => ({ label: category, value: category }))}
            value={form.category}
          />
          <TextField
            label="Date"
            onChange={(date) => onChange({ ...form, date })}
            type="date"
            value={form.date}
          />
          <SelectField
            label="Repeat"
            onChange={(repeat) => onChange({ ...form, repeat: repeat as RepeatOption })}
            options={repeatOptions}
            value={form.repeat}
          />
          <TextField
            label="Start time"
            onChange={(startTime) => onChange({ ...form, startTime })}
            type="time"
            value={form.startTime}
          />
          <TextField
            label="End time"
            onChange={(endTime) => onChange({ ...form, endTime })}
            type="time"
            value={form.endTime}
          />
          <TextField
            label="Location"
            onChange={(location) => onChange({ ...form, location })}
            placeholder="Optional"
            value={form.location}
          />
          <SelectField
            label="Remind me"
            onChange={(reminderTime) =>
              onChange({ ...form, reminderTime: reminderTime as ReminderOption })
            }
            options={reminderOptions.map((option) => ({
              label: option.label,
              value: option.value
            }))}
            value={form.reminderTime}
          />
          <label className="grid gap-1 text-sm font-bold text-slate-700 dark:text-slate-200 sm:col-span-2">
            Notes
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              onChange={(event) => onChange({ ...form, notes: event.target.value })}
              placeholder="Add any helpful details"
              value={form.notes}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-button" onClick={onSave} type="button">
            <Check size={18} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
      {label}
      <input
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
      {label}
      <select
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({
  action,
  message,
  onAction
}: {
  action?: string;
  message: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
      <p className="font-medium text-slate-600 dark:text-slate-300">{message}</p>
      {action && onAction && (
        <button className="primary-button mx-auto mt-4" onClick={onAction} type="button">
          <Plus size={18} />
          {action}
        </button>
      )}
    </div>
  );
}
