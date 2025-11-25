import { apiFetch } from "@/lib/apiClient";

export interface ApiTask {
  id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  description: string | null;
  status: string;
  order: number;
  assigneeIds: string[];
}

const mapDtoToTask = (task: any): ApiTask => ({
  id: task.id ?? task.Id,
  projectId: task.projectId ?? task.ProjectId,
  sprintId: task.sprintId ?? task.SprintId ?? null,
  title: task.title ?? task.Title,
  description: task.description ?? task.Description ?? null,
  status: (task.status ?? task.Status ?? "pending").toString(),
  order: Number(task.order ?? task.Order ?? 0),
  assigneeIds: (task.assigneeIds ?? task.AssigneeIds ?? []).map((id: any) => id?.toString()),
});

export class TaskService {
  static async getTaskById(taskId: string): Promise<ApiTask | null> {
    const task = await apiFetch<ApiTask>(`api/tasks/${taskId}`);
    return task ? mapDtoToTask(task) : null;
  }

  static async getTaskAssignees(taskId: string): Promise<string[]> {
    const task = await apiFetch<ApiTask>(`api/tasks/${taskId}`);
    return task ? mapDtoToTask(task).assigneeIds : [];
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Pick<ApiTask, "title" | "description" | "assigneeIds" | "status">>
  ): Promise<void> {
    const status = updates.status;
    const hasDetails = updates.title !== undefined || updates.description !== undefined || updates.assigneeIds !== undefined;

    if (status) {
      await apiFetch(`api/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    }

    if (hasDetails) {
      await apiFetch(`api/tasks/${taskId}/details`, {
        method: "PATCH",
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          assigneeIds: updates.assigneeIds,
        }),
      });
    }
  }

  static async softDeleteTask(taskId: string): Promise<void> {
    await apiFetch(`api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "deleted" }),
    });
  }

  static async reactivateTask(taskId: string): Promise<void> {
    await apiFetch(`api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "pending" }),
    });
  }

  static async updateTaskAssignees(
    taskId: string,
    newAssignees: string[],
    currentAssignees: string[]
  ): Promise<{ added: string[]; removed: string[] }> {
    await apiFetch(`api/tasks/${taskId}/details`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeIds: newAssignees }),
    });

    const added = newAssignees.filter((id) => !currentAssignees.includes(id));
    const removed = currentAssignees.filter((id) => !newAssignees.includes(id));

    return { added, removed };
  }

  static async getProjectTasks(projectId: string): Promise<ApiTask[]> {
    const data = await apiFetch<ApiTask[]>(`api/projects/${projectId}/backlog`);
    return (data || []).map(mapDtoToTask);
  }
}
