import { supabase } from "@/integrations/supabase/client";
import { DAILY_CAPACITY } from "@/constants/taskConstants";
import { DailyPointsInfo } from "@/types/task.types";

export const calculateDailyPoints = async (
  selectedDate: string,
  hours: number,
  projectId: string,
  currentTaskId?: string | null
): Promise<DailyPointsInfo | null> => {
  try {
    // Buscar todas as tasks do projeto com due_date
    const { data: projectTasks, error } = await supabase
      .from("tasks")
      .select("id, estimated_hours, due_date")
      .eq("project_id", projectId)
      .not("due_date", "is", null)
      .is("deleted_at", null);

    if (error) throw error;

    // Calcular pontos já alocados no dia selecionado (excluindo a task atual)
    const tasksOnDate = (projectTasks || []).filter(
      (t) => t.id !== currentTaskId && t.due_date === selectedDate
    );

    const currentDayPoints = tasksOnDate.reduce(
      (sum, t) => sum + (t.estimated_hours || 0),
      0
    );
    const availableToday = Math.max(0, DAILY_CAPACITY - currentDayPoints);

    // Calcular distribuição se exceder 8pts
    const distribution: Array<{ date: string; points: number }> = [];
    let remainingHours = hours;
    let currentDate = new Date(selectedDate);

    while (remainingHours > 0) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Calcular pontos já alocados neste dia
      const tasksOnThisDate = (projectTasks || []).filter(
        (t) => t.id !== currentTaskId && t.due_date === dateStr
      );
      const pointsOnThisDate = tasksOnThisDate.reduce(
        (sum, t) => sum + (t.estimated_hours || 0),
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

      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);

      // Limite de segurança: não calcular mais de 30 dias
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
