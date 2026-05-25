"use client";

import {
  CalendarDays,
  Check,
  ClipboardList,
  Edit3,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  completed: boolean;
};

type MeetingResult = {
  summary: string;
  decisions: string[];
  actionItems: Task[];
};

type EditableTask = Pick<Task, "title" | "owner" | "dueDate">;

const storageKey = "meetingmind-state";

const sampleNotes = `Product sync - May 25

Priya confirmed the onboarding redesign should launch in beta next Friday. Marcus will prepare the customer announcement by Thursday. Lena will update the analytics dashboard by June 3 so the team can track completion rate and time to first value.

Decision: keep the first beta group to 50 customers.
Decision: use the existing help center article format for onboarding tips.

Tom needs to book a follow-up meeting for Monday. Aisha will review the support macros by May 31.`;

const emptyResult: MeetingResult = {
  summary: "",
  decisions: [],
  actionItems: []
};

const demoResult: MeetingResult = {
  summary:
    "The team aligned on a limited beta launch for the onboarding redesign, agreed how customer guidance will be presented, and identified supporting launch tasks across communications, analytics, support, and follow-up planning.",
  decisions: [
    "Launch the onboarding redesign in beta next Friday.",
    "Limit the first beta group to 50 customers.",
    "Use the existing help center article format for onboarding tips."
  ],
  actionItems: [
    {
      id: "demo-1",
      title: "Prepare the customer announcement",
      owner: "Marcus",
      dueDate: "2026-05-28",
      completed: false
    },
    {
      id: "demo-2",
      title: "Update the analytics dashboard",
      owner: "Lena",
      dueDate: "2026-06-03",
      completed: false
    },
    {
      id: "demo-3",
      title: "Review the support macros",
      owner: "Aisha",
      dueDate: "2026-05-31",
      completed: true
    }
  ]
};

const initialState = {
  notes: sampleNotes,
  result: demoResult,
  tasks: demoResult.actionItems
};

function createId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normaliseDate(value: string) {
  const lower = value.toLowerCase();
  const today = new Date();
  const year = today.getFullYear();
  const months: Record<string, string> = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12",
    dec: "12"
  };
  const match = lower.match(
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/
  );

  if (!match) return "";
  const month = months[match[1]];
  const day = match[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normaliseWeekday(value: string) {
  const lower = value.toLowerCase();
  const match = lower.match(
    /\b(?:by|for|on|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (!match) return "";

  const weekdays: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  const today = new Date();
  const target = weekdays[match[1]];
  const daysAhead = (target - today.getDay() + 7) % 7 || 7;
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysAhead);
  return dueDate.toISOString().slice(0, 10);
}

function sentenceCase(value: string) {
  const trimmed = value.trim().replace(/[.]+$/, "");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function inferOwner(sentence: string) {
  const ownerMatch = sentence.match(/^([A-Z][a-z]+)\s+(?:will|needs to|to|should|must|can)\b/);
  if (ownerMatch) return ownerMatch[1];

  const byMatch = sentence.match(/\bowner[:\s]+([A-Z][a-z]+)/i);
  return byMatch?.[1] ?? "Unassigned";
}

function inferTaskTitle(sentence: string) {
  return sentence
    .replace(/^([A-Z][a-z]+)\s+(will|needs to|to|should|must|can)\s+/i, "")
    .replace(/\s+by\s+.+$/i, "")
    .replace(/\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*$/i, "")
    .trim();
}

function summariseMeeting(notes: string): MeetingResult {
  const sentences = notes
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const decisions = sentences
    .filter((sentence) => /decision:|decided|confirmed|agreed|approved/i.test(sentence))
    .map((sentence) => sentenceCase(sentence.replace(/^decision:\s*/i, "")))
    .slice(0, 5);

  const actionSentences = sentences.filter((sentence) =>
    /\b(will|needs to|to do|action|owner|by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d))/i.test(
      sentence
    )
  );

  const actionItems = actionSentences
    .map((sentence) => ({
      id: createId(),
      title: sentenceCase(inferTaskTitle(sentence) || sentence),
      owner: inferOwner(sentence),
      dueDate: normaliseDate(sentence) || normaliseWeekday(sentence),
      completed: false
    }))
    .filter((task) => task.title.length > 2)
    .slice(0, 8);

  const summarySource = sentences
    .filter((sentence) => !/^decision:/i.test(sentence))
    .slice(0, 3)
    .join(" ");

  return {
    summary:
      summarySource.length > 220
        ? `${summarySource.slice(0, 217).trim()}...`
        : summarySource || "Meeting notes were captured and organised into decisions and follow-up tasks.",
    decisions:
      decisions.length > 0
        ? decisions
        : ['No explicit decisions found. Add lines beginning with "Decision:" for clearer extraction.'],
    actionItems
  };
}

export default function Home() {
  const [notes, setNotes] = useState(initialState.notes);
  const [result, setResult] = useState<MeetingResult>(initialState.result);
  const [tasks, setTasks] = useState<Task[]>(initialState.tasks);
  const [draftTask, setDraftTask] = useState<EditableTask>({
    title: "",
    owner: "",
    dueDate: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditableTask>({
    title: "",
    owner: "",
    dueDate: ""
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as typeof initialState;
      setNotes(parsed.notes ?? initialState.notes);
      setResult(parsed.result ?? initialState.result);
      setTasks(parsed.tasks ?? initialState.tasks);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ notes, result, tasks }));
  }, [notes, result, tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const openCount = tasks.length - completedCount;

  function handleSummarise() {
    const nextResult = summariseMeeting(notes);
    setResult(nextResult);
    setTasks((current) => [...nextResult.actionItems, ...current]);
  }

  function addTask() {
    if (!draftTask.title.trim()) return;
    setTasks((current) => [
      {
        id: createId(),
        title: draftTask.title.trim(),
        owner: draftTask.owner.trim() || "Unassigned",
        dueDate: draftTask.dueDate,
        completed: false
      },
      ...current
    ]);
    setDraftTask({ title: "", owner: "", dueDate: "" });
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditingTask({
      title: task.title,
      owner: task.owner,
      dueDate: task.dueDate
    });
  }

  function saveEditing() {
    if (!editingId || !editingTask.title.trim()) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === editingId
          ? {
              ...task,
              title: editingTask.title.trim(),
              owner: editingTask.owner.trim() || "Unassigned",
              dueDate: editingTask.dueDate
            }
          : task
      )
    );
    setEditingId(null);
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function resetDemo() {
    setNotes(initialState.notes);
    setResult(initialState.result);
    setTasks(initialState.tasks);
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              MeetingMind
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Turn meeting notes into clear tasks.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[360px]">
            <Stat label="Tasks" value={tasks.length.toString()} />
            <Stat label="Open" value={openCount.toString()} />
            <Stat label="Done" value={completedCount.toString()} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Meeting notes</h2>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={resetDemo}
              type="button"
            >
              <ClipboardList size={16} />
              Demo data
            </button>
          </div>
          <textarea
            className="mt-4 min-h-[360px] w-full resize-y rounded-md border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-800 shadow-inner"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste meeting notes here..."
            value={notes}
          />
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
            onClick={handleSummarise}
            type="button"
          >
            <Sparkles size={18} />
            Summarise Meeting
          </button>
        </section>

        <section className="grid gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">AI meeting output</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <OutputBlock title="Summary" full>
                <p className="text-sm leading-6 text-slate-700">{result.summary}</p>
              </OutputBlock>
              <OutputBlock title="Key decisions">
                <ul className="space-y-2">
                  {result.decisions.map((decision) => (
                    <li className="text-sm leading-6 text-slate-700" key={decision}>
                      {decision}
                    </li>
                  ))}
                </ul>
              </OutputBlock>
              <OutputBlock title="Detected action items">
                <ul className="space-y-2">
                  {result.actionItems.map((item) => (
                    <li className="text-sm leading-6 text-slate-700" key={item.id}>
                      <span className="font-medium text-slate-900">{item.title}</span>
                      <span className="block text-slate-500">
                        {item.owner} {item.dueDate ? `- ${item.dueDate}` : "- no due date"}
                      </span>
                    </li>
                  ))}
                </ul>
              </OutputBlock>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Task dashboard</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Saved in this browser
              </span>
            </div>

            <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-[1.5fr_1fr_160px_auto]">
              <TextInput
                label="Task"
                onChange={(value) => setDraftTask((task) => ({ ...task, title: value }))}
                placeholder="Add a task"
                value={draftTask.title}
              />
              <TextInput
                label="Owner"
                onChange={(value) => setDraftTask((task) => ({ ...task, owner: value }))}
                placeholder="Owner"
                value={draftTask.owner}
              />
              <TextInput
                label="Due date"
                onChange={(value) => setDraftTask((task) => ({ ...task, dueDate: value }))}
                type="date"
                value={draftTask.dueDate}
              />
              <button
                className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md bg-slate-950 px-4 font-semibold text-white transition hover:bg-slate-800"
                onClick={addTask}
                type="button"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.map((task) => {
                const isEditing = editingId === task.id;

                return (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-4"
                    key={task.id}
                  >
                    {isEditing ? (
                      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_160px_auto_auto]">
                        <TextInput
                          label="Task"
                          onChange={(value) =>
                            setEditingTask((item) => ({ ...item, title: value }))
                          }
                          value={editingTask.title}
                        />
                        <TextInput
                          label="Owner"
                          onChange={(value) =>
                            setEditingTask((item) => ({ ...item, owner: value }))
                          }
                          value={editingTask.owner}
                        />
                        <TextInput
                          label="Due date"
                          onChange={(value) =>
                            setEditingTask((item) => ({ ...item, dueDate: value }))
                          }
                          type="date"
                          value={editingTask.dueDate}
                        />
                        <IconButton label="Save" onClick={saveEditing}>
                          <Save size={17} />
                        </IconButton>
                        <IconButton label="Cancel" onClick={() => setEditingId(null)}>
                          <X size={17} />
                        </IconButton>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                        <button
                          aria-label={
                            task.completed ? "Mark task incomplete" : "Mark task complete"
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                            task.completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 text-slate-500 hover:bg-slate-50"
                          }`}
                          onClick={() => toggleTask(task.id)}
                          title={
                            task.completed ? "Mark task incomplete" : "Mark task complete"
                          }
                          type="button"
                        >
                          <Check size={18} />
                        </button>
                        <div className={task.completed ? "opacity-60" : ""}>
                          <h3
                            className={`font-semibold text-slate-950 ${
                              task.completed ? "line-through" : ""
                            }`}
                          >
                            {task.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <UserRound size={15} />
                              {task.owner}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={15} />
                              {task.dueDate || "No due date"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <IconButton label="Edit task" onClick={() => startEditing(task)}>
                            <Edit3 size={17} />
                          </IconButton>
                          <IconButton label="Delete task" onClick={() => deleteTask(task.id)}>
                            <Trash2 size={17} />
                          </IconButton>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function OutputBlock({
  children,
  full,
  title
}: {
  children: React.ReactNode;
  full?: boolean;
  title: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${full ? "md:col-span-2" : ""}`}>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TextInput({
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
    <label className="grid gap-1 text-sm font-medium text-slate-600">
      {label}
      <input
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-900"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function IconButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-slate-300 px-3 text-slate-600 transition hover:bg-slate-50"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
