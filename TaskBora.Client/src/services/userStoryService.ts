import { supabase } from "@/integrations/supabase/client";
import {
  UserStory,
  UserStoryAttachment,
  UserStoryComment,
} from "@/types/userStory.types";
import { Task } from "@/types/task.types";

export class UserStoryService {
  static async getUserStoriesByProject(
    projectId: string
  ): Promise<Pick<UserStory, "id" | "title" | "story_points" | "due_date">[]> {
    const { data, error } = await supabase
      .from("user_stories")
      .select("id, title, story_points, due_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserStoryTasks(userStoryId: string): Promise<Pick<Task, "id" | "title" | "status" | "priority">[]> {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, priority")
      .eq("user_story_id", userStoryId)
      .is("deleted_at", null);

    return data || [];
  }

  static async getUserStoryAttachments(
    userStoryId: string
  ): Promise<UserStoryAttachment[]> {
    const { data } = await supabase
      .from("user_story_attachments")
      .select("*")
      .eq("user_story_id", userStoryId)
      .order("created_at", { ascending: false });

    return data || [];
  }

  static async getUserStoryComments(
    userStoryId: string
  ): Promise<UserStoryComment[]> {
    const { data } = await supabase
      .from("user_story_comments")
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq("user_story_id", userStoryId)
      .order("created_at", { ascending: true });

    return (data as any) || [];
  }

  static async createUserStory(
    story: Omit<UserStory, "id" | "created_at" | "updated_at">
  ): Promise<void> {
    const { error } = await supabase.from("user_stories").insert([story]);

    if (error) throw error;
  }

  static async updateUserStory(
    storyId: string,
    updates: Partial<UserStory>
  ): Promise<void> {
    const { error } = await supabase
      .from("user_stories")
      .update(updates)
      .eq("id", storyId);

    if (error) throw error;
  }

  static async addComment(
    userStoryId: string,
    content: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase.from("user_story_comments").insert([
      {
        user_story_id: userStoryId,
        content,
        user_id: userId,
      },
    ]);

    if (error) throw error;
  }

  static async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from("user_story_attachments")
      .delete()
      .eq("id", attachmentId);

    if (error) throw error;
  }
}
