import { useState, useEffect } from "react";
import { ProjectWithMembers } from "@/types/project.types";
import { ProjectService } from "@/services/projectService";
import { toast } from "sonner";

export const useProjects = (userId: string | undefined) => {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await ProjectService.getUserProjects(userId);
      setProjects(data);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos");
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  const deleteProject = async (projectId: string) => {
    try {
      await ProjectService.deleteProject(projectId);
      toast.success("Projeto deletado com sucesso!");
      fetchProjects();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Erro ao deletar projeto");
    }
  };

  return {
    projects,
    loading,
    fetchProjects,
    deleteProject,
  };
};
