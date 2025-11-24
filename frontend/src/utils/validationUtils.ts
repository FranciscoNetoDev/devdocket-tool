import { DAILY_CAPACITY } from "@/constants/taskConstants";
import { DailyPointsInfo } from "@/types/task.types";

export const validateDailyCapacity = (
  dailyPointsInfo: DailyPointsInfo | null,
  estimatedHours: string,
  dueDate: string
): { valid: boolean; error?: string } => {
  if (!dailyPointsInfo || !estimatedHours || !dueDate) {
    return { valid: true };
  }

  const newHours = parseFloat(estimatedHours);
  if (isNaN(newHours)) {
    return { valid: true };
  }

  if (dailyPointsInfo.daysNeeded === 1 && dailyPointsInfo.currentDayPoints + newHours > DAILY_CAPACITY) {
    return {
      valid: false,
      error: `Limite de ${DAILY_CAPACITY}pts/dia excedido! Dia ${new Date(dueDate).toLocaleDateString('pt-BR')} já tem ${dailyPointsInfo.currentDayPoints}pts alocados. Você pode alocar no máximo ${DAILY_CAPACITY - dailyPointsInfo.currentDayPoints}pts neste dia.`,
    };
  }

  if (dailyPointsInfo.daysNeeded > 1) {
    return {
      valid: false,
      error: `Esta task de ${newHours}pts não cabe no dia ${new Date(dueDate).toLocaleDateString('pt-BR')} (já tem ${dailyPointsInfo.currentDayPoints}pts). Escolha uma data com mais disponibilidade ou reduza as horas estimadas.`,
    };
  }

  return { valid: true };
};

export const validateTaskForm = (
  title: string,
  userStoryId: string | null
): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: "Preencha o título" };
  }

  if (!userStoryId) {
    return { valid: false, error: "Selecione uma user story" };
  }

  return { valid: true };
};
