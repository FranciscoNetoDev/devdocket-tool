import { useState, useEffect } from "react";
import { Task } from "@/types/task.types";
import { taskService } from "@/application/tasks/taskService";
import { toast } from "sonner";

export const useTasks = (projectId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await taskService.getProjectTasks(projectId);
      setTasks(data);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  return {
    tasks,
    loading,
    fetchTasks,
  };
};
