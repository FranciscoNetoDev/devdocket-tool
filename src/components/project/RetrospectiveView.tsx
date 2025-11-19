import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import RetrospectiveDialog from "./RetrospectiveDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Retrospective {
  id: string;
  title: string;
  date: string;
  sprint_id: string | null;
  created_at: string;
  items: RetrospectiveItem[];
}

interface RetrospectiveItem {
  id: string;
  category: "good" | "bad" | "risk" | "opportunity";
  content: string;
  created_by: string;
  created_at: string;
}

interface RetrospectiveViewProps {
  projectId: string;
}

const categoryLabels = {
  good: "Bom",
  bad: "Ruim",
  risk: "Risco",
  opportunity: "Oportunidade",
};

const categoryColors = {
  good: "bg-green-50 border-green-200",
  bad: "bg-red-50 border-red-200",
  risk: "bg-yellow-50 border-yellow-200",
  opportunity: "bg-blue-50 border-blue-200",
};

export default function RetrospectiveView({ projectId }: RetrospectiveViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRetro, setSelectedRetro] = useState<Retrospective | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [retroToDelete, setRetroToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchRetrospectives();
    }
  }, [projectId]);

  const fetchRetrospectives = async () => {
    try {
      setLoading(true);
      const { data: retros, error: retrosError } = await supabase
        .from("retrospectives")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (retrosError) throw retrosError;

      if (retros && retros.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from("retrospective_items")
          .select("*")
          .in("retrospective_id", retros.map(r => r.id))
          .order("created_at", { ascending: true });

        if (itemsError) throw itemsError;

        const retrospectivesWithItems = retros.map(retro => ({
          ...retro,
          items: (items?.filter(item => item.retrospective_id === retro.id) || []).map(item => ({
            ...item,
            category: item.category as "good" | "bad" | "risk" | "opportunity",
          })),
        }));

        setRetrospectives(retrospectivesWithItems);
      } else {
        setRetrospectives([]);
      }
    } catch (error: any) {
      console.error("Error fetching retrospectives:", error);
      toast.error("Erro ao carregar retrospectivas");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (retro: Retrospective) => {
    setSelectedRetro(retro);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!retroToDelete) return;

    try {
      const { error } = await supabase
        .from("retrospectives")
        .delete()
        .eq("id", retroToDelete);

      if (error) throw error;

      toast.success("Retrospectiva excluída com sucesso!");
      fetchRetrospectives();
    } catch (error: any) {
      console.error("Error deleting retrospective:", error);
      toast.error("Erro ao excluir retrospectiva");
    } finally {
      setDeleteDialogOpen(false);
      setRetroToDelete(null);
    }
  };

  const handleNewRetro = () => {
    setSelectedRetro(null);
    setDialogOpen(true);
  };

  const groupedItems = (items: RetrospectiveItem[]) => {
    return {
      good: items.filter(i => i.category === "good"),
      bad: items.filter(i => i.category === "bad"),
      risk: items.filter(i => i.category === "risk"),
      opportunity: items.filter(i => i.category === "opportunity"),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Retrospectivas</h2>
          <p className="text-muted-foreground">Gerencie as retrospectivas do projeto</p>
        </div>
        <Button onClick={handleNewRetro}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Retrospectiva
        </Button>
      </div>

      {retrospectives.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma retrospectiva criada ainda</p>
            <Button onClick={handleNewRetro}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Retrospectiva
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {retrospectives.map((retro) => {
            const grouped = groupedItems(retro.items);
            return (
              <Card key={retro.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{retro.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(retro.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(retro)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRetroToDelete(retro.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(grouped) as Array<keyof typeof grouped>).map((category) => (
                      <div key={category} className={`p-4 rounded-lg border ${categoryColors[category]}`}>
                        <h4 className="font-semibold mb-3">{categoryLabels[category]}</h4>
                        <ul className="space-y-2">
                          {grouped[category].length === 0 ? (
                            <li className="text-sm text-muted-foreground italic">Nenhum item</li>
                          ) : (
                            grouped[category].map((item) => (
                              <li key={item.id} className="text-sm">
                                • {item.content}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RetrospectiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        retrospective={selectedRetro}
        onSuccess={fetchRetrospectives}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Retrospectiva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta retrospectiva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
