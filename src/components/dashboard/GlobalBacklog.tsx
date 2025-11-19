import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  projects: {
    name: string;
    key: string;
  };
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

const statusColors = {
  todo: "bg-gray-500/10 text-gray-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  done: "bg-green-500/10 text-green-500",
  blocked: "bg-red-500/10 text-red-500",
};

const statusLabels = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
  blocked: "Bloqueado",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function GlobalBacklog() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    try {
      setLoading(true);

      // Get all projects user has access to
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id");

      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setTasks([]);
        return;
      }

      const projectIds = projects.map(p => p.id);

      // Get all tasks without sprint from user's projects
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          project_id,
          projects (name, key)
        `)
        .in("project_id", projectIds)
        .is("sprint_id", null)
        .is("deleted_at", null)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTasks(data as any || []);
    } catch (error: any) {
      console.error("Error fetching backlog:", error);
      toast.error("Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Backlog Geral</h2>
        <p className="text-muted-foreground">
          Tasks de todos os projetos sem sprint ({tasks.length})
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhuma task no backlog</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {task.projects.key}
                      </Badge>
                      <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {priorityLabels[task.priority as keyof typeof priorityLabels]}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{task.projects.name}</span>
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.due_date), "dd MMM yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
