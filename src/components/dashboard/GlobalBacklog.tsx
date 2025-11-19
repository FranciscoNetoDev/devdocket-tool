import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronDown, FolderOpen, FileText, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  key: string;
}

interface UserStory {
  id: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  project_id: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  user_story_id: string | null;
}

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const statusColors = {
  todo: "bg-gray-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
  draft: "bg-gray-500",
  ready: "bg-blue-500",
};

const statusLabels = {
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

interface ProjectData {
  project: Project;
  userStories: UserStory[];
  tasks: Task[];
}

export default function GlobalBacklog() {
  const { user } = useAuth();
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    try {
      setLoading(true);

      // Get all projects user has access to
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, key")
        .order("name");

      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setProjectsData([]);
        return;
      }

      const projectIds = projects.map(p => p.id);

      // Get user stories without sprint
      const { data: userStories, error: storiesError } = await supabase
        .from("user_stories")
        .select("id, title, status, priority, story_points, project_id")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      if (storiesError) throw storiesError;

      // Check which user stories are NOT in any sprint
      const storyIds = userStories?.map(s => s.id) || [];
      
      const { data: sprintStories } = await supabase
        .from("sprint_user_stories")
        .select("user_story_id")
        .in("user_story_id", storyIds);

      const storiesInSprint = new Set(sprintStories?.map(s => s.user_story_id) || []);
      const storiesWithoutSprint = userStories?.filter(s => !storiesInSprint.has(s.id)) || [];

      // Get tasks for these user stories
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, user_story_id")
        .in("user_story_id", storyIds)
        .is("deleted_at", null);

      if (tasksError) throw tasksError;

      // Group data by project
      const projectsDataMap: Map<string, ProjectData> = new Map();
      
      projects.forEach(project => {
        const projectStories = storiesWithoutSprint.filter(s => s.project_id === project.id);
        const projectTasks = tasks?.filter(t => 
          projectStories.some(s => s.id === t.user_story_id)
        ) || [];

        if (projectStories.length > 0) {
          projectsDataMap.set(project.id, {
            project,
            userStories: projectStories,
            tasks: projectTasks,
          });
        }
      });

      setProjectsData(Array.from(projectsDataMap.values()));
    } catch (error: any) {
      console.error("Error fetching backlog:", error);
      toast.error("Erro ao carregar backlog");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
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
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
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
          User Stories e Tasks sem sprint - Hierarquia Projeto → User Story → Task
        </p>
      </div>

      {projectsData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum item no backlog</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie User Stories nos projetos para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projectsData.map(({ project, userStories, tasks }) => {
            const isProjectExpanded = expandedProjects.has(project.id);
            const taskCount = tasks.length;
            
            return (
              <div key={project.id} className="space-y-1">
                {/* Project Level */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader 
                    className="py-4 cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProject(project.id);
                        }}
                      >
                        {isProjectExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {project.key}
                          </Badge>
                          <CardTitle className="text-base">{project.name}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userStories.length} User {userStories.length === 1 ? 'Story' : 'Stories'} • {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* User Stories Level */}
                {isProjectExpanded && (
                  <div className="ml-8 space-y-1">
                    {userStories.map(story => {
                      const isStoryExpanded = expandedStories.has(story.id);
                      const storyTasks = tasks.filter(t => t.user_story_id === story.id);
                      
                      return (
                        <div key={story.id} className="space-y-1">
                          <Card className="hover:shadow-sm transition-shadow">
                            <CardHeader 
                              className="py-3 cursor-pointer"
                              onClick={() => toggleStory(story.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStory(story.id);
                                  }}
                                >
                                  {isStoryExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{story.title}</span>
                                    {story.story_points && (
                                      <Badge variant="outline" className="text-xs">
                                        {story.story_points} pts
                                      </Badge>
                                    )}
                                    <Badge className={cn("text-xs", statusColors[story.status as keyof typeof statusColors])}>
                                      {statusLabels[story.status as keyof typeof statusLabels]}
                                    </Badge>
                                    <Badge className={cn("text-xs", priorityColors[story.priority as keyof typeof priorityColors])}>
                                      {priorityLabels[story.priority as keyof typeof priorityLabels]}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {storyTasks.length} {storyTasks.length === 1 ? 'Task' : 'Tasks'}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>

                          {/* Tasks Level */}
                          {isStoryExpanded && storyTasks.length > 0 && (
                            <div className="ml-8 space-y-1">
                              {storyTasks.map(task => (
                                <Card key={task.id} className="hover:shadow-sm transition-shadow">
                                  <CardHeader className="py-2">
                                    <div className="flex items-center gap-3">
                                      <CheckSquare className="h-3 w-3 text-muted-foreground ml-1" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-medium">{task.title}</span>
                                          <Badge className={cn("text-xs h-5", statusColors[task.status as keyof typeof statusColors])}>
                                            {statusLabels[task.status as keyof typeof statusLabels]}
                                          </Badge>
                                          <Badge className={cn("text-xs h-5", priorityColors[task.priority as keyof typeof priorityColors])}>
                                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              ))}
                            </div>
                          )}

                          {isStoryExpanded && storyTasks.length === 0 && (
                            <div className="ml-8">
                              <Card>
                                <CardContent className="py-3">
                                  <p className="text-xs text-muted-foreground text-center">
                                    Nenhuma task nesta User Story
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
