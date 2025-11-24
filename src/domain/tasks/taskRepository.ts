import { Task } from "@/types/task.types";

export interface TaskRepository {
  getById(taskId: string): Promise<Task | null>;
  getAssignees(taskId: string): Promise<string[]>;
  update(taskId: string, updates: Partial<Task>): Promise<void>;
  setDeleted(taskId: string, deletedAt: string | null): Promise<void>;
  updateStatus(taskId: string, status: Task["status"]): Promise<void>;
  addAssignees(taskId: string, userIds: string[]): Promise<void>;
  removeAssignees(taskId: string, userIds: string[]): Promise<void>;
  getProjectTasks(projectId: string): Promise<Task[]>;
  getProjectTasksWithoutSprint(
    projectId: string,
    includeDeleted?: boolean
  ): Promise<Task[]>;
  getSprintTasks(sprintId: string): Promise<Task[]>;
  setTaskSprint(taskId: string, sprintId: string | null): Promise<void>;
}
