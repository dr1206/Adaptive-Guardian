/**
 * Behavioral HTTP adapter — submits feature windows to the backend.
 */

import type { BehavioralService, FeatureWindow } from "./behavioral.contract";

import {
  httpRequest,
  hasToken,
  getCurrentSessionId,
} from "../_transport/http";

export const httpBehavioralService: BehavioralService = {
  async submitBatch(windows: FeatureWindow[]): Promise<void> {
    if (!hasToken() || windows.length === 0) return;

    const sessionId = getCurrentSessionId();

    if (!sessionId) {
      console.warn(
        "[BehavioralHTTP] Cannot submit behavioral windows: no session ID",
      );
      return;
    }

    await httpRequest("/events/batch", {
      method: "POST",
      body: {
        sessionId,
        windows,
      },
    });
  },
};