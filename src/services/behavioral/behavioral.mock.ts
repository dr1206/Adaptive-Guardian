import type { BehavioralService } from "./behavioral.contract";

export const mockBehavioralService: BehavioralService = {
  async submitBatch() {
    // No-op — behavioral collection disabled in mock mode
  },
};
