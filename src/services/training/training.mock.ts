/**
 * Training mock adapter — no-op for dev preview without a backend.
 */

import { mockResolve } from "../_transport/mock";
import type {
  TrainingService,
  TrainingSessionStart,
  TrainingSessionStartResponse,
  TrainingSessionComplete,
  TrainingSessionCompleteResponse,
  TrainingBatchRequest,
  TrainingBatchResponse,
  TrainingFeatureBatchRequest,
  TrainingFeatureBatchResponse,
  TrainingProgress,
} from "./training.contract";

export const mockTrainingService: TrainingService = {
  async startSession(input: TrainingSessionStart): Promise<TrainingSessionStartResponse> {
    return mockResolve<TrainingSessionStartResponse>(
      { sessionId: `mock_${Date.now().toString(36)}`, status: "started" },
      { latencyMs: [40, 80] },
    );
  },

  async completeSession(input: TrainingSessionComplete): Promise<TrainingSessionCompleteResponse> {
    return mockResolve<TrainingSessionCompleteResponse>(
      { sessionId: input.sessionId, status: "completed", sampleCount: input.sampleCount },
      { latencyMs: [40, 80] },
    );
  },

  async submitBatch(input: TrainingBatchRequest): Promise<TrainingBatchResponse> {
    return mockResolve<TrainingBatchResponse>(
      { accepted: input.events.length, status: "ok" },
      { latencyMs: [20, 60] },
    );
  },

  async submitFeatures(input: TrainingFeatureBatchRequest): Promise<TrainingFeatureBatchResponse> {
    return mockResolve<TrainingFeatureBatchResponse>(
      { accepted: input.features.length, status: "ok" },
      { latencyMs: [20, 60] },
    );
  },

  async getProgress(): Promise<TrainingProgress> {
    return mockResolve<TrainingProgress>(
      {
        status: "TRAINING",
        tasksCompleted: 0,
        totalTasks: 4,
        samplesCollected: 0,
        message: "Complete the security setup to personalize your profile.",
      },
      { latencyMs: [40, 80] },
    );
  },

  async resetProfile(): Promise<{ status: string; message: string }> {
    return mockResolve<{ status: string; message: string }>(
      { status: "ok", message: "Mock profile reset" },
      { latencyMs: [40, 80] },
    );
  },

  async enrollProfile(): Promise<{ status: string; message: string; samples_used?: number }> {
    return mockResolve<{ status: string; message: string; samples_used?: number }>(
      { status: "ok", message: "Mock profile enrolled", samples_used: 10 },
      { latencyMs: [40, 80] },
    );
  },
};
