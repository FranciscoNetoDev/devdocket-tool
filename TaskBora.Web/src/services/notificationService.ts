export class NotificationService {
  static async requestPermission(): Promise<void> {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  static sendBrowserNotification(
    title: string,
    body: string,
    tag?: string
  ): void {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: tag || "notification",
      });
    }
  }

  static async notifyTaskAssignment(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    _dueDate: string,
    _assignedByUserId: string,
    assignedToUserIds: string[]
  ): Promise<void> {
    for (const userId of assignedToUserIds) {
      const assigneeName = userId || "Usuário";

      this.sendBrowserNotification(
        "Nova Task Atribuída",
        `${assigneeName} foi atribuído à task: ${taskTitle}`,
        taskId
      );
    }
  }
}
