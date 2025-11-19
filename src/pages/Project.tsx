import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import BoardView from "@/components/project/BoardView";
import BacklogView from "@/components/project/BacklogView";
import SprintsView from "@/components/project/SprintsView";
import TeamView from "@/components/project/TeamView";
import UserStoryView from "@/components/project/UserStoryView";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
}

export default function Project() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("board");

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("projects")
        .select(`
          *,
          project_members!inner(user_id)
        `)
        .eq("id", projectId)
        .eq("project_members.user_id", user?.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error("Error fetching project:", error);
      toast.error("Erro ao carregar projeto");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{project.key}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">{project.name}</h1>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {project.description && <p>{project.description}</p>}
                    {project.due_date && (
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Prazo: {new Date(project.due_date).toLocaleDateString("pt-BR")}
                        {(() => {
                          const days = differenceInDays(new Date(project.due_date), new Date());
                          if (days < 0) return " (atrasado)";
                          if (days === 0) return " (hoje)";
                          if (days <= 7) return ` (${days} dias)`;
                          return "";
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="backlog">Backlog</TabsTrigger>
            <TabsTrigger value="sprints">Sprints</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="user-story">User Story</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-0">
            <BoardView projectId={projectId!} projectKey={project.key} />
          </TabsContent>

          <TabsContent value="backlog" className="mt-0">
            <BacklogView projectId={projectId!} projectKey={project.key} />
          </TabsContent>

          <TabsContent value="sprints" className="mt-0">
            <SprintsView projectId={projectId!} />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <TeamView projectId={projectId!} />
          </TabsContent>

          <TabsContent value="user-story" className="mt-0">
            <UserStoryView projectId={projectId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
