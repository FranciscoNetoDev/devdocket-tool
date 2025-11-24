import { Task } from "@/types/task.types";
import { TaskRepository } from "@/domain/tasks/taskRepository";
import { TaskSupabaseRepository } from "@/infrastructure/supabase/tasks/taskSupabaseRepository";

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  getTaskById(taskId: string): Promise<Task | null> {
    return this.repository.getById(taskId);
  }

  getTaskAssignees(taskId: string): Promise<string[]> {
    return this.repository.getAssignees(taskId);
  }

  updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    return this.repository.update(taskId, updates);
  }

  softDeleteTask(taskId: string): Promise<void> {
    return this.repository.setDeleted(taskId, new Date().toISOString());
  }

  reactivateTask(taskId: string): Promise<void> {
    return this.repository.setDeleted(taskId, null);
  }

  updateTaskStatus(taskId: string, status: Task["status"]): Promise<void> {
    return this.repository.updateStatus(taskId, status);
  }

  async updateTaskAssignees(
    taskId: string,
    newAssignees: string[],
    currentAssignees: string[]
  ): Promise<{ added: string[]; removed: string[] }> {
    const added = newAssignees.filter((id) => !currentAssignees.includes(id));
    const removed = currentAssignees.filter((id) => !newAssignees.includes(id));

    if (removed.length > 0) {
      await this.repository.removeAssignees(taskId, removed);
    }

    if (added.length > 0) {
      await this.repository.addAssignees(taskId, added);
    }

    return { added, removed };
  }

  getProjectTasks(projectId: string): Promise<Task[]> {
    return this.repository.getProjectTasks(projectId);
  }

  getProjectBacklogTasks(
    projectId: string,
    options?: { includeDeleted?: boolean }
  ): Promise<Task[]> {
    return this.repository.getProjectTasksWithoutSprint(
      projectId,
      options?.includeDeleted
    );
  }

  getSprintTasks(sprintId: string): Promise<Task[]> {
    return this.repository.getSprintTasks(sprintId);
  }

  setTaskSprint(taskId: string, sprintId: string | null): Promise<void> {
    return this.repository.setTaskSprint(taskId, sprintId);
  }
}

export const taskService = new TaskService(new TaskSupabaseRepository());
