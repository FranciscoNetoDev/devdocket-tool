import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RetrospectiveItem {
  id: string;
  category: "good" | "bad" | "risk" | "opportunity";
  content: string;
  created_by: string;
  created_at: string;
}

interface Retrospective {
  id: string;
  title: string;
  date: string;
  sprint_id: string;
  sprints: { name: string } | null;
  retrospective_items: RetrospectiveItem[];
}

interface RetrospectiveViewProps {
  sprintId?: string; // Opcional para filtrar por sprint específica
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

export default function RetrospectiveView({ sprintId }: RetrospectiveViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRetrospectives();
    }
  }, [sprintId, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchRetrospectives = async () => {
    try {
      setLoading(true);

      // Buscar retrospectivas - RLS cuida das permissões
      // (usuário vê suas próprias ou todas se for admin)
      let query = supabase
        .from("retrospectives")
        .select(`
          id,
          title,
          date,
          sprint_id,
          created_by,
          sprints:sprint_id(name),
          retrospective_items (
            id,
            category,
            content,
            created_by,
            created_at
          )
        `);

      if (sprintId) {
        query = query.eq("sprint_id", sprintId);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      setRetrospectives(data as any || []);
    } catch (error: any) {
      console.error("Error fetching retrospectives:", error);
      toast.error("Erro ao carregar retrospectivas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Retrospectivas</h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Todas as retrospectivas das sprints (você é admin)" 
              : "Suas retrospectivas criadas"}
          </p>
        </div>
      </div>

      {retrospectives.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-2">
              {isAdmin 
                ? "Nenhuma retrospectiva criada ainda" 
                : "Você ainda não criou nenhuma retrospectiva"}
            </p>
            <p className="text-sm text-muted-foreground">
              Retrospectivas são criadas durante as sprints
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {retrospectives.map((retro) => (
            <Card key={retro.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{retro.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {retro.sprints && (
                      <Badge variant="outline" className="bg-purple-50">
                        Sprint: {retro.sprints.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(retro.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {retro.retrospective_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item registrado</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["good", "bad", "risk", "opportunity"].map((category) => {
                      const items = retro.retrospective_items.filter(item => item.category === category);
                      if (items.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="font-semibold text-sm">
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </h4>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Card key={item.id} className={categoryColors[category as keyof typeof categoryColors]}>
                                <CardContent className="p-3">
                                  <p className="text-sm">{item.content}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
