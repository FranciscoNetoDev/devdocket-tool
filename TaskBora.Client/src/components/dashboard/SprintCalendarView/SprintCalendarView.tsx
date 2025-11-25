import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { Calendar } from "lucide-react";
import { DAILY_CAPACITY } from "@/constants/taskConstants";
import SprintSummaryCards from "./SprintSummaryCards";
import CalendarDay from "./CalendarDay";
import UserStoriesList from "./UserStoriesList";

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
    if (isWeekend(days[dayIndex])) return 0;
    return avgHoursPerDay;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SprintSummaryCards
        totalDays={days.length}
        workDays={workDays.length}
        userStoriesCount={userStories.length}
        totalHours={totalHours}
        tasksCount={tasks.length}
        tasksWithDateCount={tasks.filter((t) => t.due_date).length}
      />

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
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate[dateKey] || [];

              return (
                <CalendarDay
                  key={day.toISOString()}
                  day={day}
                  isWeekend={isWeekendDay}
                  utilization={utilization}
                  tasks={dayTasks}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Stories List */}
      <UserStoriesList userStories={userStories} />
    </div>
  );
}
