import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, FolderOpen, FileText, CheckSquare, Package } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  sprint?: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

const priorityConfig = {
  low: { 
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Baixa",
    icon: "🔵"
  },
  medium: { 
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    label: "Média",
    icon: "🟡"
  },
  high: { 
    color: "text-orange-600 bg-orange-50 border-orange-200",
    label: "Alta",
    icon: "🟠"
  },
  critical: { 
    color: "text-red-600 bg-red-50 border-red-200",
    label: "Crítica",
    icon: "🔴"
  },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  todo: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "A Fazer" },
  in_progress: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Em Progresso" },
  done: { color: "bg-green-100 text-green-700 border-green-200", label: "Concluído" },
  blocked: { color: "bg-red-100 text-red-700 border-red-200", label: "Bloqueado" },
  draft: { color: "bg-slate-100 text-slate-600 border-slate-200", label: "Rascunho" },
  ready: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Pronta" },
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

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, key")
        .order("name");

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      const projectsWithData = await Promise.all(
        projectsData.map(async (project) => {
          const { data: storiesData, error: storiesError } = await supabase
            .from("user_stories")
            .select("id, title, status, priority, story_points")
            .eq("project_id", project.id)
            .order("priority", { ascending: false })
            .order("created_at", { ascending: false });

          if (storiesError) throw storiesError;

          const storiesWithData = await Promise.all(
            (storiesData || []).map(async (story) => {
              const { data: sprintLink } = await supabase
                .from("sprint_user_stories")
                .select("sprint_id, sprints:sprint_id(name)")
                .eq("user_story_id", story.id)
                .maybeSingle();

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
                sprint: sprintLink ? (sprintLink.sprints as any) : null,
              };
            })
          );

          return {
            ...project,
            user_stories: storiesWithData,
          };
        })
      );

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Backlog Geral</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão hierárquica de todos os itens sem sprint
          </p>
        </div>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 md:pt-6 px-4">
            <div className="flex items-center justify-between md:gap-6 gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span className="font-semibold">{projects.length}</span>
                <span className="text-muted-foreground hidden sm:inline">projetos</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                <span className="font-semibold">{getTotalStoriesCount()}</span>
                <span className="text-muted-foreground hidden sm:inline">stories</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <CheckSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                <span className="font-semibold">{getTotalTasksCount()}</span>
                <span className="text-muted-foreground hidden sm:inline">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">Nenhuma user story encontrada</p>
            <p className="text-sm text-muted-foreground">
              Crie user stories nos seus projetos para visualizá-las aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-all">
              <Collapsible
                open={expandedProjects.has(project.id)}
                onOpenChange={() => toggleProject(project.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 md:py-4 px-3 md:px-6">
                    <div className="flex items-start md:items-center gap-2 md:gap-3">
                      <ChevronRight className={cn(
                        "h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-transform flex-shrink-0 mt-0.5 md:mt-0",
                        expandedProjects.has(project.id) && "rotate-90"
                      )} />
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base md:text-lg truncate">{project.name}</CardTitle>
                            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                              {project.key}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs self-start md:self-auto md:ml-auto flex-shrink-0">
                          {project.user_stories.length} {project.user_stories.length === 1 ? "story" : "stories"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 md:pb-4 space-y-2 md:space-y-3 px-3 md:px-6">
                    {project.user_stories.map((story, idx) => (
                      <div key={story.id} className={cn("ml-0 md:ml-11", idx > 0 && "pt-2 md:pt-3 border-t")}>
                        <Collapsible
                          open={expandedStories.has(story.id)}
                          onOpenChange={() => toggleStory(story.id)}
                        >
                          <Card className="bg-gradient-to-r from-blue-50/50 to-transparent border-l-2 border-l-blue-400">
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors py-2 md:py-3 px-3 md:px-6">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <ChevronRight className={cn(
                                      "h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground transition-transform flex-shrink-0 mt-0.5",
                                      expandedStories.has(story.id) && "rotate-90"
                                    )} />
                                    <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span className="font-medium text-xs md:text-sm flex-1 break-words">{story.title}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 ml-6 md:ml-0">
                                    <Badge variant="outline" className={cn("text-[10px] md:text-xs whitespace-nowrap", statusConfig[story.status]?.color)}>
                                      {statusConfig[story.status]?.label || story.status}
                                    </Badge>
                                    <Badge className={cn("text-[10px] md:text-xs border whitespace-nowrap", priorityConfig[story.priority as keyof typeof priorityConfig]?.color)}>
                                      {priorityConfig[story.priority as keyof typeof priorityConfig]?.icon}{" "}
                                      <span className="hidden sm:inline">{priorityConfig[story.priority as keyof typeof priorityConfig]?.label}</span>
                                    </Badge>
                                    {story.story_points && (
                                      <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
                                        {story.story_points} pts
                                      </Badge>
                                    )}
                                    {story.sprint && (
                                      <Badge variant="default" className="text-[10px] md:text-xs bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                                        📌 <span className="hidden sm:inline">{story.sprint.name}</span>
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-[10px] md:text-xs whitespace-nowrap">
                                      {story.tasks.length} {story.tasks.length === 1 ? "task" : "tasks"}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-2 md:pb-3 px-3 md:px-6">
                                {story.tasks.length === 0 ? (
                                  <div className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4 bg-muted/30 rounded-lg">
                                    Nenhuma task vinculada a esta story
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 md:space-y-2">
                                    {story.tasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 md:p-3 rounded-lg bg-white border hover:border-primary/30 hover:shadow-sm transition-all"
                                      >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          <CheckSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                          <span className="text-xs md:text-sm flex-1 font-medium break-words">{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 md:gap-2 ml-5 sm:ml-0 flex-shrink-0">
                                          <Badge variant="outline" className={cn("text-[10px] md:text-xs whitespace-nowrap", statusConfig[task.status]?.color)}>
                                            {statusConfig[task.status]?.label || task.status}
                                          </Badge>
                                          <Badge className={cn("text-[10px] md:text-xs border", priorityConfig[task.priority as keyof typeof priorityConfig]?.color)}>
                                            {priorityConfig[task.priority as keyof typeof priorityConfig]?.icon}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
