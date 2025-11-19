import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
}

interface UserStory {
  id: string;
  title: string;
  story_points: number | null;
  priority: string;
  status: string;
}

interface SprintCalendarViewProps {
  startDate: string;
  endDate: string;
  userStories: UserStory[];
  tasks: Task[];
}

const DAILY_CAPACITY = 8;

export default function SprintCalendarView({
  startDate,
  endDate,
  userStories,
  tasks,
}: SprintCalendarViewProps) {
  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return eachDayOfInterval({ start, end });
  }, [startDate, endDate]);

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.due_date) {
        const dateKey = format(new Date(task.due_date), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.estimated_hours || 0),
    0
  );

  const workDays = days.filter((day) => !isWeekend(day));
  const avgHoursPerDay = workDays.length > 0 ? totalHours / workDays.length : 0;

  const getDayUtilization = (dayIndex: number) => {
    // Distribuição simples: horas médias por dia útil
    if (isWeekend(days[dayIndex])) return 0;
    return avgHoursPerDay;
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  const statusColors: Record<string, string> = {
    todo: "bg-slate-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
    blocked: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{days.length}</div>
            <p className="text-xs text-muted-foreground">
              {workDays.length} dias úteis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStories.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalHours.toFixed(1)} horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasks Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.due_date).length} com data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workDays.length * DAILY_CAPACITY}</div>
            <p className="text-xs text-muted-foreground">
              {DAILY_CAPACITY} pts/dia útil
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário da Sprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Header - Days of week */}
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for alignment */}
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {days.map((day, index) => {
              const isWeekendDay = isWeekend(day);
              const utilization = getDayUtilization(index);
              const isOverCapacity = utilization > DAILY_CAPACITY;
              const utilizationPercent = (utilization / DAILY_CAPACITY) * 100;
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[dateKey] || [];

              return (
                <Card
                  key={day.toISOString()}
                  className={`${
                    isWeekendDay ? "bg-muted/50" : ""
                  } ${isOverCapacity ? "border-destructive" : ""} ${dayTasks.length > 0 ? "min-h-[120px]" : ""}`}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold">
                        {format(day, "d")}
                      </span>
                      {!isWeekendDay && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isOverCapacity ? "border-destructive text-destructive" : ""
                          }`}
                        >
                          {utilization.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {format(day, "MMM", { locale: ptBR })}
                    </div>

                    {!isWeekendDay && (
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isOverCapacity ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(utilizationPercent, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          {utilizationPercent.toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Tasks do dia */}
                    {dayTasks.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="text-xs p-1.5 rounded border bg-background/80 hover:bg-background transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColors[task.status]}`}
                              />
                              <span className="truncate flex-1">{task.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Stories List */}
      <Card>
        <CardHeader>
          <CardTitle>User Stories da Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userStories.map((story) => (
              <div
                key={story.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{story.title}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={priorityColors[story.priority]}>
                      {story.priority === "low"
                        ? "Baixa"
                        : story.priority === "medium"
                        ? "Média"
                        : story.priority === "high"
                        ? "Alta"
                        : "Crítica"}
                    </Badge>
                    {story.story_points && (
                      <Badge variant="outline" className="font-bold">
                        {story.story_points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
