import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

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
}

const DAILY_CAPACITY = 8;

export default function SprintCalendarView({
  startDate,
  endDate,
  userStories,
}: SprintCalendarViewProps) {
  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return eachDayOfInterval({ start, end });
  }, [startDate, endDate]);

  const totalPoints = userStories.reduce(
    (sum, story) => sum + (story.story_points || 0),
    0
  );

  const workDays = days.filter((day) => !isWeekend(day));
  const avgPointsPerDay = workDays.length > 0 ? totalPoints / workDays.length : 0;

  const getDayUtilization = (dayIndex: number) => {
    // Distribuição simples: pontos médios por dia útil
    if (isWeekend(days[dayIndex])) return 0;
    return avgPointsPerDay;
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
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
              Capacidade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workDays.length * DAILY_CAPACITY}</div>
            <p className="text-xs text-muted-foreground">
              {DAILY_CAPACITY} pts/dia útil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pontos Alocados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              {userStories.length} user stories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPointsPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              pts/dia útil
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

              return (
                <Card
                  key={day.toISOString()}
                  className={`${
                    isWeekendDay ? "bg-muted/50" : ""
                  } ${isOverCapacity ? "border-destructive" : ""}`}
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
