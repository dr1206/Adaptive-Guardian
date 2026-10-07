/**
 * Training domain contract — controlled typing, repeated typing, paragraph typing,
 * and mouse tracking tasks for behavioral baseline collection.
 */

export type TaskType =
  "controlled_typing" | "repeated_typing" | "paragraph_typing" | "mouse_tracking";

export interface TrainingEvent {
  sessionId: string;
  taskType: TaskType;
  eventType:
    "keydown" | "keyup" | "mouse_move" | "mouse_click" | "mouse_scroll" | "task_start" | "task_end";
  timestamp: number; // epoch ms
  deviceId?: string;
  page?: string;
  keyCode?: number;
  keyChar?: string;
  dwellTimeMs?: number;
  flightTimeMs?: number;
  x?: number;
  y?: number;
  targetId?: string;
  targetSize?: string;
  clickDurationMs?: number;
  deltaY?: number;
  taskIndex?: number;
  trialIndex?: number;
  textLength?: number;
  backspaceCount?: number;
  correctionCount?: number;
  totalDurationMs?: number;
  pauseDurationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface TrainingBatchRequest {
  sessionId: string;
  taskType: TaskType;
  deviceId?: string;
  page?: string;
  events: TrainingEvent[];
}

export interface TrainingBatchResponse {
  accepted: number;
  status: string;
}

export interface TrainingSessionStart {
  taskType: TaskType;
  deviceId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export interface TrainingSessionStartResponse {
  sessionId: string;
  status: string;
}

export interface TrainingSessionComplete {
  sessionId: string;
  taskType: TaskType;
  sampleCount: number;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}

export interface TrainingSessionCompleteResponse {
  sessionId: string;
  status: string;
  sampleCount: number;
}

export interface TrainingFeature {
  sessionId: string;
  taskType: TaskType;
  taskIndex?: number;
  trialIndex?: number;
  deviceId?: string;
  typingSpeed?: number;
  meanKeyHold?: number;
  stdKeyHold?: number;
  meanFlightTime?: number;
  stdFlightTime?: number;
  backspaceRate?: number;
  correctionRate?: number;
  pauseMean?: number;
  pauseStd?: number;
  totalDurationMs?: number;
  mouseSpeedMean?: number;
  mouseSpeedStd?: number;
  mouseAcceleration?: number;
  clickIntervalMean?: number;
  scrollSpeed?: number;
  trajectoryLength?: number;
  directionChanges?: number;
  targetAcquisitionMean?: number;
  featureVector: Record<string, number>;
}

export interface TrainingFeatureBatchRequest {
  features: TrainingFeature[];
}

export interface TrainingFeatureBatchResponse {
  accepted: number;
  status: string;
}

export interface TrainingProgress {
  status: "NOT_TRAINED" | "TRAINING" | "BASELINE_READY" | "MODEL_READY" | "MONITORING";
  tasksCompleted: number;
  totalTasks: number;
  samplesCollected: number;
  message: string;
}

export interface TrainingService {
  startSession(input: TrainingSessionStart): Promise<TrainingSessionStartResponse>;
  completeSession(input: TrainingSessionComplete): Promise<TrainingSessionCompleteResponse>;
  submitBatch(input: TrainingBatchRequest): Promise<TrainingBatchResponse>;
  submitFeatures(input: TrainingFeatureBatchRequest): Promise<TrainingFeatureBatchResponse>;
  getProgress(): Promise<TrainingProgress>;
  resetProfile(): Promise<{ status: string; message: string }>;
  enrollProfile(): Promise<{ status: string; message: string; samples_used?: number }>;
}
