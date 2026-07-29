import { appendNotificationHistory } from "@/src/notifications/NotificationHistoryStore";
import {
  loadNotificationPreferences,
  monitorMatchesTagFilter,
} from "@/src/notifications/NotificationPreferences";
import { notificationService } from "@/src/notifications/NotificationService";
import {
  DEDUPE_WINDOW_MS,
  buildMonitorDeepLink,
  type NotificationPayload,
  type NotificationType,
} from "@/src/notifications/NotificationTypes";

import type { Monitor } from "@/src/modules/monitor/types/monitor";
import { useSubscriptionStore } from "@/src/modules/subscription/store/subscription.store";
import { canUseFeature } from "@/src/modules/subscription/utils/feature-access";

export type HandleStatusChangeInput = {
  serverId: string;
  monitor: Monitor;
  heartbeatAt: string;
  important: boolean;
};

type DedupeEntry = {
  key: string;
  notifiedAt: number;
};

export class NotificationManager {
  private readonly recentKeys =
    new Map<string, DedupeEntry>();

  private readonly lastStatusByMonitor =
    new Map<string, NotificationType>();

  async handleStatusChange(
    input: HandleStatusChangeInput,
  ): Promise<NotificationPayload | null> {
    if (!input.important) {
      return null;
    }

    if (!input.monitor.active) {
      return null;
    }

    const status = input.monitor.status;

    if (
      status !== "up" &&
      status !== "down"
    ) {
      return null;
    }

    const previousStatus =
      input.monitor.previousStatus;

    if (
      !previousStatus ||
      previousStatus === "unknown" ||
      previousStatus === status
    ) {
      return null;
    }

    if (
      previousStatus !== "up" &&
      previousStatus !== "down" &&
      previousStatus !== "pending" &&
      previousStatus !== "maintenance"
    ) {
      return null;
    }

    const preferences =
      await loadNotificationPreferences();

    if (!preferences.enabled) {
      return null;
    }

    const plan =
      useSubscriptionStore.getState().plan;
    const canFilterByTags = canUseFeature(
      plan,
      "advanced-filters",
    );

    const effectivePreferences = {
      ...preferences,
      tagFilterEnabled:
        preferences.tagFilterEnabled &&
        canFilterByTags,
    };

    if (
      !monitorMatchesTagFilter(
        input.monitor.tags,
        effectivePreferences,
      )
    ) {
      return null;
    }

    const type: NotificationType =
      status === "down"
        ? "MONITOR_DOWN"
        : "MONITOR_UP";

    const monitorKey = `${input.serverId}:${input.monitor.id}`;
    const eventKey = `${monitorKey}:${type}:${input.heartbeatAt}`;

    if (this.isDuplicate(eventKey, monitorKey, type)) {
      return null;
    }

    const createdAt = Date.now();
    const payload: NotificationPayload = {
      id: `${eventKey}:${createdAt}`,
      type,
      serverId: input.serverId,
      monitorId: input.monitor.id,
      monitorName: input.monitor.name,
      message: input.monitor.message,
      createdAt,
      deepLink: buildMonitorDeepLink(
        input.serverId,
        input.monitor.id,
      ),
      heartbeatAt: input.heartbeatAt,
    };

    this.remember(eventKey, monitorKey, type);

    await appendNotificationHistory(payload);

    await notificationService.presentLocal(
      payload,
      {
        sound: preferences.sound,
        vibration: preferences.vibration,
      },
    );

    return payload;
  }

  private isDuplicate(
    eventKey: string,
    monitorKey: string,
    type: NotificationType,
  ): boolean {
    this.pruneExpired();

    if (this.recentKeys.has(eventKey)) {
      return true;
    }

    const lastType =
      this.lastStatusByMonitor.get(
        monitorKey,
      );

    if (lastType === type) {
      const recent = [
        ...this.recentKeys.values(),
      ].find((entry) =>
        entry.key.startsWith(
          `${monitorKey}:${type}:`,
        ),
      );

      if (
        recent &&
        Date.now() - recent.notifiedAt <
          DEDUPE_WINDOW_MS
      ) {
        return true;
      }
    }

    return false;
  }

  private remember(
    eventKey: string,
    monitorKey: string,
    type: NotificationType,
  ): void {
    this.recentKeys.set(eventKey, {
      key: eventKey,
      notifiedAt: Date.now(),
    });

    this.lastStatusByMonitor.set(
      monitorKey,
      type,
    );
  }

  private pruneExpired(): void {
    const now = Date.now();

    for (const [
      key,
      entry,
    ] of this.recentKeys.entries()) {
      if (
        now - entry.notifiedAt >
        DEDUPE_WINDOW_MS
      ) {
        this.recentKeys.delete(key);
      }
    }
  }
}

export const notificationManager =
  new NotificationManager();
