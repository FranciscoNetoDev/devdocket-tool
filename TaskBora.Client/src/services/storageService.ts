import { supabase } from "@/integrations/supabase/client";

export class StorageService {
  static async uploadUserStoryAttachment(
    file: File,
    userId: string,
    userStoryId: string
  ): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${userStoryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("user-story-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Generate signed URL with 1 year expiration
    const { data, error: signedUrlError } = await supabase.storage
      .from("user-story-attachments")
      .createSignedUrl(filePath, 31536000);

    if (signedUrlError) throw signedUrlError;
    if (!data?.signedUrl) throw new Error("Failed to generate signed URL");

    return data.signedUrl;
  }

  static async saveAttachmentMetadata(
    userStoryId: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    fileType: string,
    uploadedBy: string
  ): Promise<void> {
    const { error } = await supabase.from("user_story_attachments").insert({
      user_story_id: userStoryId,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      file_type: fileType || "application/octet-stream",
      uploaded_by: uploadedBy,
    });

    if (error) throw error;
  }
}
