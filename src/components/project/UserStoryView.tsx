import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Edit, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import UserStoryDialog from "./UserStoryDialog";
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

interface UserStory {
  id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  story_points: number | null;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  created_at: string;
  created_by: string;
}

interface UserStoryViewProps {
  projectId: string;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-yellow-500/10 text-yellow-500",
  done: "bg-green-500/10 text-green-500",
};

const statusLabels = {
  draft: "Rascunho",
  ready: "Pronta",
  in_progress: "Em Progresso",
  done: "Concluída",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function UserStoryView({ projectId }: UserStoryViewProps) {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sprintFilter, setSprintFilter] = useState<string>("all");
  const [sprints, setSprints] = useState<Array<{ id: string; name: string }>>([]);
  const [sprintStories, setSprintStories] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchStories();
    fetchSprints();
    fetchSprintStories();

    const channel = supabase
      .channel("user_stories_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_stories",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchStories();
          fetchSprintStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_stories")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error: any) {
      console.error("Error fetching user stories:", error);
      toast.error("Erro ao carregar user stories");
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from("sprints")
        .select("id, name")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
    }
  };

  const fetchSprintStories = async () => {
    try {
      const { data, error } = await supabase
        .from("sprint_user_stories")
        .select("sprint_id, user_story_id");

      if (error) throw error;
      
      const mapping: Record<string, string[]> = {};
      data?.forEach((item) => {
        if (!mapping[item.sprint_id]) {
          mapping[item.sprint_id] = [];
        }
        mapping[item.sprint_id].push(item.user_story_id);
      });
      
      setSprintStories(mapping);
    } catch (error: any) {
      console.error("Error fetching sprint stories:", error);
    }
  };

  const handleEdit = (story: UserStory) => {
    setSelectedStory(story);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;

    try {
      const { error } = await supabase
        .from("user_stories")
        .delete()
        .eq("id", storyToDelete);

      if (error) throw error;
      toast.success("User Story deletada com sucesso!");
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user story:", error);
      toast.error("Erro ao deletar user story");
    }
  };

  const handleNewStory = () => {
    setSelectedStory(null);
    setDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSprintFilter("all");
  };

  // Aplicar filtros
  const filteredStories = stories.filter((story) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = story.title.toLowerCase().includes(searchLower);
      const matchesDescription = story.description?.toLowerCase().includes(searchLower);
      const matchesCriteria = story.acceptance_criteria?.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesCriteria) {
        return false;
      }
    }

    // Filtro de status
    if (statusFilter !== "all" && story.status !== statusFilter) {
      return false;
    }

    // Filtro de prioridade
    if (priorityFilter !== "all" && story.priority !== priorityFilter) {
      return false;
    }

    // Filtro de sprint
    if (sprintFilter !== "all") {
      if (sprintFilter === "no-sprint") {
        // Verificar se a story não está em nenhuma sprint
        const isInAnySprint = Object.values(sprintStories).some(storyIds => 
          storyIds.includes(story.id)
        );
        if (isInAnySprint) {
          return false;
        }
      } else {
        // Verificar se a story está na sprint selecionada
        const storiesInSprint = sprintStories[sprintFilter] || [];
        if (!storiesInSprint.includes(story.id)) {
          return false;
        }
      }
    }

    return true;
  });

  const hasActiveFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all" || sprintFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Stories</h2>
          <p className="text-muted-foreground">Gerencie as histórias de usuário do projeto</p>
        </div>
        <Button onClick={handleNewStory}>
          <Plus className="mr-2 h-4 w-4" />
          Nova User Story
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="ready">Pronta</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="done">Concluída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sprintFilter} onValueChange={setSprintFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as sprints" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sprints</SelectItem>
                <SelectItem value="no-sprint">Sem sprint</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {filteredStories.length} de {stories.length} user stories
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {stories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma user story criada ainda</p>
            <Button onClick={handleNewStory}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira User Story
            </Button>
          </CardContent>
        </Card>
      ) : filteredStories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma user story encontrada com os filtros aplicados</p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStories.map((story) => (
            <Card key={story.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[story.status as keyof typeof statusColors]}>
                        {statusLabels[story.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge className={priorityColors[story.priority as keyof typeof priorityColors]}>
                        {priorityLabels[story.priority as keyof typeof priorityLabels]}
                      </Badge>
                      {story.story_points && (
                        <Badge variant="outline">
                          {story.story_points} pts
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(story)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStoryToDelete(story.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(story.description || story.acceptance_criteria) && (
                <CardContent className="space-y-3">
                  {story.description && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Descrição</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {story.description}
                      </p>
                    </div>
                  )}
                  {story.acceptance_criteria && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Critérios de Aceitação</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {story.acceptance_criteria}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <UserStoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        story={selectedStory}
        onSuccess={fetchStories}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta user story? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
