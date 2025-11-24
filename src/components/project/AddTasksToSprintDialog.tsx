import { useState, useEffect } from "react";
import { taskService } from "@/application/tasks/taskService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
}

interface AddTasksToSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  projectId: string;
  onSuccess: () => void;
}

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function AddTasksToSprintDialog({
  open,
  onOpenChange,
  sprintId,
  projectId,
  onSuccess,
}: AddTasksToSprintDialogProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBacklogTasks();
      setSelectedTasks([]);
    }
  }, [open, projectId]);

  const fetchBacklogTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getProjectBacklogTasks(projectId);
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching backlog tasks:", error);
      toast.error("Erro ao carregar tasks do backlog");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) {
      toast.error("Selecione pelo menos uma task");
      return;
    }

    try {
      setAdding(true);

      await Promise.all(
        selectedTasks.map((taskId) =>
          taskService.setTaskSprint(taskId, sprintId)
        )
      );

      toast.success(
        `${selectedTasks.length} ${
          selectedTasks.length === 1 ? "task adicionada" : "tasks adicionadas"
        } à sprint`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding tasks to sprint:", error);
      toast.error("Erro ao adicionar tasks à sprint");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Tasks à Sprint</DialogTitle>
          <DialogDescription>
            Selecione as tasks do backlog para adicionar à sprint
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2">
              Nenhuma task disponível no backlog
            </p>
            <p className="text-sm text-muted-foreground">
              Crie novas tasks no backlog primeiro
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleTask(task.id)}
                  >
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${
                            priorityColors[task.priority as keyof typeof priorityColors]
                          } text-white text-xs`}
                        >
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedTasks.length} {selectedTasks.length === 1 ? "task selecionada" : "tasks selecionadas"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={adding}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddTasks}
                  disabled={adding || selectedTasks.length === 0}
                >
                  {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar à Sprint
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
