import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Clock, AlertCircle, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_hours: number | null;
  due_date: string | null;
  task_assignees: Array<{
    profiles: {
      name: string;
    };
  }>;
}

interface BacklogViewProps {
  projectId: string;
  projectKey: string;
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

const statusLabels = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
  blocked: "Bloqueado",
};

export default function BacklogView({ projectId, projectKey }: BacklogViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select(`
          *,
          task_assignees(
            profiles:user_id(name)
          )
        `)
        .eq("project_id", projectId)
        .is("sprint_id", null)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching backlog:", error);
      toast.error("Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backlog</h2>
          <p className="text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"} no backlog
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma task no backlog ainda
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-all cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-grab" />
                  
                  <div
                    className={`w-1 h-full rounded-full ${
                      priorityColors[task.priority as keyof typeof priorityColors]
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary">
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-current"
                          style={{
                            borderColor: priorityColors[task.priority as keyof typeof priorityColors].replace('bg-', ''),
                          }}
                        >
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.estimated_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimated_hours}h estimadas
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                      {task.task_assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {task.task_assignees.slice(0, 3).map((assignee, idx) => (
                              <Avatar key={idx} className="w-5 h-5 border-2 border-background">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {assignee.profiles?.name?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {task.task_assignees.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                +{task.task_assignees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
