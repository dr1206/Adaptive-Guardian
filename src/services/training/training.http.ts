/**
 * Training HTTP adapter — calls the real backend for behavioral training data.
 */

import { httpRequest } from "../_transport/http";
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

export const httpTrainingService: TrainingService = {
  async startSession(input: TrainingSessionStart): Promise<TrainingSessionStartResponse> {
    return httpRequest<TrainingSessionStartResponse>("/training/sessions/start", {
      method: "POST",
      body: input,
    });
  },

  async completeSession(input: TrainingSessionComplete): Promise<TrainingSessionCompleteResponse> {
    return httpRequest<TrainingSessionCompleteResponse>("/training/sessions/complete", {
      method: "POST",
      body: input,
    });
  },

  async submitBatch(input: TrainingBatchRequest): Promise<TrainingBatchResponse> {
    return httpRequest<TrainingBatchResponse>("/training/events/batch", {
      method: "POST",
      body: input,
    });
  },

  async submitFeatures(input: TrainingFeatureBatchRequest): Promise<TrainingFeatureBatchResponse> {
    return httpRequest<TrainingFeatureBatchResponse>("/training/features/batch", {
      method: "POST",
      body: input,
    });
  },

  async getProgress(): Promise<TrainingProgress> {
    return httpRequest<TrainingProgress>("/training/progress");
  },
};