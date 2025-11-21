import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Target, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: string;
  projects: Array<{
    id: string;
    name: string;
    key: string;
  }>;
}

export default function Sprints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch all sprints the user has access to
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select("*")
        .order("start_date", { ascending: false });

      if (sprintsError) throw sprintsError;

      // For each sprint, fetch linked projects
      const sprintsWithProjects = await Promise.all(
        (sprintsData || []).map(async (sprint) => {
          const { data: projectLinks } = await supabase
            .from("sprint_projects")
            .select(`
              project_id,
              projects:project_id (
                id,
                name,
                key
              )
            `)
            .eq("sprint_id", sprint.id);

          return {
            ...sprint,
            projects: projectLinks?.map(link => link.projects).filter(Boolean) || [],
          };
        })
      );

      setSprints(sprintsWithProjects as any);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
      toast.error("Erro ao carregar sprints");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    planning: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
  };

  const statusLabels = {
    planning: "Planejamento",
    active: "Ativa",
    paused: "Pausada",
    completed: "Concluída",
  };

  const filteredSprints = sprints.filter((sprint) => {
    const matchesSearch =
      sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sprint.goal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sprint.projects.some(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || sprint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getSprintDaysInfo = (sprint: Sprint) => {
    const today = new Date();
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const daysRemaining = differenceInDays(endDate, today);

    return { totalDays, daysRemaining };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Todas as Sprints</h1>
        <p className="text-muted-foreground">
          Visualize todas as sprints que você tem acesso através dos seus projetos
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sprints, projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="planning">Planejamento</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sprint Cards Grid */}
      {filteredSprints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Nenhuma sprint encontrada com os filtros aplicados"
                : "Nenhuma sprint disponível"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSprints.map((sprint) => {
            const { totalDays, daysRemaining } = getSprintDaysInfo(sprint);

            return (
              <Card
                key={sprint.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {sprint.name}
                    </CardTitle>
                    <Badge
                      className={`${statusColors[sprint.status as keyof typeof statusColors]} shrink-0`}
                    >
                      {statusLabels[sprint.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sprint.goal && (
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sprint.goal}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sprint.start_date), "dd/MM/yyyy")} -{" "}
                      {format(new Date(sprint.end_date), "dd/MM/yyyy")}
                    </p>
                  </div>

                  {sprint.status === "active" && (
                    <div className="text-sm">
                      <span
                        className={
                          daysRemaining < 0
                            ? "text-destructive font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {daysRemaining < 0
                          ? "Atrasada"
                          : `${daysRemaining} ${
                              daysRemaining === 1 ? "dia" : "dias"
                            } restantes`}
                      </span>
                    </div>
                  )}

                  {sprint.projects.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        Projetos ({sprint.projects.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sprint.projects.slice(0, 3).map((project) => (
                          <Badge
                            key={project.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {project.key}
                          </Badge>
                        ))}
                        {sprint.projects.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sprint.projects.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
