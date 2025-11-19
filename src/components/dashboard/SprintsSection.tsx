import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Calendar, Target } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateSprintDialog from "./CreateSprintDialog";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  org_id: string;
}

export default function SprintsSection() {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      
      // Get user's org
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("org_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.org_id) {
        setSprints([]);
        return;
      }

      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("org_id", userRole.org_id)
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

  const statusColors = {
    planning: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
  };

  const statusLabels = {
    planning: "Planejamento",
    active: "Ativa",
    paused: "Pausada",
    completed: "Concluída",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Gerencie sprints globais</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma sprint criada ainda</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const daysRemaining = differenceInDays(new Date(sprint.end_date), new Date());
            return (
              <Card key={sprint.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <Badge className={statusColors[sprint.status as keyof typeof statusColors]}>
                      {statusLabels[sprint.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  {sprint.goal && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>{sprint.goal}</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(sprint.start_date), "dd MMM", { locale: ptBR })} -{" "}
                        {format(new Date(sprint.end_date), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {sprint.status === "active" && (
                      <p className={`text-sm font-medium ${daysRemaining < 0 ? "text-red-500" : daysRemaining <= 3 ? "text-yellow-500" : "text-green-500"}`}>
                        {daysRemaining < 0
                          ? `Atrasada (${Math.abs(daysRemaining)} dias)`
                          : daysRemaining === 0
                          ? "Termina hoje"
                          : `${daysRemaining} dias restantes`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateSprintDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchSprints}
      />
    </div>
  );
}
