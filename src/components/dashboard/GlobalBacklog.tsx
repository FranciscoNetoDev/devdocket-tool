import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, ChevronDown, FolderOpen, FileText, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  key: string;
  user_stories: UserStory[];
}

interface UserStory {
  id: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-500",
  done: "bg-green-500/10 text-green-500",
  blocked: "bg-red-500/10 text-red-500",
  draft: "bg-muted text-muted-foreground",
  ready: "bg-blue-500/10 text-blue-500",
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
  blocked: "Bloqueado",
  draft: "Rascunho",
  ready: "Pronta",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export default function GlobalBacklog() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    try {
      setLoading(true);

      // Buscar projetos do usuário
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, key")
        .order("name");

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      // Buscar user stories sem sprint vinculada para cada projeto
      const projectsWithData = await Promise.all(
        projectsData.map(async (project) => {
          // Buscar user stories do projeto
          const { data: storiesData, error: storiesError } = await supabase
            .from("user_stories")
            .select("id, title, status, priority, story_points")
            .eq("project_id", project.id)
            .order("priority", { ascending: false })
            .order("created_at", { ascending: false });

          if (storiesError) throw storiesError;

          // Para cada user story, verificar se está vinculada a alguma sprint
          const storiesWithoutSprint = await Promise.all(
            (storiesData || []).map(async (story) => {
              const { data: sprintLink } = await supabase
                .from("sprint_user_stories")
                .select("id")
                .eq("user_story_id", story.id)
                .maybeSingle();

              // Se não está em sprint, buscar suas tasks
              if (!sprintLink) {
                const { data: tasksData, error: tasksError } = await supabase
                  .from("tasks")
                  .select("id, title, status, priority")
                  .eq("user_story_id", story.id)
                  .is("deleted_at", null)
                  .order("status")
                  .order("priority", { ascending: false });

                if (tasksError) throw tasksError;

                return {
                  ...story,
                  tasks: tasksData || [],
                };
              }
              return null;
            })
          );

          const filteredStories = storiesWithoutSprint.filter((s) => s !== null) as UserStory[];

          return {
            ...project,
            user_stories: filteredStories,
          };
        })
      );

      // Filtrar projetos que têm user stories no backlog
      const projectsWithBacklog = projectsWithData.filter((p) => p.user_stories.length > 0);
      setProjects(projectsWithBacklog);
    } catch (error: any) {
      console.error("Error fetching backlog:", error);
      toast.error("Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleStory = (storyId: string) => {
    setExpandedStories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const getTotalTasksCount = () => {
    return projects.reduce(
      (total, project) =>
        total +
        project.user_stories.reduce((storyTotal, story) => storyTotal + story.tasks.length, 0),
      0
    );
  };

  const getTotalStoriesCount = () => {
    return projects.reduce((total, project) => total + project.user_stories.length, 0);
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
          {projects.length} projeto(s), {getTotalStoriesCount()} user story(ies), {getTotalTasksCount()} task(s) sem sprint
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum item no backlog</p>
            <p className="text-sm text-muted-foreground mt-2">
              Todas as user stories estão vinculadas a sprints
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <Collapsible
                open={expandedProjects.has(project.id)}
                onOpenChange={() => toggleProject(project.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-6 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.key} • {project.user_stories.length} user stor{project.user_stories.length === 1 ? "y" : "ies"}
                        </div>
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2">
                    {project.user_stories.map((story) => (
                      <div key={story.id} className="ml-8">
                        <Collapsible
                          open={expandedStories.has(story.id)}
                          onOpenChange={() => toggleStory(story.id)}
                        >
                          <Card className="border-l-4 border-l-primary/20">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-start px-4 py-4 hover:bg-muted/30"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {expandedStories.has(story.id) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{story.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className={statusColors[story.status]}>
                                        {statusLabels[story.status] || story.status}
                                      </Badge>
                                      <Badge className={priorityColors[story.priority as keyof typeof priorityColors]}>
                                        {priorityLabels[story.priority as keyof typeof priorityLabels]}
                                      </Badge>
                                      {story.story_points && (
                                        <Badge variant="outline">{story.story_points} pts</Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {story.tasks.length} task{story.tasks.length !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-2">
                                {story.tasks.length === 0 ? (
                                  <div className="ml-8 text-sm text-muted-foreground py-2">
                                    Nenhuma task vinculada
                                  </div>
                                ) : (
                                  story.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="ml-8 flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                      <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{task.title}</div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="outline" className={statusColors[task.status]}>
                                          {statusLabels[task.status] || task.status}
                                        </Badge>
                                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
