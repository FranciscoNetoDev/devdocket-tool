import { Database } from "@/integrations/supabase/types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
  project_id: string;
  user_story_id: string;
  sprint_id: string | null;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
}

export interface DailyPointsInfo {
  currentDayPoints: number;
  daysNeeded: number;
  distribution: Array<{ date: string; points: number }>;
}
