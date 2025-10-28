import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Target } from "lucide-react";
import { toast } from "sonner";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface SprintsViewProps {
  projectId: string;
}

export default function SprintsView({ projectId }: SprintsViewProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
      toast.error("Erro ao carregar sprints");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "planning":
        return "bg-blue-500";
      case "completed":
        return "bg-slate-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "planning":
        return "Planejamento";
      case "completed":
        return "Concluído";
      default:
        return status;
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
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">
            Gerencie os sprints do projeto
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma sprint criada ainda
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => (
            <Card
              key={sprint.id}
              className="hover:shadow-md transition-all cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <Badge className={getStatusColor(sprint.status)}>
                    {getStatusLabel(sprint.status)}
                  </Badge>
                </div>
                {sprint.goal && (
                  <CardDescription className="flex items-start gap-2 mt-2">
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {sprint.goal}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(sprint.start_date).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(sprint.end_date).toLocaleDateString("pt-BR")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
