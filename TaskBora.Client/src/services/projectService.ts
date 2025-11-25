import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectWithMembers, ProjectMember } from "@/types/project.types";

export class ProjectService {
  static async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        project_members!inner(user_id)
      `)
      .eq("id", projectId)
      .eq("project_members.user_id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserProjects(userId: string): Promise<ProjectWithMembers[]> {
    // Busca os projetos do usuário
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select(`
        *,
        project_members!inner(user_id)
      `)
      .eq("project_members.user_id", userId)
      .order("created_at", { ascending: false });

    if (projectsError) throw projectsError;

    // Para cada projeto, busca os membros completos com perfis
    const projectsWithMembers = await Promise.all(
      (projectsData || []).map(async (project) => {
        const members = await this.getProjectMembers(project.id);
        return {
          ...project,
          project_members: members,
        };
      })
    );

    return projectsWithMembers;
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return [];
    }

    // Busca os perfis dos membros
    const memberIds = members.map((m) => m.user_id);

    if (memberIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, nickname, avatar_url")
      .in("id", memberIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return [];
    }

    // Combina os dados
    return members.map((member) => {
      const profile = profiles?.find((p) => p.id === member.user_id);
      return {
        user_id: member.user_id,
        profiles: profile
          ? {
              full_name: profile.full_name,
              nickname: profile.nickname,
              avatar_url: profile.avatar_url || null,
            }
          : undefined,
      };
    });
  }

  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
  }
}
