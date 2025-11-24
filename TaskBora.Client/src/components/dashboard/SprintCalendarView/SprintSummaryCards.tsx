import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAILY_CAPACITY } from "@/constants/taskConstants";

interface SprintSummaryCardsProps {
  totalDays: number;
  workDays: number;
  userStoriesCount: number;
  totalHours: number;
  tasksCount: number;
  tasksWithDateCount: number;
}

export default function SprintSummaryCards({
  totalDays,
  workDays,
  userStoriesCount,
  totalHours,
  tasksCount,
  tasksWithDateCount,
}: SprintSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDays}</div>
          <p className="text-xs text-muted-foreground">
            {workDays} dias úteis
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
          <div className="text-2xl font-bold">{userStoriesCount}</div>
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
          <div className="text-2xl font-bold">{tasksCount}</div>
          <p className="text-xs text-muted-foreground">
            {tasksWithDateCount} com data
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
          <div className="text-2xl font-bold">{workDays * DAILY_CAPACITY}h</div>
          <p className="text-xs text-muted-foreground">
            {DAILY_CAPACITY}h/dia útil
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
