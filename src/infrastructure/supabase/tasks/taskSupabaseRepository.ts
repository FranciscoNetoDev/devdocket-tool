import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task.types";
import { TaskRepository } from "@/domain/tasks/taskRepository";

export class TaskSupabaseRepository implements TaskRepository {
  async getById(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) throw error;
    return data;
  }

  async getAssignees(taskId: string): Promise<string[]> {
    const { data } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", taskId);

    return data?.map((a) => a.user_id) || [];
  }

  async update(taskId: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;
  }

  async setDeleted(taskId: string, deletedAt: string | null): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: deletedAt })
      .eq("id", taskId);

    if (error) throw error;
  }

  async updateStatus(taskId: string, status: Task["status"]): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) throw error;
  }

  async addAssignees(taskId: string, userIds: string[]): Promise<void> {
    const assigneesToInsert = userIds.map((userId) => ({
      task_id: taskId,
      user_id: userId,
    }));

    const { error } = await supabase.from("task_assignees").insert(assigneesToInsert);

    if (error) throw error;
  }

  async removeAssignees(taskId: string, userIds: string[]): Promise<void> {
    const { error } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("user_id", userIds);

    if (error) throw error;
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProjectTasksWithoutSprint(
    projectId: string,
    includeDeleted = false
  ): Promise<Task[]> {
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("sprint_id", null)
      .order("created_at", { ascending: false });

    if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getSprintTasks(sprintId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("sprint_id", sprintId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async setTaskSprint(taskId: string, sprintId: string | null): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ sprint_id: sprintId })
      .eq("id", taskId);

    if (error) throw error;
  }
}
