import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TaskDialog from "./TaskDialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_hours: number | null;
  due_date: string | null;
  task_assignees: Array<{
    user_id: string;
    profiles: {
      name: string;
    };
  }>;
}

interface BoardViewProps {
  projectId: string;
  projectKey: string;
}

const statusColumns = [
  { id: "todo", label: "A Fazer", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "in_progress", label: "Em Progresso", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "done", label: "Concluído", color: "bg-green-50 dark:bg-green-950" },
  { id: "blocked", label: "Bloqueado", color: "bg-red-50 dark:bg-red-950" },
];

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function BoardView({ projectId, projectKey }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
    
    // Realtime subscription
    const channel = supabase
      .channel('board-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select(`
          *,
          task_assignees(
            user_id,
            profiles:user_id(name)
          )
        `)
        .eq("project_id", projectId)
        .is("sprint_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusColumns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            <div className={`rounded-t-lg px-4 py-3 ${column.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.label}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </div>

            <div className="space-y-3 p-2 min-h-[200px] bg-muted/30 rounded-b-lg">
              {columnTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {task.title}
                      </CardTitle>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          priorityColors[task.priority as keyof typeof priorityColors]
                        }`}
                        title={`Prioridade: ${task.priority}`}
                      />
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        )}
                      </div>
                      {task.task_assignees.length > 0 && (
                        <div className="flex -space-x-2">
                          {task.task_assignees.slice(0, 3).map((assignee, idx) => (
                            <Avatar key={idx} className="w-6 h-6 border-2 border-background">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {assignee.profiles?.name?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma task
                </div>
              )}
            </div>
          </div>
        );
      })}

      <TaskDialog
        taskId={selectedTaskId}
        projectKey={projectKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
}
