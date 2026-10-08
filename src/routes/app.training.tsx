import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  MousePointer2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { cn } from "@/lib/utils";
import { clearStoredDataset } from "@/services/behavioral/export";
import {
  useCompleteTrainingSession,
  useEnrollTrainingProfile,
  useResetTrainingProfile,
  useStartTrainingSession,
  useSubmitTrainingBatch,
  useSubmitTrainingFeatures,
  useTrainingProgress,
} from "@/services/hooks";
import type { TaskType, TrainingEvent } from "@/services/training/training.contract";

export const Route = createFileRoute("/app/training")({
  component: TrainingPage,
});

// ---------------------------------------------------------------------------
// Task definitions
// ---------------------------------------------------------------------------

const CONTROLLED_TASKS = [
  "The quick brown fox jumps over the lazy dog.",
  "AdaptiveGuardian continuously protects your account.",
  "Security should remain invisible during everyday banking.",
  "Please type this sentence naturally without trying to change your typing style.",
];

const REPEATED_PHRASE = "AdaptiveGuardian Banking Security";
const REPEATED_TRIALS = 3;

const PARAGRAPH =
  "Online banking should be simple, secure, and convenient. AdaptiveGuardian continuously learns how a user interacts with the banking application and detects unusual behavioral changes.";

const MOUSE_TARGETS = [
  { id: "t1", size: "large", label: "Start" },
  { id: "t2", size: "small", label: "A" },
  { id: "t3", size: "medium", label: "B" },
  { id: "t4", size: "small", label: "C" },
  { id: "t5", size: "large", label: "D" },
  { id: "t6", size: "medium", label: "E" },
  { id: "t7", size: "small", label: "F" },
  { id: "t8", size: "large", label: "Done" },
];

type TaskId = "controlled" | "repeated" | "paragraph" | "mouse";

const TASKS: { id: TaskId; label: string; icon: typeof Type; description: string }[] = [
  {
    id: "controlled",
    label: "Typing Practice",
    icon: Type,
    description: "Type a few short sentences.",
  },
  {
    id: "repeated",
    label: "Consistency Check",
    icon: Type,
    description: "Type the same phrase a few times.",
  },
  {
    id: "paragraph",
    label: "Paragraph Typing",
    icon: Type,
    description: "Type a longer paragraph naturally.",
  },
  {
    id: "mouse",
    label: "Mouse Exercise",
    icon: MousePointer2,
    description: "Move and click through targets.",
  },
];

// ---------------------------------------------------------------------------
// Device / session helpers
// ---------------------------------------------------------------------------

function getDeviceId(): string {
  try {
    let id = localStorage.getItem("ag_device_id");

    // Convert old device IDs such as:
    // dev_19f7f156-0dd8-4fee-...
    // into valid UUIDs:
    // 19f7f156-0dd8-4fee-...
    if (id?.startsWith("dev_")) {
      id = id.slice(4);
      localStorage.setItem("ag_device_id", id);
    }

    // Create a new valid UUID if no device ID exists.
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ag_device_id", id);
    }

    return id;
  } catch {
    // Last-resort fallback: still return a valid UUID.
    return crypto.randomUUID();
  }
}

function getPage(): string {
  return window.location.pathname;
}

function isSafeChar(key: string): boolean {
  // Only store letters, digits, space, punctuation — never passwords/PINs
  return /^[a-zA-Z0-9 .,!?;:'"()-]$/.test(key);
}

// ---------------------------------------------------------------------------
// Feature computation helpers
// ---------------------------------------------------------------------------

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function std(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function round(v: number, decimals = 2): number {
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function TrainingPage() {
  const [activeTask, setActiveTask] = useState<TaskId | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<TaskId>>(new Set());
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const { data: progress } = useTrainingProgress();
  const resetMutation = useResetTrainingProfile();
  const enrollMutation = useEnrollTrainingProfile();

  const handleTaskComplete = useCallback((taskId: TaskId) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    setActiveTask(null);
  }, []);

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset your baseline profile? This will wipe previous behavioral records and let you collect fresh authentic biometrics.",
      )
    ) {
      return;
    }
    try {
      clearStoredDataset();
      const res = await resetMutation.mutateAsync();
      setCompletedTasks(new Set());
      setBannerMessage({
        type: "info",
        text: res.message || "Baseline profile reset. You can now start fresh data collection.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset profile.";
      setBannerMessage({ type: "error", text: msg });
    }
  };

  const handleEnroll = async () => {
    try {
      const res = await enrollMutation.mutateAsync();
      setBannerMessage({
        type: "success",
        text: res.message || "Your authentic baseline profile is now locked in and active!",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Enrollment failed. Please collect more samples.";
      setBannerMessage({
        type: "error",
        text: msg,
      });
    }
  };

  const samplesCount = progress?.samplesCollected ?? 0;
  const isEnrolled = progress?.status === "MODEL_READY";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <PageHeader
          eyebrow="Biometric Profile"
          title="Personalize Your Security Profile"
          subtitle="Record your genuine typing rhythm and mouse dynamics so Adaptive Guardian recognizes you."
        />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            title="Wipe previous profile and start fresh"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", resetMutation.isPending && "animate-spin")} />
            Reset Baseline Profile
          </button>
          {samplesCount >= 2 && !isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 shadow-sm transition-colors disabled:opacity-50"
            >
              <Sparkles className={cn("h-3.5 w-3.5", enrollMutation.isPending && "animate-spin")} />
              Lock In My Baseline
            </button>
          )}
        </div>
      </div>

      {bannerMessage && (
        <div
          className={cn(
            "mb-4 flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all",
            bannerMessage.type === "success" &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            bannerMessage.type === "error" && "border-red-500/30 bg-red-500/10 text-red-300",
            bannerMessage.type === "info" && "border-blue-500/30 bg-blue-500/10 text-blue-300",
          )}
        >
          <span>{bannerMessage.text}</span>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress banner */}
      <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 flex-1">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                isEnrolled ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400",
              )}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-medium flex items-center gap-2">
                <span>
                  {isEnrolled
                    ? "Personal Security Profile: Active & Protecting"
                    : progress?.status === "BASELINE_READY"
                      ? "Sufficient biometric samples collected! Ready to lock in baseline."
                      : progress?.status === "TRAINING"
                        ? "Collecting fresh behavioral data..."
                        : "Fresh Data Collection Mode — Complete exercises below."}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    isEnrolled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                  )}
                >
                  {isEnrolled ? "Enrolled" : "Collecting"}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-3">
                <span>
                  {completedTasks.size} of {TASKS.length} training exercises completed
                </span>
                <span>•</span>
                <span>{samplesCount} fresh samples recorded</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 self-end sm:self-center">
            {TASKS.map((t) => (
              <span
                key={t.id}
                className={cn(
                  "h-1.5 w-6 rounded-full",
                  completedTasks.has(t.id) ? "bg-emerald-400" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {activeTask === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {TASKS.map((task) => {
            const Icon = task.icon;
            const done = completedTasks.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => setActiveTask(task.id)}
                className={cn(
                  "group flex items-start gap-4 rounded-2xl border p-5 text-left transition-colors",
                  done
                    ? "border-accent/30 bg-accent/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-accent/30 hover:bg-accent/[0.03]",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium">{task.label}</span>
                    {done && <Check className="h-4 w-4 text-success" />}
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{task.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActiveTask(null)}
            className="mb-4 text-[12px] text-muted-foreground hover:text-foreground"
          >
            ← Back to exercises
          </button>
          {activeTask === "controlled" && (
            <ControlledTypingTask onComplete={() => handleTaskComplete("controlled")} />
          )}
          {activeTask === "repeated" && (
            <RepeatedTypingTask onComplete={() => handleTaskComplete("repeated")} />
          )}
          {activeTask === "paragraph" && (
            <ParagraphTypingTask onComplete={() => handleTaskComplete("paragraph")} />
          )}
          {activeTask === "mouse" && (
            <MouseTrackingTask onComplete={() => handleTaskComplete("mouse")} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared typing task infrastructure
// ---------------------------------------------------------------------------

interface TypingTaskProps {
  onComplete: () => void;
}

function useTypingTask(taskType: TaskType, onComplete: () => void) {
  const startSession = useStartTrainingSession();
  const completeSession = useCompleteTrainingSession();
  const submitBatch = useSubmitTrainingBatch();
  const submitFeatures = useSubmitTrainingFeatures();

  const sessionIdRef = useRef<string | null>(null);
  const eventsRef = useRef<TrainingEvent[]>([]);
  const keyDownTimesRef = useRef<Map<number, number>>(new Map());
  const dwellTimesRef = useRef<number[]>([]);
  const flightTimesRef = useRef<number[]>([]);
  const lastKeyDownAtRef = useRef<number>(0);
  const backspaceCountRef = useRef(0);
  const correctionCountRef = useRef(0);
  const taskStartRef = useRef<number>(0);
  const pauseThresholdRef = useRef(500);
  const pauseDurationsRef = useRef<number[]>([]);
  const lastKeyUpAtRef = useRef<number>(0);
  const deviceIdRef = useRef(getDeviceId());

  const beginSession = useCallback(
    async (taskIndex?: number, trialIndex?: number) => {
      const res = await startSession.mutateAsync({
        taskType,
        deviceId: deviceIdRef.current,
        page: getPage(),
        metadata: { taskIndex, trialIndex },
      });
      sessionIdRef.current = res.sessionId;
      eventsRef.current = [];
      dwellTimesRef.current = [];
      flightTimesRef.current = [];
      backspaceCountRef.current = 0;
      correctionCountRef.current = 0;
      pauseDurationsRef.current = [];
      taskStartRef.current = performance.now();
      lastKeyDownAtRef.current = 0;
      lastKeyUpAtRef.current = 0;
      keyDownTimesRef.current.clear();

      eventsRef.current.push({
        sessionId: res.sessionId,
        taskType,
        eventType: "task_start",
        timestamp: Date.now(),
        deviceId: deviceIdRef.current,
        page: getPage(),
        taskIndex,
        trialIndex,
      });
    },
    [startSession, taskType],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, taskIndex?: number, trialIndex?: number) => {
      if (!sessionIdRef.current) return;
      // Skip modifier-only keys
      if (["Alt", "Control", "Shift", "Meta", "CapsLock"].includes(e.key)) return;
      if (e.repeat) return;

      const now = performance.now();
      keyDownTimesRef.current.set(e.keyCode, now);

      // Flight time (time since last keydown)
      if (lastKeyDownAtRef.current > 0) {
        const flight = Math.min(2000, now - lastKeyDownAtRef.current);
        flightTimesRef.current.push(flight);
        eventsRef.current.push({
          sessionId: sessionIdRef.current,
          taskType,
          eventType: "keydown",
          timestamp: Date.now(),
          deviceId: deviceIdRef.current,
          page: getPage(),
          keyCode: e.keyCode,
          keyChar: isSafeChar(e.key) ? e.key : undefined,
          flightTimeMs: round(flight),
          taskIndex,
          trialIndex,
        });
      } else {
        eventsRef.current.push({
          sessionId: sessionIdRef.current,
          taskType,
          eventType: "keydown",
          timestamp: Date.now(),
          deviceId: deviceIdRef.current,
          page: getPage(),
          keyCode: e.keyCode,
          keyChar: isSafeChar(e.key) ? e.key : undefined,
          taskIndex,
          trialIndex,
        });
      }

      // Detect pause (gap > 500ms since last keyup)
      if (lastKeyUpAtRef.current > 0) {
        const gap = now - lastKeyUpAtRef.current;
        if (gap > pauseThresholdRef.current) {
          pauseDurationsRef.current.push(gap);
        }
      }

      lastKeyDownAtRef.current = now;

      if (e.key === "Backspace") {
        backspaceCountRef.current++;
      }
    },
    [taskType],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent, taskIndex?: number, trialIndex?: number) => {
      if (!sessionIdRef.current) return;
      const downAt = keyDownTimesRef.current.get(e.keyCode);
      if (downAt == null) return;

      const now = performance.now();
      const dwell = Math.min(2000, now - downAt);
      dwellTimesRef.current.push(dwell);
      keyDownTimesRef.current.delete(e.keyCode);
      lastKeyUpAtRef.current = now;

      eventsRef.current.push({
        sessionId: sessionIdRef.current,
        taskType,
        eventType: "keyup",
        timestamp: Date.now(),
        deviceId: deviceIdRef.current,
        page: getPage(),
        keyCode: e.keyCode,
        dwellTimeMs: round(dwell),
        taskIndex,
        trialIndex,
      });
    },
    [taskType],
  );

  const finishTask = useCallback(
    async (taskIndex?: number, trialIndex?: number) => {
      if (!sessionIdRef.current) return;

      const totalDuration = performance.now() - taskStartRef.current;
      const textLength = eventsRef.current.filter((ev) => ev.eventType === "keydown").length;

      eventsRef.current.push({
        sessionId: sessionIdRef.current,
        taskType,
        eventType: "task_end",
        timestamp: Date.now(),
        deviceId: deviceIdRef.current,
        page: getPage(),
        taskIndex,
        trialIndex,
        textLength,
        backspaceCount: backspaceCountRef.current,
        correctionCount: correctionCountRef.current,
        totalDurationMs: round(totalDuration),
        pauseDurationMs: round(mean(pauseDurationsRef.current)),
      });

      // Submit batch
      await submitBatch.mutateAsync({
        sessionId: sessionIdRef.current,
        taskType,
        deviceId: deviceIdRef.current,
        page: getPage(),
        events: eventsRef.current,
      });

      // Compute features
      const dwells = dwellTimesRef.current;
      const flights = flightTimesRef.current;
      const dwellAvg = mean(dwells);
      const flightAvg = mean(flights);
      const totalSec = Math.max(totalDuration, 1000) / 1000;
      const typingSpeed = textLength / totalSec;
      const backspaceRate = textLength > 0 ? backspaceCountRef.current / textLength : 0;
      const correctionRate = textLength > 0 ? correctionCountRef.current / textLength : 0;

      const featureVector: Record<string, number> = {
        typing_speed: round(typingSpeed, 4),
        mean_key_hold: round(dwellAvg),
        std_key_hold: round(std(dwells, dwellAvg)),
        mean_flight_time: round(flightAvg),
        std_flight_time: round(std(flights, flightAvg)),
        backspace_rate: round(backspaceRate, 4),
        correction_rate: round(correctionRate, 4),
        pause_mean: round(mean(pauseDurationsRef.current)),
        pause_std: round(std(pauseDurationsRef.current, mean(pauseDurationsRef.current))),
        total_duration_ms: round(totalDuration),
      };

      await submitFeatures.mutateAsync({
        features: [
          {
            sessionId: sessionIdRef.current,
            taskType,
            taskIndex,
            trialIndex,
            deviceId: deviceIdRef.current,
            typingSpeed: round(typingSpeed, 4),
            meanKeyHold: round(dwellAvg),
            stdKeyHold: round(std(dwells, dwellAvg)),
            meanFlightTime: round(flightAvg),
            stdFlightTime: round(std(flights, flightAvg)),
            backspaceRate: round(backspaceRate, 4),
            correctionRate: round(correctionRate, 4),
            pauseMean: round(mean(pauseDurationsRef.current)),
            pauseStd: round(std(pauseDurationsRef.current, mean(pauseDurationsRef.current))),
            totalDurationMs: round(totalDuration),
            featureVector,
          },
        ],
      });

      await completeSession.mutateAsync({
        sessionId: sessionIdRef.current,
        taskType,
        sampleCount: eventsRef.current.length,
        deviceId: deviceIdRef.current,
        metadata: { taskIndex, trialIndex },
      });
    },
    [taskType, submitBatch, submitFeatures, completeSession],
  );

  return { beginSession, handleKeyDown, handleKeyUp, finishTask };
}

// ---------------------------------------------------------------------------
// Controlled typing task
// ---------------------------------------------------------------------------

function ControlledTypingTask({ onComplete }: TypingTaskProps) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);
  const { beginSession, handleKeyDown, handleKeyUp, finishTask } = useTypingTask(
    "controlled_typing",
    onComplete,
  );

  const target = CONTROLLED_TASKS[taskIndex];

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [started, taskIndex]);

  const start = async () => {
    setStarted(true);
    setInput("");
    finishedRef.current = false;
    await beginSession(taskIndex);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log({
      taskIndex,
      value: JSON.stringify(value),
      target: JSON.stringify(target),
      valueLength: value.length,
      targetLength: target.length,
      equal: value === target,
      finishedRef: finishedRef.current,
    });
    setInput(value);
    if (value === target && !finishedRef.current) {
      finishedRef.current = true;
      setFinished(true);
      finishTask(taskIndex);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(e.nativeEvent, taskIndex);
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    handleKeyUp(e.nativeEvent, taskIndex);
  };

  const nextTask = () => {
    finishedRef.current = false;
    if (taskIndex < CONTROLLED_TASKS.length - 1) {
      setTaskIndex((i) => i + 1);
      setInput("");
      setFinished(false);
      setStarted(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-semibold">
          Sentence {taskIndex + 1} of {CONTROLLED_TASKS.length}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {finished ? "Completed" : started ? "Type the sentence below" : "Ready"}
        </span>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <p className="mb-4 text-[16px] leading-relaxed text-foreground/90">{target}</p>

        {!started ? (
          <button
            onClick={start}
            className="rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-5 py-2.5 text-[13px] font-medium text-accent"
          >
            Start typing
          </button>
        ) : (
          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            disabled={finished}
            placeholder="Type here…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[15px] focus:border-accent/30 focus:outline-none disabled:opacity-50"
          />
        )}

        {finished && (
          <div className="mt-4 flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-[12px] text-success">
              {taskIndex + 1 < CONTROLLED_TASKS.length
                ? "Sentence complete."
                : "All sentences complete."}
            </span>
            <button
              onClick={nextTask}
              className="ml-auto rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] hover:bg-white/[0.08]"
            >
              {taskIndex + 1 < CONTROLLED_TASKS.length ? "Next sentence" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Repeated typing task
// ---------------------------------------------------------------------------

function RepeatedTypingTask({ onComplete }: TypingTaskProps) {
  const [trial, setTrial] = useState(0);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { beginSession, handleKeyDown, handleKeyUp, finishTask } = useTypingTask(
    "repeated_typing",
    onComplete,
  );

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [started, trial]);

  const startTrial = async () => {
    setStarted(true);
    setInput("");
    setFinished(false);
    await beginSession(0, trial);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value === REPEATED_PHRASE) {
      setFinished(true);
      finishTask(0, trial);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => handleKeyDown(e.nativeEvent, 0, trial);
  const onKeyUp = (e: React.KeyboardEvent) => handleKeyUp(e.nativeEvent, 0, trial);

  const nextTrial = () => {
    if (trial + 1 < REPEATED_TRIALS) {
      setTrial((t) => t + 1);
      setStarted(false);
      setFinished(false);
      setInput("");
    } else {
      onComplete();
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-semibold">
          Consistency Check — Trial {trial + 1} of {REPEATED_TRIALS}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {finished ? "Completed" : started ? "Type the phrase" : "Ready"}
        </span>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <p className="mb-4 text-[16px] font-medium text-foreground/90">{REPEATED_PHRASE}</p>

        {!started ? (
          <button
            onClick={startTrial}
            className="rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-5 py-2.5 text-[13px] font-medium text-accent"
          >
            Start trial {trial + 1}
          </button>
        ) : (
          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            disabled={finished}
            placeholder="Type the phrase…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[15px] focus:border-accent/30 focus:outline-none disabled:opacity-50"
          />
        )}

        {finished && (
          <div className="mt-4 flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-[12px] text-success">Trial complete.</span>
            <button
              onClick={nextTrial}
              className="ml-auto rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] hover:bg-white/[0.08]"
            >
              {trial + 1 < REPEATED_TRIALS ? "Next trial" : "Finish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paragraph typing task
// ---------------------------------------------------------------------------

function ParagraphTypingTask({ onComplete }: TypingTaskProps) {
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { beginSession, handleKeyDown, handleKeyUp, finishTask } = useTypingTask(
    "paragraph_typing",
    onComplete,
  );

  useEffect(() => {
    if (started) textareaRef.current?.focus();
  }, [started]);

  const start = async () => {
    setStarted(true);
    setInput("");
    await beginSession(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value === PARAGRAPH) {
      setFinished(true);
      finishTask(0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => handleKeyDown(e.nativeEvent, 0);
  const onKeyUp = (e: React.KeyboardEvent) => handleKeyUp(e.nativeEvent, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-semibold">Paragraph Typing</h2>
        <span className="text-[11px] text-muted-foreground">
          {finished ? "Completed" : started ? "Type the paragraph" : "Ready"}
        </span>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        <p className="mb-4 text-[14px] leading-relaxed text-foreground/80">{PARAGRAPH}</p>

        {!started ? (
          <button
            onClick={start}
            className="rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-5 py-2.5 text-[13px] font-medium text-accent"
          >
            Start typing
          </button>
        ) : (
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            disabled={finished}
            rows={4}
            placeholder="Type the paragraph here…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] leading-relaxed focus:border-accent/30 focus:outline-none disabled:opacity-50"
          />
        )}

        {finished && (
          <div className="mt-4 flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-[12px] text-success">Paragraph complete.</span>
            <button
              onClick={onComplete}
              className="ml-auto rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] hover:bg-white/[0.08]"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mouse tracking task
// ---------------------------------------------------------------------------

function MouseTrackingTask({ onComplete }: TypingTaskProps) {
  const [currentTarget, setCurrentTarget] = useState(0);
  const currentTargetRef = useRef(currentTarget);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "hit" | "miss"; key: number } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    currentTargetRef.current = currentTarget;
  }, [currentTarget]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const [targetPositions, setTargetPositions] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const positions: Record<string, { x: number; y: number }> = {};
    MOUSE_TARGETS.forEach((t, i) => {
      const angle = (i / MOUSE_TARGETS.length) * Math.PI * 2;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.32;
      positions[t.id] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });
    setTargetPositions(positions);
  }, [started]);

  // Replay a click that arrived before the target was positioned
  useEffect(() => {
    if (!started || finished) return;
    if (!pendingClickRef.current) return;
    const active = MOUSE_TARGETS[currentTargetRef.current];
    const pos = active ? targetPositions[active.id] : undefined;
    if (pos) {
      const { x, y } = pendingClickRef.current;
      pendingClickRef.current = null;
      evaluateClick(x, y, pos);
    }
  }, [targetPositions, started, finished]);

  const startSession = useStartTrainingSession();
  const completeSession = useCompleteTrainingSession();
  const submitBatch = useSubmitTrainingBatch();
  const submitFeatures = useSubmitTrainingFeatures();

  const sessionIdRef = useRef<string | null>(null);
  const eventsRef = useRef<TrainingEvent[]>([]);
  const mouseSamplesRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const clickTimesRef = useRef<number[]>([]);
  const scrollDeltasRef = useRef<number[]>([]);
  const targetAcquisitionRef = useRef<number[]>([]);
  const lastTargetClickRef = useRef<number>(0);
  const deviceIdRef = useRef(getDeviceId());
  const pendingClickRef = useRef<{ x: number; y: number } | null>(null);
  const preBufferRef = useRef<TrainingEvent[]>([]);

  const start = async () => {
    setCurrentTarget(0);
    setFinished(false);
    setTargetPositions({});
    eventsRef.current = [];
    mouseSamplesRef.current = [];
    clickTimesRef.current = [];
    scrollDeltasRef.current = [];
    targetAcquisitionRef.current = [];
    lastTargetClickRef.current = 0;
    sessionIdRef.current = null;
    pendingClickRef.current = null;
    preBufferRef.current = [];

    setStarted(true);

    try {
      const res = await startSession.mutateAsync({
        taskType: "mouse_tracking",
        deviceId: deviceIdRef.current,
        page: getPage(),
      });
      sessionIdRef.current = res.sessionId;

      // Flush any clicks/moves recorded before the session was available
      if (preBufferRef.current.length) {
        for (const ev of preBufferRef.current) {
          ev.sessionId = res.sessionId;
          eventsRef.current.push(ev);
        }
        preBufferRef.current = [];
      }

      eventsRef.current.push({
        sessionId: res.sessionId,
        taskType: "mouse_tracking",
        eventType: "task_start",
        timestamp: Date.now(),
        deviceId: deviceIdRef.current,
        page: getPage(),
      });

      // Position targets after layout
      requestAnimationFrame(() => {
        if (areaRef.current) {
          const rect = areaRef.current.getBoundingClientRect();
          const positions: Record<string, { x: number; y: number }> = {};
          MOUSE_TARGETS.forEach((t, i) => {
            const angle = (i / MOUSE_TARGETS.length) * Math.PI * 2;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const radius = Math.min(rect.width, rect.height) * 0.32;
            positions[t.id] = {
              x: cx + Math.cos(angle) * radius,
              y: cy + Math.sin(angle) * radius,
            };
          });
          setTargetPositions(positions);
        }
      });
    } catch {
      sessionIdRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sessionIdRef.current) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseSamplesRef.current.push({ x, y, t: performance.now() });
    eventsRef.current.push({
      sessionId: sessionIdRef.current,
      taskType: "mouse_tracking",
      eventType: "mouse_move",
      timestamp: Date.now(),
      deviceId: deviceIdRef.current,
      page: getPage(),
      x: round(x),
      y: round(y),
    });
  };

  const recordClickEvent = (targetId: string, size: string, hit: boolean) => {
    const ev: TrainingEvent = {
      sessionId: sessionIdRef.current ?? "",
      taskType: "mouse_tracking",
      eventType: "mouse_click",
      timestamp: Date.now(),
      deviceId: deviceIdRef.current,
      page: getPage(),
      targetId,
      targetSize: size,
      metadata: { hit },
    };
    if (sessionIdRef.current) {
      eventsRef.current.push(ev);
    } else {
      // Session not ready yet — buffer so the interaction stays fully responsive
      preBufferRef.current.push(ev);
    }
  };

  const showFeedback = (kind: "hit" | "miss") => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setFeedback({ kind, key: Date.now() });
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 900);
  };

  const registerHit = (targetId: string, size: string) => {
    const now = performance.now();
    recordClickEvent(targetId, size, true);

    // Target acquisition and click timing only reflect genuine target hits
    if (lastTargetClickRef.current > 0) {
      targetAcquisitionRef.current.push(now - lastTargetClickRef.current);
    }
    lastTargetClickRef.current = now;
    clickTimesRef.current.push(now);
    showFeedback("hit");

    const idx = MOUSE_TARGETS.findIndex((t) => t.id === targetId);
    if (idx === MOUSE_TARGETS.length - 1) {
      setFinished(true);
      void finishTask();
    } else {
      setCurrentTarget(idx + 1);
    }
  };

  const registerMiss = (targetId: string, size: string) => {
    recordClickEvent(targetId, size, false);
    showFeedback("miss");
  };

  const evaluateClick = (x: number, y: number, pos: { x: number; y: number }) => {
    const active = MOUSE_TARGETS[currentTargetRef.current];
    if (!active) return;
    const dx = x - pos.x;
    const dy = y - pos.y;
    const sizePx = active.size === "large" ? 64 : active.size === "medium" ? 48 : 32;
    const hitRadius = sizePx / 2 + 8;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // TEMP diagnostics — remove after confirming the interaction works
    console.log(
      `[MouseTask:hit] local=(${round(x)},${round(y)}) target=(${round(pos.x)},${round(pos.y)}) dist=${dist.toFixed(1)} hitRadius=${hitRadius} -> ${dist <= hitRadius ? "HIT" : "MISS"}`,
    );
    if (dist <= hitRadius) {
      registerHit(active.id, active.size);
    } else {
      registerMiss(active.id, active.size);
    }
  };

  const handleAreaClick = (e: React.MouseEvent) => {
    if (finished) return;
    const el = areaRef.current;
    const rect = el?.getBoundingClientRect();
    if (!el || !rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const active = MOUSE_TARGETS[currentTargetRef.current];
    const pos = active ? targetPositions[active.id] : undefined;

    // TEMP diagnostics — remove after confirming the interaction works
    console.log("[MouseTask:click]", {
      clientX: e.clientX,
      clientY: e.clientY,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      localX: round(x),
      localY: round(y),
      activeTarget: active ? active.id : null,
      targetCenter: pos ? { x: round(pos.x), y: round(pos.y) } : null,
      sessionId: sessionIdRef.current,
    });

    if (pos) {
      evaluateClick(x, y, pos);
    } else {
      // Target not positioned yet — buffer and replay once positions are ready
      pendingClickRef.current = { x, y };
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (!sessionIdRef.current) return;
    scrollDeltasRef.current.push(e.deltaY);
    eventsRef.current.push({
      sessionId: sessionIdRef.current,
      taskType: "mouse_tracking",
      eventType: "mouse_scroll",
      timestamp: Date.now(),
      deviceId: deviceIdRef.current,
      page: getPage(),
      deltaY: round(e.deltaY),
    });
  };

  const finishTask = async () => {
    if (!sessionIdRef.current) return;

    // Compute mouse features
    const samples = mouseSamplesRef.current;
    const velocities: number[] = [];
    const accelerations: number[] = [];
    let trajectoryLength = 0;
    let directionChanges = 0;

    for (let i = 1; i < samples.length; i++) {
      const dt = samples[i].t - samples[i - 1].t;
      if (dt <= 0) continue;
      const dx = samples[i].x - samples[i - 1].x;
      const dy = samples[i].y - samples[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      trajectoryLength += dist;
      const vel = dist / dt;
      velocities.push(vel);
      if (i >= 2) {
        const prevVel = velocities[velocities.length - 2];
        accelerations.push((vel - prevVel) / dt);
      }
      // Direction change detection
      if (i >= 2) {
        const prevDx = samples[i - 1].x - samples[i - 2].x;
        const prevDy = samples[i - 1].y - samples[i - 2].y;
        if (prevDx !== 0 && dx !== 0 && Math.sign(dx) !== Math.sign(prevDx)) directionChanges++;
        if (prevDy !== 0 && dy !== 0 && Math.sign(dy) !== Math.sign(prevDy)) directionChanges++;
      }
    }

    const velAvg = mean(velocities);
    const accAvg = mean(accelerations);
    const clickIntervals: number[] = [];
    for (let i = 1; i < clickTimesRef.current.length; i++) {
      clickIntervals.push(clickTimesRef.current[i] - clickTimesRef.current[i - 1]);
    }
    const scrollSpeed = mean(scrollDeltasRef.current.map((d) => Math.abs(d)));

    eventsRef.current.push({
      sessionId: sessionIdRef.current,
      taskType: "mouse_tracking",
      eventType: "task_end",
      timestamp: Date.now(),
      deviceId: deviceIdRef.current,
      page: getPage(),
      totalDurationMs: round(performance.now() - (eventsRef.current[0]?.timestamp ?? Date.now())),
    });

    await submitBatch.mutateAsync({
      sessionId: sessionIdRef.current,
      taskType: "mouse_tracking",
      deviceId: deviceIdRef.current,
      page: getPage(),
      events: eventsRef.current,
    });

    const featureVector: Record<string, number> = {
      mouse_speed_mean: round(velAvg, 4),
      mouse_speed_std: round(std(velocities, velAvg), 4),
      mouse_acceleration: round(accAvg, 6),
      click_interval_mean: round(mean(clickIntervals)),
      scroll_speed: round(scrollSpeed),
      trajectory_length: round(trajectoryLength),
      direction_changes: directionChanges,
      target_acquisition_mean: round(mean(targetAcquisitionRef.current)),
    };

    await submitFeatures.mutateAsync({
      features: [
        {
          sessionId: sessionIdRef.current,
          taskType: "mouse_tracking",
          deviceId: deviceIdRef.current,
          mouseSpeedMean: round(velAvg, 4),
          mouseSpeedStd: round(std(velocities, velAvg), 4),
          mouseAcceleration: round(accAvg, 6),
          clickIntervalMean: round(mean(clickIntervals)),
          scrollSpeed: round(scrollSpeed),
          trajectoryLength: round(trajectoryLength),
          directionChanges,
          targetAcquisitionMean: round(mean(targetAcquisitionRef.current)),
          featureVector,
        },
      ],
    });

    await completeSession.mutateAsync({
      sessionId: sessionIdRef.current,
      taskType: "mouse_tracking",
      sampleCount: eventsRef.current.length,
      deviceId: deviceIdRef.current,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-semibold">Mouse Exercise</h2>
        <span className="text-[11px] text-muted-foreground">
          {finished
            ? "Completed"
            : started
              ? `Target ${currentTarget + 1} of ${MOUSE_TARGETS.length}`
              : "Ready"}
        </span>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
        {!started ? (
          <div className="py-8 text-center">
            <MousePointer2 className="mx-auto h-10 w-10 text-accent" />
            <h3 className="mt-3 font-display text-[16px] font-semibold">Mouse Training</h3>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              Click the highlighted target once.
            </p>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-[12px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Do NOT press and hold the mouse button.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Move naturally to each target and click it once.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Only the highlighted target counts.
              </li>
            </ul>
            <button
              onClick={start}
              className="mt-5 rounded-xl bg-gradient-to-r from-accent/25 to-purple/20 px-5 py-2.5 text-[13px] font-medium text-accent"
            >
              Start exercise
            </button>
          </div>
        ) : (
          <div
            ref={areaRef}
            onMouseMove={handleMouseMove}
            onWheel={handleScroll}
            onClick={handleAreaClick}
            className="relative h-[420px] overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.01]"
          >
            {(() => {
              const t = MOUSE_TARGETS[currentTarget];
              const pos = targetPositions[t.id];
              if (!pos) return null;
              const sizeClass =
                t.size === "large" ? "h-16 w-16" : t.size === "medium" ? "h-12 w-12" : "h-8 w-8";
              return (
                <>
                  <div
                    key={`${t.id}-${currentTarget}`}
                    style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
                    className={cn(
                      "pointer-events-none absolute grid place-items-center rounded-full border-2 font-semibold transition-all",
                      sizeClass,
                      "border-accent bg-accent/25 text-accent",
                      "shadow-[0_0_0_6px_oklch(0.715_0.135_215/0.18),0_0_28px_oklch(0.715_0.135_215/0.6)]",
                      "animate-pulse",
                    )}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{ left: pos.x, top: pos.y - 54, transform: "translateX(-50%)" }}
                    className="pointer-events-none absolute z-10"
                  >
                    <span className="rounded-full bg-accent/30 px-2.5 py-1 text-[11px] font-bold tracking-wide text-accent animate-pulse">
                      CLICK ME
                    </span>
                  </div>
                </>
              );
            })()}

            {feedback && (
              <div
                key={feedback.key}
                className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center animate-in fade-in slide-in-from-top-2"
              >
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium",
                    feedback.kind === "hit"
                      ? "bg-success/15 text-success"
                      : "bg-amber-500/15 text-amber-300",
                  )}
                >
                  {feedback.kind === "hit"
                    ? "✓ Target hit!"
                    : "Missed — click the highlighted target"}
                </span>
              </div>
            )}
          </div>
        )}
        {finished && (
          <div className="mt-4 flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-[12px] text-success">Exercise complete!</span>
            <button
              onClick={onComplete}
              className="ml-auto rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] hover:bg-white/[0.08]"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
