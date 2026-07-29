import type {
  NotificationPayload,
  NotificationType,
} from "@/src/notifications/NotificationTypes";

export function formatNotificationTitle(
  type: NotificationType,
  monitorName: string,
): string {
  switch (type) {
    case "MONITOR_DOWN":
      return `Monitor DOWN: ${monitorName}`;

    case "MONITOR_UP":
      return `Monitor UP: ${monitorName}`;
  }
}

export function formatNotificationBody(
  payload: Pick<
    NotificationPayload,
    "message" | "type"
  >,
): string {
  if (
    payload.message &&
    payload.message.trim().length > 0
  ) {
    return payload.message.trim();
  }

  switch (payload.type) {
    case "MONITOR_DOWN":
      return "El monitor ha dejado de responder.";

    case "MONITOR_UP":
      return "El monitor ha recuperado el servicio.";
  }
}

export function formatNotificationContent(
  payload: Pick<
    NotificationPayload,
    "type" | "monitorName" | "message"
  >,
): {
  title: string;
  body: string;
} {
  return {
    title: formatNotificationTitle(
      payload.type,
      payload.monitorName,
    ),
    body: formatNotificationBody(
      payload,
    ),
  };
}
