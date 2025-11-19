import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import IconPicker from "./IconPicker";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  due_date: string | null;
  icon_name?: string | null;
}

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    due_date: project.due_date || "",
    icon_name: project.icon_name || "folder-kanban",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("O nome do projeto é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
          icon_name: formData.icon_name,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Projeto atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error("Erro ao atualizar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>
            Atualize as informações do projeto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Chave do Projeto</Label>
            <Input
              id="key"
              value={project.key}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              A chave do projeto não pode ser alterada
            </p>
          </div>

          <IconPicker
            value={formData.icon_name}
            onChange={(icon_name) => 
              setFormData((prev) => ({ ...prev, icon_name }))
            }
            label="Ícone do Projeto"
          />

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Prazo do Projeto</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, due_date: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
