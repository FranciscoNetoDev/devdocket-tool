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

      // Filtrar stories que não estão em nenhuma sprint (exceto a atual)
      const storiesWithSprintStatus = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { data: sprintLink } = await supabase
            .from("sprint_user_stories")
            .select("sprint_id")
            .eq("user_story_id", story.id)
            .maybeSingle();

          // Incluir se não está em sprint OU está na sprint atual
          if (!sprintLink || sprintLink.sprint_id === sprint.id) {
            return story;
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

  const toggleStory = (storyId: string) => {
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
    const totalCapacity = days * DAILY_CAPACITY;

    const selectedPoints = availableStories
      .filter(story => selectedStories.has(story.id))
      .reduce((sum, story) => sum + (story.story_points || 0), 0);

    return {
      days,
      totalCapacity,
      selectedPoints,
      remaining: totalCapacity - selectedPoints,
      isOverCapacity: selectedPoints > totalCapacity,
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const capacity = calculateCapacity();
      if (capacity.isOverCapacity) {
        toast.error(`Capacidade excedida! A sprint suporta apenas ${capacity.totalCapacity} pontos (${capacity.days} dias × ${DAILY_CAPACITY} pontos/dia)`);
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

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{capacity.days}</div>
                  <div className="text-xs text-muted-foreground">dias</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{capacity.totalCapacity}</div>
                  <div className="text-xs text-muted-foreground">pontos total</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${capacity.isOverCapacity ? 'text-destructive' : 'text-primary'}`}>
                    {capacity.selectedPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">pontos selecionados</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${capacity.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {capacity.remaining}
                  </div>
                  <div className="text-xs text-muted-foreground">pontos restantes</div>
                </div>
              </div>

              {capacity.isOverCapacity && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A capacidade foi excedida! Remova {Math.abs(capacity.remaining)} pontos para continuar.
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
              {availableStories.map((story) => (
                <Card
                  key={story.id}
                  className={`cursor-pointer transition-all ${
                    selectedStories.has(story.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleStory(story.id)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStories.has(story.id)}
                        onCheckedChange={() => toggleStory(story.id)}
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
                  </CardContent>
                </Card>
              ))}
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
