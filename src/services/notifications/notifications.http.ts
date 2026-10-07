/**
 * Notifications HTTP adapter.
 */

import { httpRequest } from "../_transport/http";
import type {
  NotificationsService,
  NotificationInbox,
  NotificationPreferences,
  PreferenceUpdateRequest,
} from "./notifications.contract";

export const httpNotificationsService: NotificationsService = {
  async getInbox({ unreadOnly, limit, offset, signal } = {}) {
    return httpRequest<NotificationInbox>("/notifications/inbox", {
      params: { unreadOnly, limit, offset },
      signal,
    });
  },

  async markRead(notificationId, { signal } = {}) {
    await httpRequest(`/notifications/read/${notificationId}`, { method: "POST", signal });
  },

  async markAllRead({ signal } = {}) {
    await httpRequest("/notifications/read-all", { method: "POST", signal });
  },

  async getPreferences({ signal } = {}) {
    return httpRequest<NotificationPreferences>("/notifications/preferences", { signal });
  },

  async updatePreferences(data: PreferenceUpdateRequest, { signal } = {}) {
    return httpRequest<NotificationPreferences>("/notifications/preferences", {
      method: "PUT",
      body: data,
      signal,
    });
  },
};
