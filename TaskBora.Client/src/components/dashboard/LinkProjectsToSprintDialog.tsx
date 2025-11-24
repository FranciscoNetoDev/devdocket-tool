import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link } from "lucide-react";
import { toast } from "sonner";
import { ProjectWithMembers } from "@/types/project.types";
import { ProjectService } from "@/services/projectService";

interface LinkProjectsToSprintDialogProps {
  sprintId: string;
  sprintName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function LinkProjectsToSprintDialog({
  sprintId,
  sprintName,
  open,
  onOpenChange,
  onSuccess,
}: LinkProjectsToSprintDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, sprintId]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch user's projects
      const userProjects = await ProjectService.getUserProjects(user.id);
      setProjects(userProjects);

      // Fetch already linked projects
      const { data: sprintProjects, error } = await supabase
        .from("sprint_projects")
        .select("project_id")
        .eq("sprint_id", sprintId);

      if (error) throw error;

      const linked = sprintProjects?.map((sp) => sp.project_id) || [];
      setLinkedProjects(linked);
      setSelectedProjects(linked);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Projects to add
      const toAdd = selectedProjects.filter((id) => !linkedProjects.includes(id));
      // Projects to remove
      const toRemove = linkedProjects.filter((id) => !selectedProjects.includes(id));

      // Add new links
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from("sprint_projects")
          .insert(toAdd.map((projectId) => ({ sprint_id: sprintId, project_id: projectId })));

        if (addError) throw addError;
      }

      // Remove unselected links
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("sprint_projects")
          .delete()
          .eq("sprint_id", sprintId)
          .in("project_id", toRemove);

        if (removeError) throw removeError;
      }

      toast.success("Projetos vinculados com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error linking projects:", error);
      toast.error("Erro ao vincular projetos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vincular Projetos à Sprint</DialogTitle>
          <DialogDescription>
            Selecione os projetos que fazem parte da sprint "{sprintName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum projeto encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {project.key}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Link className="mr-2 h-4 w-4" />
              Salvar Vínculos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
