import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ApiTask, TaskService } from "@/services/taskService";

export const useTasks = (projectId: string | null) => {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await TaskService.getProjectTasks(projectId);
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
