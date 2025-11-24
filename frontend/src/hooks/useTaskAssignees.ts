import { useState } from "react";
import { TaskService } from "@/services/taskService";
import { NotificationService } from "@/services/notificationService";
import { toast } from "sonner";

export const useTaskAssignees = (taskId: string | null) => {
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssignees = async () => {
    if (!taskId) return;

    try {
      const assignees = await TaskService.getTaskAssignees(taskId);
      setAssignedMembers(assignees);
    } catch (error: any) {
      console.error("Error loading assignees:", error);
    }
  };

  const updateAssignees = async (
    newAssignees: string[],
    taskTitle: string,
    taskDescription: string,
    dueDate: string,
    currentUserId: string
  ) => {
    if (!taskId) return;

    try {
      setLoading(true);

      // Buscar assignees atuais
      const currentAssignees = await TaskService.getTaskAssignees(taskId);

      // Atualizar assignees
      const { added, removed } = await TaskService.updateTaskAssignees(
        taskId,
        newAssignees,
        currentAssignees
      );

      // Notificar novos assignees
      if (added.length > 0) {
        await NotificationService.notifyTaskAssignment(
          taskId,
          taskTitle,
          taskDescription,
          dueDate,
          currentUserId,
          added
        );
      }

      setAssignedMembers(newAssignees);
    } catch (error: any) {
      console.error("Error updating assignees:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignedMembers,
    setAssignedMembers,
    loading,
    loadAssignees,
    updateAssignees,
  };
};
