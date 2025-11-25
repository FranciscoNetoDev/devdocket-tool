import { DAILY_CAPACITY } from "@/constants/taskConstants";
import { TaskService } from "@/services/taskService";
import { DailyPointsInfo } from "@/types/task.types";

export const calculateDailyPoints = async (
  selectedDate: string,
  hours: number,
  projectId: string,
  currentTaskId?: string | null
): Promise<DailyPointsInfo | null> => {
  try {
    const projectTasks = await TaskService.getProjectTasks(projectId);

    const tasksOnDate = (projectTasks || []).filter(
      (t) => t.id !== currentTaskId && (t as any).due_date === selectedDate
    );

    const currentDayPoints = tasksOnDate.reduce(
      (sum, t: any) => sum + (t.estimated_hours || 0),
      0
    );
    const availableToday = Math.max(0, DAILY_CAPACITY - currentDayPoints);

    const distribution: Array<{ date: string; points: number }> = [];
    let remainingHours = hours;
    let currentDate = new Date(selectedDate);

    while (remainingHours > 0) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const tasksOnThisDate = (projectTasks || []).filter(
        (t: any) => t.id !== currentTaskId && t.due_date === dateStr
      );
      const pointsOnThisDate = tasksOnThisDate.reduce(
        (sum: number, t: any) => sum + (t.estimated_hours || 0),
        0
      );
      const availableOnThisDate = Math.max(0, DAILY_CAPACITY - pointsOnThisDate);

      const pointsToAllocate = Math.min(remainingHours, availableOnThisDate);

      if (pointsToAllocate > 0) {
        distribution.push({
          date: dateStr,
          points: pointsToAllocate,
        });
        remainingHours -= pointsToAllocate;
      }

      currentDate.setDate(currentDate.getDate() + 1);

      if (distribution.length >= 30) break;
    }

    return {
      currentDayPoints,
      daysNeeded: distribution.length,
      distribution,
    };
  } catch (error: any) {
    console.error("Error calculating daily points:", error);
    return null;
  }
};
