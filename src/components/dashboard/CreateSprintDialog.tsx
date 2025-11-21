import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [startDate, setStartDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
  });

  useEffect(() => {
    if (open) {
      // Start from today
      const today = startOfDay(new Date());
      setStartDate(today);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!startDate) {
        toast.error("Selecione a data de início");
        setLoading(false);
        return;
      }

      // Validations - compare dates as strings to avoid timezone issues
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const startDateStr = format(startDate, "yyyy-MM-dd");
      
      // Check if start date is in the past (before today)
      if (startDateStr < todayStr) {
        toast.error("A data de início não pode ser retroativa");
        setLoading(false);
        return;
      }
      
      // Calculate end date
      const endDate = addDays(startDate, parseInt(duration));
      const endDateStr = format(endDate, "yyyy-MM-dd");

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
        .or(`and(start_date.lte.${endDateStr},end_date.gte.${startDateStr})`);

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
          start_date: startDateStr,
          end_date: endDateStr,
          org_id: userRole.org_id,
          status: "planning",
        }]);

      if (error) throw error;

      toast.success("Sprint criada com sucesso!");
      setFormData({ name: "", goal: "" });
      setStartDate(undefined);
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
      setFormData({ name: "", goal: "" });
      setStartDate(undefined);
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
              <Label className="text-sm">Data Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 sm:h-10 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Data Fim *</Label>
              <Button
                variant="outline"
                disabled
                className="w-full h-9 sm:h-10 justify-start text-left font-normal bg-muted cursor-not-allowed"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(addDays(startDate, parseInt(duration)), "dd/MM/yyyy") : "Automático"}
              </Button>
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
