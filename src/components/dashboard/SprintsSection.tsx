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
import { Plus, Loader2, Calendar, Target, MoreVertical, Play, Pause, CheckCircle2, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateSprintDialog from "./CreateSprintDialog";
import SprintDetailView from "./SprintDetailView";
import RetrospectiveDialog from "../project/RetrospectiveDialog";

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
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [retrospectiveDialogOpen, setRetrospectiveDialogOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<Sprint | null>(null);
  const [currentSprintIndex, setCurrentSprintIndex] = useState(0);

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
      // Check if there's already an active sprint
      const activeSprint = sprints.find(s => s.status === "active" && s.id !== sprint.id);
      if (activeSprint) {
        toast.error("Já existe uma sprint ativa. Complete ou pause-a antes de iniciar outra.");
        return;
      }

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
      // Check if there's already an active sprint
      const activeSprint = sprints.find(s => s.status === "active" && s.id !== sprint.id);
      if (activeSprint) {
        toast.error("Já existe uma sprint ativa. Complete ou pause-a antes de retomar outra.");
        return;
      }

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
      // Check if sprint has a retrospective
      const { data: retro, error: retroError } = await supabase
        .from("retrospectives")
        .select("id")
        .eq("sprint_id", sprint.id)
        .maybeSingle();

      if (retroError) throw retroError;

      if (!retro) {
        // No retrospective yet, open dialog
        setSprintToComplete(sprint);
        setRetrospectiveDialogOpen(true);
        return;
      }

      // Has retrospective, complete sprint
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

  const handleRetrospectiveSuccess = async () => {
    if (!sprintToComplete) return;

    try {
      // Complete the sprint after retrospective is saved
      const { error } = await supabase
        .from("sprints")
        .update({ status: "completed" })
        .eq("id", sprintToComplete.id);

      if (error) throw error;

      toast.success("Sprint concluída com retrospectiva!");
      setSprintToComplete(null);
      setRetrospectiveDialogOpen(false);
      fetchSprints();
    } catch (error: any) {
      console.error("Error completing sprint:", error);
      toast.error("Erro ao concluir sprint");
    }
  };

  const handleNavigateList = (direction: 'prev' | 'next') => {
    setCurrentSprintIndex(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, sprints.length - 1);
      } else {
        return Math.max(prev - 1, 0);
      }
    });
  };

  const handleNavigateSprint = (direction: 'prev' | 'next') => {
    if (!selectedSprint) return;
    
    const currentIndex = sprints.findIndex(s => s.id === selectedSprint.id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < sprints.length) {
      setSelectedSprint(sprints[newIndex]);
    }
  };

  if (selectedSprint) {
    const currentIndex = sprints.findIndex(s => s.id === selectedSprint.id);
    return (
      <SprintDetailView
        sprint={selectedSprint}
        onBack={() => setSelectedSprint(null)}
        onNavigate={handleNavigateSprint}
        hasNext={currentIndex < sprints.length - 1}
        hasPrev={currentIndex > 0}
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

  const currentSprint = sprints[currentSprintIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Gerencie sprints globais</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma sprint criada ainda</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNavigateList('prev')}
                  disabled={currentSprintIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl">{currentSprint.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Sprint {currentSprintIndex + 1} de {sprints.length}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNavigateList('next')}
                  disabled={currentSprintIndex === sprints.length - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[currentSprint.status as keyof typeof statusColors]}>
                  {statusLabels[currentSprint.status as keyof typeof statusLabels]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentSprint.status === "planning" && (
                      <DropdownMenuItem onClick={() => handleStartSprint(currentSprint)}>
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar Sprint
                      </DropdownMenuItem>
                    )}
                    {currentSprint.status === "active" && (
                      <>
                        <DropdownMenuItem onClick={() => handlePauseSprint(currentSprint)}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar Sprint
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCompleteSprint(currentSprint)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Concluir Sprint
                        </DropdownMenuItem>
                      </>
                    )}
                    {currentSprint.status === "paused" && (
                      <>
                        <DropdownMenuItem onClick={() => handleResumeSprint(currentSprint)}>
                          <Play className="mr-2 h-4 w-4" />
                          Retomar Sprint
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCompleteSprint(currentSprint)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Concluir Sprint
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSprint.goal && (
              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Objetivo</p>
                  <p className="text-sm text-muted-foreground">{currentSprint.goal}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">Período</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(currentSprint.start_date), "dd 'de' MMMM", { locale: ptBR })} - {format(new Date(currentSprint.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            {currentSprint.status === "active" && (() => {
              const daysRemaining = differenceInDays(new Date(currentSprint.end_date), new Date());
              return (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">Progresso</span>
                    <span className={daysRemaining < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {daysRemaining < 0 
                        ? "Atrasada" 
                        : `${daysRemaining} dias restantes`}
                    </span>
                  </div>
                </div>
              );
            })()}
            <div className="pt-4">
              <Button 
                onClick={() => setSelectedSprint(currentSprint)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes da Sprint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateSprintDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchSprints}
      />

      {sprintToComplete && (
        <RetrospectiveDialog
          open={retrospectiveDialogOpen}
          onOpenChange={setRetrospectiveDialogOpen}
          sprintId={sprintToComplete.id}
          retrospective={null}
          onSuccess={handleRetrospectiveSuccess}
        />
      )}
    </div>
  );
}
