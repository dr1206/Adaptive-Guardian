import type { CollectorStatus, FeatureWindow } from "./collector";

export type { CollectorStatus, FeatureWindow, DeviceInfo } from "./collector";

export interface BehavioralService {
  /** Submit a batch of feature windows to the backend. */
  submitBatch(windows: FeatureWindow[]): Promise<void>;
}

export interface BehavioralServiceContext {
  /** Current collector status for UI indicators. */
  status: CollectorStatus;
}
