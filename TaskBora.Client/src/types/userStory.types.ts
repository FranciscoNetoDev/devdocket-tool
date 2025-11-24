import { TaskPriority } from "./task.types";

export interface UserStory {
  id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  story_points: number | null;
  priority: TaskPriority;
  status: string;
  due_date: string | null;
  project_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserStoryAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploaded_by: string;
  user_story_id: string;
}

export interface UserStoryComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user_story_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
