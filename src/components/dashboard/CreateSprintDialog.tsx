import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, differenceInDays, startOfDay } from "date-fns";

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
  const [duration, setDuration] = useState<"7" | "14">("14");
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (open) {
      loadLastSprintDates();
    }
  }, [open]);

  const loadLastSprintDates = async () => {
    try {
      // Get user's org
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("org_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.org_id) return;

      // Get last sprint ordered by end_date
      const { data: lastSprint } = await supabase
        .from("sprints")
        .select("end_date")
        .eq("org_id", userRole.org_id)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSprint?.end_date) {
        // Start date is the day after the last sprint ended
        const lastEndDate = new Date(lastSprint.end_date);
        const today = startOfDay(new Date());
        
        // If last sprint ended in the past, start from today
        const newStartDate = lastEndDate < today 
          ? today 
          : addDays(lastEndDate, 1);
        
        // End date is 14 days (2 weeks) after start date by default
        const newEndDate = addDays(newStartDate, parseInt(duration));

        setFormData(prev => ({
          ...prev,
          start_date: format(newStartDate, "yyyy-MM-dd"),
          end_date: format(newEndDate, "yyyy-MM-dd"),
        }));
      } else {
        // No previous sprint, use today as start
        const today = startOfDay(new Date());
        const endDate = addDays(today, parseInt(duration));
        
        setFormData(prev => ({
          ...prev,
          start_date: format(today, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        }));
      }
    } catch (error) {
      console.error("Error loading last sprint:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validations
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = startOfDay(new Date());
      
      // Check if start date is not in the past
      if (startDate < today) {
        toast.error("Não é possível criar sprints com data de início no passado");
        setLoading(false);
        return;
      }
      
      // Check if duration is 7 or 14 days
      const daysDiff = differenceInDays(endDate, startDate);
      if (daysDiff !== 7 && daysDiff !== 14) {
        toast.error("A duração da sprint deve ser de 1 ou 2 semanas (7 ou 14 dias)");
        setLoading(false);
        return;
      }

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({ name: "", goal: "", start_date: "", end_date: "" });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

          <div className="space-y-2">
            <Label htmlFor="duration">Duração *</Label>
            <Select 
              value={duration} 
              onValueChange={(value: "7" | "14") => {
                setDuration(value);
                if (formData.start_date) {
                  const startDate = new Date(formData.start_date);
                  const newEndDate = addDays(startDate, parseInt(value));
                  setFormData(prev => ({
                    ...prev,
                    end_date: format(newEndDate, "yyyy-MM-dd")
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 semana (7 dias)</SelectItem>
                <SelectItem value="14">2 semanas (14 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  const newStartDate = new Date(e.target.value);
                  const newEndDate = addDays(newStartDate, parseInt(duration));
                  setFormData({ 
                    ...formData, 
                    start_date: e.target.value,
                    end_date: format(newEndDate, "yyyy-MM-dd")
                  });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                readOnly
                className="bg-muted cursor-not-allowed"
                required
              />
              <p className="text-xs text-muted-foreground">
                Calculada automaticamente baseada na duração
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
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
