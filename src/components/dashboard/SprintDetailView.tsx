import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Loader2, FileText, Plus, Calendar, CalendarDays, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format, eachDayOfInterval, isWeekend, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import ManageSprintStoriesDialog from "./ManageSprintStoriesDialog";
import SprintCalendarView from "./SprintCalendarView";
import RetrospectiveDialog from "../project/RetrospectiveDialog";
import RetrospectiveView from "../project/RetrospectiveView";

// Feriados nacionais brasileiros de 2024-2026 (pode ser expandido)
const brazilianHolidays = [
  // 2024
  "2024-01-01", // Ano Novo
  "2024-02-13", // Carnaval
  "2024-03-29", // Sexta-feira Santa
  "2024-04-21", // Tiradentes
  "2024-05-01", // Dia do Trabalho
  "2024-05-30", // Corpus Christi
  "2024-09-07", // Independência
  "2024-10-12", // Nossa Senhora Aparecida
  "2024-11-02", // Finados
  "2024-11-15", // Proclamação da República
  "2024-11-20", // Consciência Negra
  "2024-12-25", // Natal
  // 2025
  "2025-01-01",
  "2025-03-04", // Carnaval
  "2025-04-18", // Sexta-feira Santa
  "2025-04-21",
  "2025-05-01",
  "2025-06-19", // Corpus Christi
  "2025-09-07",
  "2025-10-12",
  "2025-11-02",
  "2025-11-15",
  "2025-11-20",
  "2025-12-25",
  // 2026
  "2026-01-01",
  "2026-02-17", // Carnaval
  "2026-04-03", // Sexta-feira Santa
  "2026-04-21",
  "2026-05-01",
  "2026-06-04", // Corpus Christi
  "2026-09-07",
  "2026-10-12",
  "2026-11-02",
  "2026-11-15",
  "2026-11-20",
  "2026-12-25",
];

const isHoliday = (date: Date): boolean => {
  const dateStr = format(date, "yyyy-MM-dd");
  return brazilianHolidays.includes(dateStr);
};

const countBusinessDays = (startDate: Date, endDate: Date): number => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isWeekend(day) && !isHoliday(day)).length;
};

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
  const [retroDialogOpen, setRetroDialogOpen] = useState(false);

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
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const today = new Date();
    
    // Calcular dias totais e dias úteis
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const businessDays = countBusinessDays(startDate, endDate);
    
    // Capacidade baseada em dias úteis (8 horas por dia útil)
    const totalCapacity = businessDays * 8;
    
    const allocatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const actualHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
    
    // Dias úteis restantes
    const businessDaysRemaining = countBusinessDays(today, endDate);

    return {
      totalDays,
      businessDays,
      totalCapacity,
      allocatedHours,
      actualHours,
      available: Math.max(0, totalCapacity - allocatedHours),
      businessDaysRemaining: Math.max(0, businessDaysRemaining),
      percentage: totalCapacity > 0 ? (allocatedHours / totalCapacity) * 100 : 0,
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
    <div className="space-y-4 pb-4">
      {/* Header - Mobile Optimized */}
      <div className="space-y-3">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Voltar</span>
          </Button>
          {onNavigate && (
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate('prev')}
                disabled={!hasPrev}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
                className="shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Title and Goal */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold break-words">{sprint.name}</h2>
          {sprint.goal && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">{sprint.goal}</p>
          )}
        </div>

        {/* Action Button - Full Width on Mobile */}
        <Button 
          onClick={() => setManageDialogOpen(true)} 
          className="w-full sm:w-auto"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Gerenciar User Stories</span>
          <span className="sm:hidden">Gerenciar Stories</span>
        </Button>
      </div>

      {/* Capacity Card - Mobile Optimized */}
      <Card className={capacity.allocatedHours > capacity.totalCapacity ? "border-destructive" : "border-primary"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Capacidade (Dias Úteis)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mobile: 2 columns, Desktop: 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{capacity.businessDays}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">dias úteis</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{capacity.totalCapacity}h</div>
                <div className="text-xs sm:text-sm text-muted-foreground">hrs total</div>
              </div>
              <div>
                <div className={`text-2xl sm:text-3xl font-bold ${capacity.allocatedHours > capacity.totalCapacity ? 'text-destructive' : 'text-primary'}`}>
                  {capacity.allocatedHours.toFixed(1)}h
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">hrs alocadas</div>
              </div>
              <div>
                <div className={`text-2xl sm:text-3xl font-bold ${capacity.available < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {capacity.available.toFixed(1)}h
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">hrs disponíveis</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className={`text-2xl sm:text-3xl font-bold ${capacity.businessDaysRemaining === 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                  {capacity.businessDaysRemaining}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">dias úteis restantes</div>
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
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    capacity.percentage > 100 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(capacity.percentage, 100)}%` }}
                />
              </div>
            </div>

            {capacity.allocatedHours > capacity.totalCapacity && (
              <div className="text-xs sm:text-sm text-destructive font-medium p-2 bg-destructive/10 rounded">
                ⚠️ Capacidade excedida em {(capacity.allocatedHours - capacity.totalCapacity).toFixed(1)}h
              </div>
            )}
            
            {/* Info sobre dias úteis */}
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              📅 Sprint: {capacity.totalDays} dias totais • {capacity.businessDays} dias úteis (sem finais de semana e feriados)
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stories" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="stories" className="flex-col sm:flex-row gap-1 py-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Stories <span className="hidden sm:inline">({userStories.length})</span></span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-col sm:flex-row gap-1 py-2">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="retrospectives" className="flex-col sm:flex-row gap-1 py-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Retros</span>
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

        <TabsContent value="retrospectives" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setRetroDialogOpen(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Retrospectiva</span>
              <span className="sm:hidden">Nova Retro</span>
            </Button>
          </div>
          <RetrospectiveView sprintId={sprint.id} />
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
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base break-words">{story.title}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                            {story.projects?.key} • {story.projects?.name}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {story.story_points && (
                            <Badge variant="outline" className="font-bold text-xs">{story.story_points} pts</Badge>
                          )}
                          <Badge className={`${statusColors[story.status]} text-xs`}>
                            {story.status === 'draft' ? 'Rascunho' : 
                             story.status === 'ready' ? 'Pronta' : 
                             story.status === 'in_progress' ? 'Em Progresso' : 'Concluída'}
                          </Badge>
                          <Badge className={`${priorityColors[story.priority]} text-xs`}>
                            {story.priority === 'low' ? 'Baixa' : 
                             story.priority === 'medium' ? 'Média' : 
                             story.priority === 'high' ? 'Alta' : 'Crítica'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {storyTasks.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                            Tasks ({storyTasks.length})
                          </div>
                          {storyTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex flex-col gap-2 p-3 sm:p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium mb-1 break-words">{task.title}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {task.estimated_hours && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span>Est: {task.estimated_hours}h</span>
                                      </div>
                                    )}
                                    {task.actual_hours && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span>Real: {task.actual_hours}h</span>
                                      </div>
                                    )}
                                    {task.due_date && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        <span>{format(new Date(task.due_date), "dd/MM/yy", { locale: ptBR })}</span>
                                      </div>
                                    )}
                                    {task.task_assignees && task.task_assignees.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{task.task_assignees.map(a => a.profiles?.nickname || a.profiles?.full_name || "Sem nome").join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={`${statusColors[task.status]} text-xs`} variant="secondary">
                                    {task.status === 'todo' ? 'A Fazer' : 
                                     task.status === 'in_progress' ? 'Em Progresso' : 
                                     task.status === 'done' ? 'Concluído' : 'Bloqueado'}
                                  </Badge>
                                  <Badge className={`${priorityColors[task.priority]} text-xs`} variant="secondary">
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

      <RetrospectiveDialog
        open={retroDialogOpen}
        onOpenChange={setRetroDialogOpen}
        sprintId={sprint.id}
        onSuccess={() => {
          setRetroDialogOpen(false);
          // Force refresh of retrospectives view
        }}
      />
    </div>
  );
}
