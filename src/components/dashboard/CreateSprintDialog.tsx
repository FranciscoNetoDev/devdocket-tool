import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CreateSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateSprintDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSprintDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get user's org
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("org_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.org_id) {
        toast.error("Organização não encontrada");
        return;
      }

      const { error } = await supabase
        .from("sprints")
        .insert([{
          name: formData.name,
          goal: formData.goal || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          org_id: userRole.org_id,
          status: "planning",
        }]);

      if (error) throw error;

      toast.success("Sprint criada com sucesso!");
      setFormData({ name: "", goal: "", start_date: "", end_date: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating sprint:", error);
      toast.error("Erro ao criar sprint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Sprint</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Sprint *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sprint 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="Descreva o objetivo desta sprint..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
