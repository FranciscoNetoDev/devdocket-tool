import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, Calendar, Target, MoreVertical, Play, Pause, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateSprintDialog from "./CreateSprintDialog";
import SprintDetailView from "./SprintDetailView";

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
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);

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

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      const { error } = await supabase
        .from("sprints")
        .update({ status: "active" })
        .eq("id", sprint.id);

      if (error) throw error;

      toast.success("Sprint iniciada!");
      fetchSprints();
    } catch (error: any) {
      console.error("Error starting sprint:", error);
      toast.error("Erro ao iniciar sprint");
    }
  };

  const handlePauseSprint = async (sprint: Sprint) => {
    try {
      const { error } = await supabase
        .from("sprints")
        .update({ status: "paused" })
        .eq("id", sprint.id);

      if (error) throw error;

      toast.success("Sprint pausada!");
      fetchSprints();
    } catch (error: any) {
      console.error("Error pausing sprint:", error);
      toast.error("Erro ao pausar sprint");
    }
  };

  const handleResumeSprint = async (sprint: Sprint) => {
    try {
      const { error } = await supabase
        .from("sprints")
        .update({ status: "active" })
        .eq("id", sprint.id);

      if (error) throw error;

      toast.success("Sprint retomada!");
      fetchSprints();
    } catch (error: any) {
      console.error("Error resuming sprint:", error);
      toast.error("Erro ao retomar sprint");
    }
  };

  const handleCompleteSprint = async (sprint: Sprint) => {
    try {
      const { error } = await supabase
        .from("sprints")
        .update({ status: "completed" })
        .eq("id", sprint.id);

      if (error) throw error;

      toast.success("Sprint concluída!");
      fetchSprints();
    } catch (error: any) {
      console.error("Error completing sprint:", error);
      toast.error("Erro ao concluir sprint");
    }
  };

  if (selectedSprint) {
    return (
      <SprintDetailView
        sprint={selectedSprint}
        onBack={() => setSelectedSprint(null)}
      />
    );
  }

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
              <Card 
                key={sprint.id} 
                className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setSelectedSprint(sprint)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {sprint.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[sprint.status as keyof typeof statusColors]}>
                        {statusLabels[sprint.status as keyof typeof statusLabels]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sprint.status === "planning" && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStartSprint(sprint);
                            }}>
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar Sprint
                            </DropdownMenuItem>
                          )}
                          {sprint.status === "active" && (
                            <>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handlePauseSprint(sprint);
                              }}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar Sprint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteSprint(sprint);
                              }}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Concluir Sprint
                              </DropdownMenuItem>
                            </>
                          )}
                          {sprint.status === "paused" && (
                            <>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleResumeSprint(sprint);
                              }}>
                                <Play className="mr-2 h-4 w-4" />
                                Retomar Sprint
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteSprint(sprint);
                              }}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Concluir Sprint
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {sprint.goal && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                      <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">{sprint.goal}</p>
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
                      <p className={`text-sm font-medium ${daysRemaining < 0 ? "text-destructive" : daysRemaining <= 3 ? "text-yellow-500" : "text-green-600"}`}>
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
