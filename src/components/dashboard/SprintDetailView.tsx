import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, CheckSquare, FileText } from "lucide-react";
import { toast } from "sonner";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  projects: {
    name: string;
    key: string;
  };
}

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

interface SprintDetailViewProps {
  sprint: Sprint;
  onBack: () => void;
}

export default function SprintDetailView({ sprint, onBack }: SprintDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);

  useEffect(() => {
    fetchSprintData();
  }, [sprint.id]);

  const fetchSprintData = async () => {
    try {
      setLoading(true);

      // Fetch tasks in this sprint
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          priority,
          project_id,
          projects:project_id (name, key)
        `)
        .eq("sprint_id", sprint.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch user stories in this sprint via junction table
      const { data: sprintStories, error: storiesError } = await supabase
        .from("sprint_user_stories")
        .select(`
          user_story_id,
          user_stories:user_story_id (
            id,
            title,
            status,
            priority,
            story_points,
            project_id,
            projects:project_id (name, key)
          )
        `)
        .eq("sprint_id", sprint.id);

      if (storiesError) throw storiesError;
      
      const storiesData = sprintStories?.map(s => s.user_stories).filter(Boolean) || [];
      setUserStories(storiesData as any);

    } catch (error: any) {
      console.error("Error fetching sprint data:", error);
      toast.error("Erro ao carregar dados da sprint");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    todo: "bg-gray-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
    blocked: "bg-red-500",
    draft: "bg-gray-500",
    ready: "bg-blue-500",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{sprint.name}</h2>
          {sprint.goal && (
            <p className="text-muted-foreground">{sprint.goal}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="stories">
            <FileText className="mr-2 h-4 w-4" />
            User Stories ({userStories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhuma task nesta sprint</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.projects?.key} • {task.projects?.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={statusColors[task.status]}>
                          {task.status === 'todo' ? 'A Fazer' : 
                           task.status === 'in_progress' ? 'Em Progresso' : 
                           task.status === 'done' ? 'Concluído' : 'Bloqueado'}
                        </Badge>
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority === 'low' ? 'Baixa' : 
                           task.priority === 'medium' ? 'Média' : 
                           task.priority === 'high' ? 'Alta' : 'Crítica'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          {userStories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhuma user story nesta sprint</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userStories.map((story) => (
                <Card key={story.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{story.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {story.projects?.key} • {story.projects?.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {story.story_points && (
                          <Badge variant="outline">{story.story_points} pts</Badge>
                        )}
                        <Badge className={statusColors[story.status]}>
                          {story.status === 'draft' ? 'Rascunho' : 
                           story.status === 'ready' ? 'Pronta' : 
                           story.status === 'in_progress' ? 'Em Progresso' : 'Concluída'}
                        </Badge>
                        <Badge className={priorityColors[story.priority]}>
                          {story.priority === 'low' ? 'Baixa' : 
                           story.priority === 'medium' ? 'Média' : 
                           story.priority === 'high' ? 'Alta' : 'Crítica'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
