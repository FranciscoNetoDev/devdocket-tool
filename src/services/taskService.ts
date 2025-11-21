import { supabase } from "@/integrations/supabase/client";
import { Task, TaskAssignee } from "@/types/task.types";

export class TaskService {
  static async getTaskById(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getTaskAssignees(taskId: string): Promise<string[]> {
    const { data } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", taskId);

    return data?.map((a) => a.user_id) || [];
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;
  }

  static async softDeleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) throw error;
  }

  static async reactivateTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: null })
      .eq("id", taskId);

    if (error) throw error;
  }

  static async updateTaskAssignees(
    taskId: string,
    newAssignees: string[],
    currentAssignees: string[]
  ): Promise<{ added: string[]; removed: string[] }> {
    const added = newAssignees.filter((id) => !currentAssignees.includes(id));
    const removed = currentAssignees.filter((id) => !newAssignees.includes(id));

    // Remover assignees
    if (removed.length > 0) {
      const { error: deleteError } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId)
        .in("user_id", removed);

      if (deleteError) throw deleteError;
    }

    // Adicionar novos assignees
    if (added.length > 0) {
      const assigneesToInsert = added.map((userId) => ({
        task_id: taskId,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from("task_assignees")
        .insert(assigneesToInsert);

      if (insertError) throw insertError;
    }

    return { added, removed };
  }

  static async getProjectTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
