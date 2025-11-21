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

  // Recalculate end_date when duration or start_date changes
  useEffect(() => {
    if (formData.start_date) {
      const startDate = startOfDay(new Date(formData.start_date));
      const newEndDate = addDays(startDate, parseInt(duration));
      setFormData(prev => ({
        ...prev,
        end_date: format(newEndDate, "yyyy-MM-dd"),
      }));
    }
  }, [duration, formData.start_date]);

  const loadLastSprintDates = async () => {
    try {
      // Start from today
      const today = startOfDay(new Date());
      const endDate = addDays(today, parseInt(duration));
      
      setFormData(prev => ({
        ...prev,
        start_date: format(today, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      }));
    } catch (error) {
      console.error("Error loading last sprint:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validations - compare dates as strings to avoid timezone issues
      const todayStr = format(new Date(), "yyyy-MM-dd");
      
      // Check if start date is in the past (before today)
      if (formData.start_date < todayStr) {
        toast.error("A data de início não pode ser retroativa");
        setLoading(false);
        return;
      }
      
      // Validate that end_date matches the expected calculation
      const startDate = startOfDay(new Date(formData.start_date));
      const expectedEndDate = addDays(startDate, parseInt(duration));
      const expectedEndDateStr = format(expectedEndDate, "yyyy-MM-dd");
      
      if (formData.end_date !== expectedEndDateStr) {
        toast.error(`Erro na duração da sprint. Por favor, tente novamente.`);
        setLoading(false);
        return;
      }

      // Get user's org
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("org_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (roleError) {
        toast.error("Erro ao buscar organização: " + roleError.message);
        setLoading(false);
        return;
      }

      if (!userRole?.org_id) {
        toast.error("Organização não encontrada. Você precisa estar vinculado a uma organização para criar sprints.");
        setLoading(false);
        return;
      }

      // Verificar se já existe sprint com datas sobrepostas
      const { data: existingSprints, error: checkError } = await supabase
        .from("sprints")
        .select("id, name, start_date, end_date")
        .eq("org_id", userRole.org_id)
        .or(`and(start_date.lte.${formData.end_date},end_date.gte.${formData.start_date})`);

      if (checkError) {
        toast.error("Erro ao verificar sprints existentes: " + checkError.message);
        setLoading(false);
        return;
      }

      if (existingSprints && existingSprints.length > 0) {
        const conflictingSprint = existingSprints[0];
        toast.error(
          `Já existe uma sprint "${conflictingSprint.name}" com datas sobrepostas (${format(new Date(conflictingSprint.start_date), "dd/MM/yyyy")} - ${format(new Date(conflictingSprint.end_date), "dd/MM/yyyy")})`
        );
        setLoading(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nova Sprint</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Nome da Sprint *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Sprint 1"
              className="h-9 sm:h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-sm">Objetivo</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="Descreva o objetivo desta sprint..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm">Duração *</Label>
            <Select 
              value={duration} 
              onValueChange={(value: "7" | "14") => setDuration(value)}
            >
              <SelectTrigger className="h-9 sm:h-10">
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 semana (7 dias)</SelectItem>
                <SelectItem value="14">2 semanas (14 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-sm">Data Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    start_date: e.target.value
                  });
                }}
                className="w-full h-9 sm:h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-sm">Data Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                readOnly
                className="bg-muted cursor-not-allowed w-full h-9 sm:h-10"
                required
              />
              <p className="text-xs text-muted-foreground">
                Calculada automaticamente
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto h-9"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto h-9"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
