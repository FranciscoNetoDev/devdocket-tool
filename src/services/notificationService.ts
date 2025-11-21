import { supabase } from "@/integrations/supabase/client";

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

  static async sendTaskAssignmentEmail(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    dueDate: string,
    assignedByUserId: string,
    assignedToUserId: string
  ): Promise<void> {
    try {
      await supabase.functions.invoke("send-task-assignment-email", {
        body: {
          taskId,
          taskTitle,
          taskDescription,
          dueDate,
          assignedByUserId,
          assignedToUserId,
        },
      });
    } catch (error) {
      console.error("Error sending email:", error);
      // Não bloqueia o fluxo se o email falhar
    }
  }

  static async notifyTaskAssignment(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    dueDate: string,
    assignedByUserId: string,
    assignedToUserIds: string[]
  ): Promise<void> {
    // Buscar perfis dos novos assignees
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, nickname")
      .in("id", assignedToUserIds);

    // Enviar notificações para cada novo assignee
    for (const userId of assignedToUserIds) {
      const profile = profiles?.find((p) => p.id === userId);
      const assigneeName = profile?.nickname || profile?.full_name || "Usuário";

      // Notificação do navegador
      this.sendBrowserNotification(
        "Nova Task Atribuída",
        `${assigneeName} foi atribuído à task: ${taskTitle}`,
        taskId
      );

      // Email
      await this.sendTaskAssignmentEmail(
        taskId,
        taskTitle,
        taskDescription,
        dueDate,
        assignedByUserId,
        userId
      );
    }
  }
}
