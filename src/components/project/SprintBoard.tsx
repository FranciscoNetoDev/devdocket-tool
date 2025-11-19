import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import DroppableColumn from "./DroppableColumn";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  estimated_hours: number | null;
  due_date: string | null;
  created_at: string;
  task_assignees: Array<{
    user_id: string;
    profiles: {
      name: string;
    } | null;
  }>;
}

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface SprintBoardProps {
  sprint: Sprint;
  projectId: string;
  onBack: () => void;
}

export default function SprintBoard({ sprint, projectId, onBack }: SprintBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSprintTasks();
  }, [sprint.id]);

  const fetchSprintTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("sprint_id", sprint.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface (without assignees for now)
      const tasksWithAssignees = (data || []).map(task => ({
        ...task,
        task_assignees: []
      }));
      
      setTasks(tasksWithAssignees);
    } catch (error: any) {
      console.error("Error fetching sprint tasks:", error);
      toast.error("Erro ao carregar tarefas da sprint");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      toast.success("Status atualizado!");
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleTaskClick = (taskId: string) => {
    // TODO: Abrir dialog com detalhes da task
    console.log("Task clicked:", taskId);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const todoTasks = getTasksByStatus("todo");
  const inProgressTasks = getTasksByStatus("in_progress");
  const doneTasks = getTasksByStatus("done");

  const totalTasks = tasks.length;
  const completedTasks = doneTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const daysRemaining = Math.ceil(
    (new Date(sprint.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{sprint.name}</h2>
            {sprint.goal && (
              <p className="text-muted-foreground text-sm mt-1">{sprint.goal}</p>
            )}
          </div>
        </div>
        <Badge variant={sprint.status === "active" ? "default" : "secondary"}>
          {sprint.status === "planning" && "Planejamento"}
          {sprint.status === "active" && "Ativa"}
          {sprint.status === "completed" && "Concluída"}
        </Badge>
      </div>

      {/* Sprint Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks} de {totalTasks} tarefas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              A Fazer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Em Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Board */}
      <div className="grid gap-4 md:grid-cols-3">
        <DroppableColumn
          id="todo"
          label="A Fazer"
          color="bg-slate-100 dark:bg-slate-800"
          tasks={todoTasks}
          onTaskClick={handleTaskClick}
        />

        <DroppableColumn
          id="in_progress"
          label="Em Progresso"
          color="bg-blue-100 dark:bg-blue-900/30"
          tasks={inProgressTasks}
          onTaskClick={handleTaskClick}
        />

        <DroppableColumn
          id="done"
          label="Concluído"
          color="bg-green-100 dark:bg-green-900/30"
          tasks={doneTasks}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  );
}
