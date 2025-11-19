import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RetrospectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  retrospective?: {
    id: string;
    title: string;
    date: string;
    items: Array<{
      id: string;
      category: "good" | "bad" | "risk" | "opportunity";
      content: string;
    }>;
  } | null;
  onSuccess: () => void;
}

interface ItemInput {
  id?: string;
  category: "good" | "bad" | "risk" | "opportunity";
  content: string;
}

const categoryLabels = {
  good: "Bom",
  bad: "Ruim",
  risk: "Risco",
  opportunity: "Oportunidade",
};

export default function RetrospectiveDialog({
  open,
  onOpenChange,
  projectId,
  retrospective,
  onSuccess,
}: RetrospectiveDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<ItemInput[]>([]);

  useEffect(() => {
    if (retrospective) {
      setTitle(retrospective.title);
      setDate(retrospective.date);
      setItems(retrospective.items);
    } else {
      setTitle("");
      setDate(new Date().toISOString().split("T")[0]);
      setItems([]);
    }
  }, [retrospective]);

  const handleAddItem = (category: "good" | "bad" | "risk" | "opportunity") => {
    setItems([...items, { category, content: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, content: string) => {
    const newItems = [...items];
    newItems[index].content = content;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let retroId = retrospective?.id;

      if (retrospective) {
        // Update existing retrospective
        const { error: updateError } = await supabase
          .from("retrospectives")
          .update({ title, date })
          .eq("id", retrospective.id);

        if (updateError) throw updateError;

        // Delete old items
        const { error: deleteError } = await supabase
          .from("retrospective_items")
          .delete()
          .eq("retrospective_id", retrospective.id);

        if (deleteError) throw deleteError;
      } else {
        // Create new retrospective
        const { data, error: insertError } = await supabase
          .from("retrospectives")
          .insert([{
            project_id: projectId,
            title,
            date,
            created_by: user?.id!,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        retroId = data.id;
      }

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items
          .filter(item => item.content.trim())
          .map(item => ({
            retrospective_id: retroId!,
            category: item.category,
            content: item.content,
            created_by: user?.id!,
          }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from("retrospective_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      toast.success(retrospective ? "Retrospectiva atualizada!" : "Retrospectiva criada!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving retrospective:", error);
      toast.error("Erro ao salvar retrospectiva");
    } finally {
      setLoading(false);
    }
  };

  const itemsByCategory = {
    good: items.filter(i => i.category === "good"),
    bad: items.filter(i => i.category === "bad"),
    risk: items.filter(i => i.category === "risk"),
    opportunity: items.filter(i => i.category === "opportunity"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{retrospective ? "Editar" : "Nova"} Retrospectiva</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sprint 1 - Retrospectiva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(itemsByCategory) as Array<keyof typeof itemsByCategory>).map((category) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{categoryLabels[category]}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(category)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {items
                    .map((item, idx) => ({ item, idx }))
                    .filter(({ item }) => item.category === category)
                    .map(({ item, idx }) => (
                      <div key={idx} className="flex gap-2">
                        <Textarea
                          value={item.content}
                          onChange={(e) => handleUpdateItem(idx, e.target.value)}
                          placeholder={`Adicione um item em ${categoryLabels[category]}`}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {retrospective ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
