import { apiFetch } from "@/lib/apiClient";
import { Project, ProjectMember, ProjectWithMembers } from "@/types/project.types";

export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
}

const mapProjectDto = (project: any): ProjectWithMembers => {
  const id = project.id ?? project.Id;
  const name = project.name ?? project.Name ?? "Projeto";
  const description = project.description ?? project.Description ?? null;

  return {
    id,
    name,
    description,
    key: project.key ?? project.Key ?? name.substring(0, 3).toUpperCase(),
    created_at: project.created_at ?? new Date().toISOString(),
    updated_at: project.updated_at ?? new Date().toISOString(),
    due_date: project.due_date ?? null,
    icon_name: project.icon_name ?? null,
    created_by: project.created_by ?? "",
    org_id: project.org_id ?? "",
    project_members: project.project_members ?? [],
  } as ProjectWithMembers;
};

export class ProjectService {
  static async getProjectById(projectId: string, _userId: string): Promise<Project | null> {
    const project = await apiFetch<ApiProject>(`api/projects/${projectId}`);
    return project ? mapProjectDto(project) : null;
  }

  static async getUserProjects(userId: string): Promise<ProjectWithMembers[]> {
    const data = await apiFetch<ApiProject[]>(`api/projects/user/${userId}`);

    const projectsWithMembers = await Promise.all(
      (data || []).map(async (project: any) => {
        const members = project.project_members ?? (await this.getProjectMembers(project.id));
        return {
          ...mapProjectDto(project),
          project_members: members,
        } as ProjectWithMembers;
      })
    );

    return projectsWithMembers;
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await apiFetch<ProjectMember[]>(`api/projects/${projectId}/members`);
    return members || [];
  }

  static async deleteProject(projectId: string): Promise<void> {
    await apiFetch(`api/projects/${projectId}`, {
      method: "DELETE",
    });
  }
}
