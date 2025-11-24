export const DAILY_CAPACITY = 8;

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const STATUS_LABELS: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  done: "Concluído",
  blocked: "Bloqueado",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export const STORY_POINTS_OPTIONS = [
  { value: "1", label: "1 - Muito Simples" },
  { value: "2", label: "2 - Simples" },
  { value: "3", label: "3 - Médio" },
  { value: "5", label: "5 - Complexo" },
  { value: "8", label: "8 - Muito Complexo" },
  { value: "13", label: "13 - Extremamente Complexo" },
];

export const USER_STORY_STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "ready", label: "Pronta" },
  { value: "in_progress", label: "Em Progresso" },
  { value: "done", label: "Concluída" },
];
