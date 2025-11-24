import { differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const getDueDateStatus = (dueDate: string | null): string => {
  if (!dueDate) return "";
  
  const days = differenceInDays(new Date(dueDate), new Date());
  if (days < 0) return " (atrasado)";
  if (days === 0) return " (hoje)";
  if (days <= 7) return ` (${days} dias)`;
  return "";
};

export const formatRelativeDate = (date: string): string => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("pt-BR");
};
