/**
 * Behavioral HTTP adapter — submits feature windows to the backend.
 */

import type { BehavioralService, FeatureWindow } from "./behavioral.contract";
import { httpRequest, hasToken } from "../_transport/http";

export const httpBehavioralService: BehavioralService = {
  async submitBatch(windows: FeatureWindow[]): Promise<void> {
    if (!hasToken() || windows.length === 0) return;

    await httpRequest("/events/batch", {
      method: "POST",
      body: { windows },
    });
  },
};
