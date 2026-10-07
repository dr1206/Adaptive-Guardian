/**
 * Notifications domain contract.
 */

export interface NotificationItem {
  id: string;
  type: "security" | "banking" | "insight" | "system";
  severity: "info" | "warn" | "critical";
  title: string;
  body: string;
  actionLabel: string | null;
  actionPath: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationInbox {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

export interface NotificationPreferences {
  channels: string[];
  categories: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface PreferenceUpdateRequest {
  channels?: string[];
  categories?: Record<string, boolean>;
  quietHoursEnabled?: boolean;
  quietStart?: string;
  quietEnd?: string;
}

export interface NotificationsService {
  getInbox(opts?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }): Promise<NotificationInbox>;
  markRead(notificationId: string, opts?: { signal?: AbortSignal }): Promise<void>;
  markAllRead(opts?: { signal?: AbortSignal }): Promise<void>;
  getPreferences(opts?: { signal?: AbortSignal }): Promise<NotificationPreferences>;
  updatePreferences(
    data: PreferenceUpdateRequest,
    opts?: { signal?: AbortSignal },
  ): Promise<NotificationPreferences>;
}
