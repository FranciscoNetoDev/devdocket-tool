import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Loader2, FileText, Plus, Calendar, CalendarDays, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ManageSprintStoriesDialog from "./ManageSprintStoriesDialog";
import SprintCalendarView from "./SprintCalendarView";

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
  user_story_id: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  projects: {
    name: string;
    key: string;
  };
  task_assignees: Array<{
    user_id: string;
    profiles: {
      full_name: string | null;
      nickname: string | null;
    } | null;
  }>;
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
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function SprintDetailView({ sprint, onBack, onNavigate, hasNext = false, hasPrev = false }: SprintDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  useEffect(() => {
    fetchSprintData();
  }, [sprint.id]);

  const fetchSprintData = async () => {
    try {
      setLoading(true);

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

      // Fetch all tasks for these user stories
      if (storiesData.length > 0) {
        const storyIds = storiesData.map(s => s.id);
        
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          priority,
          user_story_id,
          project_id,
          due_date,
          estimated_hours,
          actual_hours,
          projects:project_id (name, key)
        `)
        .in("user_story_id", storyIds)
        .is("deleted_at", null)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;
        
        // Fetch assignees for all tasks
        const tasksWithAssignees = await Promise.all(
          (tasksData || []).map(async (task: any) => {
            const { data: assignees } = await supabase
              .from("task_assignees")
              .select(`
                user_id,
                profiles:user_id (
                  full_name,
                  nickname
                )
              `)
              .eq("task_id", task.id);
            
            return {
              ...task,
              task_assignees: assignees || []
            };
          })
        );
        
        setTasks(tasksWithAssignees);
      } else {
        setTasks([]);
      }
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

  const calculateSprintCapacity = () => {
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const usedHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const days = differenceInDays(endDate, startDate) + 1;

    return {
      days,
      totalCapacity: totalHours,
      usedPoints: usedHours,
      remaining: Math.max(0, totalHours - usedHours),
      percentage: totalHours > 0 ? (usedHours / totalHours) * 100 : 0,
    };
  };

  const capacity = calculateSprintCapacity();

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {onNavigate && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{sprint.name}</h2>
          {sprint.goal && (
            <p className="text-muted-foreground">{sprint.goal}</p>
          )}
        </div>
        <Button onClick={() => setManageDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Gerenciar User Stories
        </Button>
      </div>

      {/* Capacity Card */}
      <Card className={capacity.usedPoints > capacity.totalCapacity ? "border-destructive" : "border-primary"}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Capacidade da Sprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{capacity.days}</div>
                <div className="text-sm text-muted-foreground">dias</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{capacity.totalCapacity.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">horas total</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${capacity.usedPoints > capacity.totalCapacity ? 'text-destructive' : 'text-primary'}`}>
                  {capacity.usedPoints.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">horas usadas</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${capacity.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {capacity.remaining.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">horas restantes</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilização</span>
                <span className={capacity.percentage > 100 ? "text-destructive font-bold" : "font-medium"}>
                  {capacity.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    capacity.percentage > 100 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(capacity.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Média de {capacity.totalCapacity / capacity.days} pontos por dia
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stories">
        <TabsList>
          <TabsTrigger value="stories">
            <FileText className="mr-2 h-4 w-4" />
            User Stories ({userStories.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <SprintCalendarView
            startDate={sprint.start_date}
            endDate={sprint.end_date}
            userStories={userStories}
            tasks={tasks}
          />
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          {userStories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">Nenhuma user story nesta sprint</p>
                <Button onClick={() => setManageDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar User Stories
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userStories.map((story) => {
                const storyTasks = tasks.filter(task => task.user_story_id === story.id);
                
                return (
                  <Card key={story.id} className="border-l-4 border-l-blue-400">
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
                            <Badge variant="outline" className="font-bold">{story.story_points} pts</Badge>
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
                    
                    {storyTasks.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Tasks ({storyTasks.length})
                          </div>
                          {storyTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1">{task.title}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {task.estimated_hours && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Est: {task.estimated_hours}h</span>
                                      </div>
                                    )}
                                    {task.actual_hours && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Real: {task.actual_hours}h</span>
                                      </div>
                                    )}
                                    {task.due_date && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                                      </div>
                                    )}
                                    {task.task_assignees && task.task_assignees.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{task.task_assignees.map(a => a.profiles?.nickname || a.profiles?.full_name || "Sem nome").join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={statusColors[task.status]} variant="secondary">
                                    {task.status === 'todo' ? 'A Fazer' : 
                                     task.status === 'in_progress' ? 'Em Progresso' : 
                                     task.status === 'done' ? 'Concluído' : 'Bloqueado'}
                                  </Badge>
                                  <Badge className={priorityColors[task.priority]} variant="secondary">
                                    {task.priority === 'low' ? 'Baixa' : 
                                     task.priority === 'medium' ? 'Média' : 
                                     task.priority === 'high' ? 'Alta' : 'Crítica'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ManageSprintStoriesDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        sprint={sprint}
        onSuccess={fetchSprintData}
      />
    </div>
  );
}
