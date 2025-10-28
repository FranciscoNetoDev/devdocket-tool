import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import BoardView from "@/components/project/BoardView";
import BacklogView from "@/components/project/BacklogView";
import SprintsView from "@/components/project/SprintsView";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  created_at: string;
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
                  <p className="text-xs text-muted-foreground">{project.description}</p>
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
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
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

          <TabsContent value="roadmap" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Roadmap em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
