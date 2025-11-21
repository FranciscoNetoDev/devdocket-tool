import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DAILY_CAPACITY, STATUS_COLORS } from "@/constants/taskConstants";

interface Task {
  id: string;
  title: string;
  status: string;
}

interface CalendarDayProps {
  day: Date;
  isWeekend: boolean;
  utilization: number;
  tasks: Task[];
}

export default function CalendarDay({
  day,
  isWeekend,
  utilization,
  tasks,
}: CalendarDayProps) {
  const isOverCapacity = utilization > DAILY_CAPACITY;
  const utilizationPercent = (utilization / DAILY_CAPACITY) * 100;

  return (
    <Card
      className={`${isWeekend ? "bg-muted/50" : ""} ${
        isOverCapacity ? "border-destructive" : ""
      }`}
    >
      <CardContent className="p-2 space-y-1.5 min-h-[100px] flex flex-col">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">{format(day, "d")}</span>
          <div className="text-[10px] text-muted-foreground">
            {format(day, "MMM", { locale: ptBR })}
          </div>
        </div>

        {/* Tasks do dia */}
        {tasks.length > 0 && (
          <div className="space-y-1 flex-1">
            {tasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className="text-[10px] p-1 rounded border bg-background/80 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-1">
                  <div
                    className={`w-1 h-1 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status]}`}
                  />
                  <span className="truncate flex-1 leading-tight">
                    {task.title}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length > 2 && (
              <div className="text-[10px] text-center text-muted-foreground">
                +{tasks.length - 2}
              </div>
            )}
          </div>
        )}

        {/* Footer com horas e utilização */}
        {!isWeekend && (
          <div className="space-y-1 mt-auto pt-1 border-t">
            <div className="flex items-center justify-center">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 whitespace-nowrap ${
                  isOverCapacity ? "border-destructive text-destructive" : ""
                }`}
              >
                {utilization.toFixed(1)}h
              </Badge>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOverCapacity ? "bg-destructive" : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(utilizationPercent, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
