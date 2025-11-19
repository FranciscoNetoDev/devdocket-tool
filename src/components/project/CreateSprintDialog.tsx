import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateSprintDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateSprintDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CreateSprintDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error("A data final deve ser posterior à data inicial");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("sprints").insert({
        project_id: projectId,
        name: formData.name,
        goal: formData.goal || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: "planning",
      });

      if (error) throw error;

      toast.success("Sprint criada com sucesso!");
      setFormData({ name: "", goal: "", start_date: "", end_date: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating sprint:", error);
      toast.error("Erro ao criar sprint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Nova Sprint</DialogTitle>
          <DialogDescription>
            Crie uma nova sprint para organizar as tarefas do projeto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Sprint <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Sprint 1, Sprint de Login..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Meta da Sprint</Label>
            <Textarea
              id="goal"
              placeholder="Descreva o objetivo principal desta sprint..."
              value={formData.goal}
              onChange={(e) =>
                setFormData({ ...formData, goal: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Data Início <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">
                Data Fim <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
