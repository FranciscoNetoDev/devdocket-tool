import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserStory {
  id: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  project_id: string;
  projects: {
    name: string;
    key: string;
  };
  tasks?: Array<{
    estimated_hours: number | null;
  }>;
}

interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface ManageSprintStoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
  onSuccess: () => void;
}

const DAILY_CAPACITY = 8; // Capacidade máxima de pontos por dia

export default function ManageSprintStoriesDialog({
  open,
  onOpenChange,
  sprint,
  onSuccess,
}: ManageSprintStoriesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableStories, setAvailableStories] = useState<UserStory[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [currentSprintStories, setCurrentSprintStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, sprint.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar stories já vinculadas à sprint
      const { data: sprintStoriesData } = await supabase
        .from("sprint_user_stories")
        .select("user_story_id")
        .eq("sprint_id", sprint.id);

      const currentStoryIds = new Set(sprintStoriesData?.map(s => s.user_story_id) || []);
      setCurrentSprintStories(currentStoryIds);
      setSelectedStories(new Set(currentStoryIds));

      // Buscar todas as user stories disponíveis (sem sprint)
      const { data: storiesData, error: storiesError } = await supabase
        .from("user_stories")
        .select(`
          id,
          title,
          status,
          priority,
          story_points,
          project_id,
          projects:project_id (name, key)
        `)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (storiesError) throw storiesError;

      // Filtrar stories que não estão em nenhuma sprint (exceto a atual) e buscar tasks
      const storiesWithSprintStatus = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { data: sprintLink } = await supabase
            .from("sprint_user_stories")
            .select("sprint_id")
            .eq("user_story_id", story.id)
            .maybeSingle();

          // Incluir se não está em sprint OU está na sprint atual
          if (!sprintLink || sprintLink.sprint_id === sprint.id) {
            // Buscar tasks da story
            const { data: tasksData } = await supabase
              .from("tasks")
              .select("estimated_hours")
              .eq("user_story_id", story.id)
              .is("deleted_at", null);

            return {
              ...story,
              tasks: tasksData || [],
            };
          }
          return null;
        })
      );

      const availableStoriesData = storiesWithSprintStatus.filter(Boolean) as UserStory[];
      setAvailableStories(availableStoriesData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const toggleStory = (storyId: string, storyStatus: string) => {
    // Só permite adicionar stories com status "ready"
    if (storyStatus !== "ready" && !selectedStories.has(storyId)) {
      toast.error("Apenas user stories com status 'Pronta' podem ser vinculadas à sprint");
      return;
    }
    
    setSelectedStories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const calculateCapacity = () => {
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const days = differenceInDays(endDate, startDate) + 1;
    const totalCapacity = days * DAILY_CAPACITY; // horas baseadas nos dias

    const selectedHours = availableStories
      .filter(story => selectedStories.has(story.id))
      .reduce((sum, story) => {
        const storyHours = (story.tasks || []).reduce(
          (taskSum, task) => taskSum + (task.estimated_hours || 0),
          0
        );
        return sum + storyHours;
      }, 0);

    return {
      days,
      totalCapacity,
      selectedHours,
      remaining: totalCapacity - selectedHours,
      isOverCapacity: selectedHours > totalCapacity,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const capacity = calculateCapacity();
      if (capacity.isOverCapacity) {
        toast.error(`Capacidade excedida! A sprint suporta apenas ${capacity.totalCapacity} horas (${capacity.days} dias × ${DAILY_CAPACITY} horas/dia)`);
        return;
      }

      // Remover stories que foram desmarcadas
      const toRemove = Array.from(currentSprintStories).filter(id => !selectedStories.has(id));
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("sprint_user_stories")
          .delete()
          .eq("sprint_id", sprint.id)
          .in("user_story_id", toRemove);

        if (deleteError) throw deleteError;
      }

      // Adicionar novas stories
      const toAdd = Array.from(selectedStories).filter(id => !currentSprintStories.has(id));
      if (toAdd.length > 0) {
        const insertData = toAdd.map(user_story_id => ({
          sprint_id: sprint.id,
          user_story_id,
        }));

        const { error: insertError } = await supabase
          .from("sprint_user_stories")
          .insert(insertData);

        if (insertError) throw insertError;

        // Vincular automaticamente os projetos das user stories à sprint
        const projectIds = Array.from(
          new Set(
            availableStories
              .filter(story => toAdd.includes(story.id))
              .map(story => story.project_id)
          )
        );

        if (projectIds.length > 0) {
          // Verificar quais projetos já estão vinculados
          const { data: existingLinks } = await supabase
            .from("sprint_projects")
            .select("project_id")
            .eq("sprint_id", sprint.id)
            .in("project_id", projectIds);

          const existingProjectIds = existingLinks?.map(link => link.project_id) || [];
          const newProjectIds = projectIds.filter(id => !existingProjectIds.includes(id));

          if (newProjectIds.length > 0) {
            const projectLinks = newProjectIds.map(project_id => ({
              sprint_id: sprint.id,
              project_id,
            }));

            const { error: linkError } = await supabase
              .from("sprint_projects")
              .insert(projectLinks);

            if (linkError) {
              console.error("Error linking projects:", linkError);
              // Não falhar a operação inteira, apenas avisar
              toast.warning("User stories adicionadas, mas houve erro ao vincular alguns projetos");
            }
          }
        }
      }

      toast.success("User stories atualizadas com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving sprint stories:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  const capacity = calculateCapacity();

  const priorityConfig = {
    low: { color: "text-blue-600 bg-blue-50 border-blue-200", label: "Baixa" },
    medium: { color: "text-yellow-600 bg-yellow-50 border-yellow-200", label: "Média" },
    high: { color: "text-orange-600 bg-orange-50 border-orange-200", label: "Alta" },
    critical: { color: "text-red-600 bg-red-50 border-red-200", label: "Crítica" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar User Stories da Sprint</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {sprint.name}
          </div>
        </DialogHeader>

        {/* Capacity Card */}
        <Card className={capacity.isOverCapacity ? "border-destructive" : "border-primary"}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Capacidade da Sprint</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(sprint.start_date), "dd/MM", { locale: ptBR })} - {format(new Date(sprint.end_date), "dd/MM", { locale: ptBR })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 text-center">
                <div>
                  <div className="text-xl md:text-2xl font-bold">{capacity.days}</div>
                  <div className="text-xs text-muted-foreground">dias</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold">{capacity.totalCapacity.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">horas total</div>
                </div>
                <div>
                  <div className={`text-xl md:text-2xl font-bold ${capacity.isOverCapacity ? 'text-destructive' : 'text-primary'}`}>
                    {capacity.selectedHours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-muted-foreground">horas selecionadas</div>
                </div>
                <div>
                  <div className={`text-xl md:text-2xl font-bold ${capacity.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {capacity.remaining.toFixed(1)}h
                  </div>
                  <div className="text-xs text-muted-foreground">horas restantes</div>
                </div>
              </div>

              {capacity.isOverCapacity && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A capacidade foi excedida! Remova {Math.abs(capacity.remaining).toFixed(1)} horas para continuar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stories List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : availableStories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma user story disponível</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableStories.map((story) => {
                const isReady = story.status === "ready";
                const isSelected = selectedStories.has(story.id);
                const canSelect = isReady || isSelected;
                
                return (
                  <Card
                    key={story.id}
                    className={`transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : canSelect
                        ? "cursor-pointer hover:border-primary/50"
                        : "opacity-50 cursor-not-allowed bg-muted/30"
                    }`}
                    onClick={() => canSelect && toggleStory(story.id, story.status)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={!canSelect}
                          onCheckedChange={() => canSelect && toggleStory(story.id, story.status)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{story.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {story.projects.name} ({story.projects.key})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isReady ? "default" : "secondary"} className={isReady ? "bg-emerald-600" : "bg-slate-400"}>
                            {isReady ? "✓ Pronta" : story.status === "draft" ? "Rascunho" : "Em progresso"}
                          </Badge>
                          <Badge className={priorityConfig[story.priority as keyof typeof priorityConfig]?.color}>
                            {priorityConfig[story.priority as keyof typeof priorityConfig]?.label}
                          </Badge>
                          {story.story_points && (
                            <Badge variant="outline" className="font-bold">
                              {story.story_points} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!canSelect && (
                        <div className="mt-2 text-xs text-muted-foreground italic ml-9">
                          Apenas user stories com status "Pronta" podem ser vinculadas
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || capacity.isOverCapacity}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
