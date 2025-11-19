import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Loader2, Plus, Calendar, Target, MoreVertical, Pencil, Trash2, Play, CheckCircle2, Pause, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CreateSprintDialog from "./CreateSprintDialog";
import EditSprintDialog from "./EditSprintDialog";
import SprintBoard from "./SprintBoard";

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null);
  const [viewingSprint, setViewingSprint] = useState<Sprint | null>(null);

  useEffect(() => {
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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

  const handleDeleteSprint = async () => {
    if (!deletingSprint) return;

    try {
      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", deletingSprint.id);

      if (error) throw error;

      toast.success("Sprint deletada com sucesso!");
      setDeletingSprint(null);
      fetchSprints();
    } catch (error: any) {
      console.error("Error deleting sprint:", error);
      toast.error("Erro ao deletar sprint");
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      // Verificar se já existe sprint ativa
      const { data: activeSprints, error: checkError } = await supabase
        .from("sprints")
        .select("id, name")
        .eq("project_id", projectId)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (activeSprints && activeSprints.length > 0) {
        toast.error(`Já existe uma sprint ativa: "${activeSprints[0].name}". Complete ou pause ela antes de iniciar outra.`);
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
      // Verificar se já existe sprint ativa
      const { data: activeSprints, error: checkError } = await supabase
        .from("sprints")
        .select("id, name")
        .eq("project_id", projectId)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (activeSprints && activeSprints.length > 0) {
        toast.error(`Já existe uma sprint ativa: "${activeSprints[0].name}". Complete ou pause ela antes de retomar outra.`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "planning":
        return "bg-blue-500";
      case "paused":
        return "bg-orange-500";
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
      case "paused":
        return "Pausado";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSprintWarning = (sprint: Sprint) => {
    if (sprint.status !== "active") return null;
    
    const daysRemaining = getDaysRemaining(sprint.end_date);
    
    if (daysRemaining < 0) {
      return { text: "Sprint atrasada!", color: "text-red-500" };
    } else if (daysRemaining <= 2) {
      return { text: `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}!`, color: "text-orange-500" };
    } else if (daysRemaining <= 5) {
      return { text: `${daysRemaining} dias restantes`, color: "text-yellow-500" };
    }
    
    return null;
  };

  if (viewingSprint) {
    return (
      <SprintBoard
        sprint={viewingSprint}
        projectId={projectId}
        onBack={() => setViewingSprint(null)}
      />
    );
  }

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
        <Button onClick={() => setShowCreateDialog(true)}>
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
            <Button onClick={() => setShowCreateDialog(true)}>
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
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setViewingSprint(sprint)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(sprint.status)}>
                      {getStatusLabel(sprint.status)}
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
                          <>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStartSprint(sprint);
                            }}>
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar Sprint
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSprint(sprint);
                            }}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Concluir Sprint
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSprint(sprint);
                            }}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Concluir Sprint
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingSprint(sprint);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSprint(sprint);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {sprint.goal && (
                  <CardDescription className="flex items-start gap-2 mt-2">
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {sprint.goal}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(sprint.start_date).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString("pt-BR")}
                  </div>
                  {getSprintWarning(sprint) && (
                    <div className={`flex items-center gap-2 text-sm font-medium ${getSprintWarning(sprint)?.color}`}>
                      <AlertTriangle className="w-4 h-4" />
                      {getSprintWarning(sprint)?.text}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSprintDialog
        projectId={projectId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchSprints}
      />

      <EditSprintDialog
        sprint={editingSprint}
        open={!!editingSprint}
        onOpenChange={(open) => !open && setEditingSprint(null)}
        onSuccess={fetchSprints}
      />

      <AlertDialog open={!!deletingSprint} onOpenChange={(open) => !open && setDeletingSprint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a sprint "{deletingSprint?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSprint} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
