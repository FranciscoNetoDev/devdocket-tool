import { useEffect, useState } from "react";
import { taskService } from "@/application/tasks/taskService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import DroppableColumn from "./DroppableColumn";
import AddTasksToSprintDialog from "./AddTasksToSprintDialog";
import type { Database } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [addTasksDialogOpen, setAddTasksDialogOpen] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<string | null>(null);

  useEffect(() => {
    fetchSprintTasks();
  }, [sprint.id]);

  const fetchSprintTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getSprintTasks(sprint.id);

      // Transform data to match interface (without assignees for now)
      const tasksWithAssignees = (data || []).map((task) => ({
        ...task,
        task_assignees: [],
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
      await taskService.updateTaskStatus(taskId, newStatus);

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

  const handleRemoveFromSprint = async (taskId: string) => {
    try {
      await taskService.setTaskSprint(taskId, null);

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      toast.success("Task removida da sprint");
      setTaskToRemove(null);
    } catch (error: any) {
      console.error("Error removing task from sprint:", error);
      toast.error("Erro ao remover task da sprint");
    }
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
          onRemoveTask={(taskId) => setTaskToRemove(taskId)}
        />

        <DroppableColumn
          id="in_progress"
          label="Em Progresso"
          color="bg-blue-100 dark:bg-blue-900/30"
          tasks={inProgressTasks}
          onTaskClick={handleTaskClick}
          onRemoveTask={(taskId) => setTaskToRemove(taskId)}
        />

        <DroppableColumn
          id="done"
          label="Concluído"
          color="bg-green-100 dark:bg-green-900/30"
          tasks={doneTasks}
          onTaskClick={handleTaskClick}
          onRemoveTask={(taskId) => setTaskToRemove(taskId)}
        />
      </div>

      {/* Dialogs */}
      <AddTasksToSprintDialog
        open={addTasksDialogOpen}
        onOpenChange={setAddTasksDialogOpen}
        sprintId={sprint.id}
        projectId={projectId}
        onSuccess={fetchSprintTasks}
      />

      <AlertDialog open={!!taskToRemove} onOpenChange={() => setTaskToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover task da sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta task da sprint? Ela será movida de volta para o backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToRemove && handleRemoveFromSprint(taskToRemove)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
