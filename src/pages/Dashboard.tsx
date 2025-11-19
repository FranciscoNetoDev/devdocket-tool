import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, FolderKanban, LogOut, User, MoreVertical, Edit, Trash2, Users, Search, SortAsc, Grid3x3, List, UsersRound, Link2, Calendar, Target, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EditProjectDialog from "@/components/project/EditProjectDialog";
import ManageMembersDialog from "@/components/project/ManageMembersDialog";
import ProjectMemberAvatars from "@/components/project/ProjectMemberAvatars";
import ProjectInviteDialog from "@/components/project/ProjectInviteDialog";
import SprintsSection from "@/components/dashboard/SprintsSection";
import GlobalBacklog from "@/components/dashboard/GlobalBacklog";

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  project_members?: Array<{
    user_id: string;
    profiles?: {
      full_name: string | null;
      nickname: string | null;
    };
  }>;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingMembersProject, setManagingMembersProject] = useState<string | null>(null);
  const [inviteProject, setInviteProject] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "key">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProjects();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, nickname, email, avatar_url")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Busca os projetos do usuário
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          project_members!inner(user_id)
        `)
        .eq("project_members.user_id", user?.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Para cada projeto, busca os membros completos com perfis
      const projectsWithMembers = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: members, error: membersError } = await supabase
            .from("project_members")
            .select("user_id")
            .eq("project_id", project.id);

          if (membersError) {
            console.error("Error fetching members:", membersError);
            return { ...project, project_members: [] };
          }

          // Busca os perfis dos membros
          const memberIds = members.map(m => m.user_id);
          
          if (memberIds.length === 0) {
            return { ...project, project_members: [] };
          }

          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, nickname, avatar_url")
            .in("id", memberIds) as { 
              data: Array<{ 
                id: string; 
                full_name: string | null; 
                nickname: string | null; 
                avatar_url: string | null 
              }> | null; 
              error: any 
            };

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            return { ...project, project_members: [] };
          }

          // Combina os dados
          const membersWithProfiles: Array<{
            user_id: string;
            profiles?: {
              full_name: string | null;
              nickname: string | null;
              avatar_url: string | null;
            };
          }> = members.map(member => {
            const profile = profiles?.find(p => p.id === member.user_id);
            return {
              user_id: member.user_id,
              profiles: profile ? {
                full_name: profile.full_name,
                nickname: profile.nickname,
                avatar_url: profile.avatar_url || null
              } : undefined
            };
          });

          return {
            ...project,
            project_members: membersWithProfiles
          };
        })
      );

      setProjects(projectsWithMembers);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos");
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id);

      if (error) throw error;

      toast.success("Projeto deletado com sucesso!");
      setProjectToDelete(null);
      fetchProjects();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Erro ao deletar projeto");
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter((project) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.key.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "key":
          return a.key.localeCompare(b.key);
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitials = profile?.nickname
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Taskbora</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento de Projetos</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.nickname || profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">
              <FolderKanban className="mr-2 h-4 w-4" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="sprints">
              <Target className="mr-2 h-4 w-4" />
              Sprints
            </TabsTrigger>
            <TabsTrigger value="backlog">
              <ListTodo className="mr-2 h-4 w-4" />
              Backlog Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Meus Projetos</h2>
                  <p className="text-muted-foreground">
                    Gerencie e acompanhe todos os seus projetos em um só lugar
                  </p>
                </div>
                <Button onClick={() => navigate("/projects/new")} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Novo Projeto
                </Button>
              </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, chave ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de criação</SelectItem>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="key">Chave (A-Z)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Comece criando seu primeiro projeto para organizar suas tarefas e
                  colaborar com sua equipe.
                </p>
                <Button onClick={() => navigate("/projects/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Não encontramos projetos que correspondam à sua busca.
                  Tente usar outros termos.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar Busca
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" 
              : "flex flex-col gap-4 animate-fade-in"
            }>
              {filteredAndSortedProjects.map((project) => (
                viewMode === "grid" ? (
                  <Card
                    key={project.id}
                    className="hover:shadow-medium transition-all group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="text-lg font-bold text-primary">
                              {project.key}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <CardDescription className="text-xs space-y-1">
                              <div>Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}</div>
                              {project.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Prazo: {new Date(project.due_date).toLocaleDateString("pt-BR")}
                                    {(() => {
                                      const days = differenceInDays(new Date(project.due_date), new Date());
                                      if (days < 0) return " (atrasado)";
                                      if (days === 0) return " (hoje)";
                                      if (days <= 7) return ` (${days} dias)`;
                                      return "";
                                    })()}
                                  </span>
                                </div>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(project);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Projeto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setManagingMembersProject(project.id);
                              }}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Gerenciar Membros
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setInviteProject(project.id);
                              }}
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Convites por Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar Projeto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {project.description || "Sem descrição"}
                      </p>
                      {project.project_members && project.project_members.length > 0 && (
                        <div className="flex items-center gap-2 pt-3 border-t">
                          <UsersRound className="h-3 w-3 text-muted-foreground" />
                          <ProjectMemberAvatars members={project.project_members as any} maxDisplay={4} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    key={project.id}
                    className="hover:shadow-medium transition-all group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                            <span className="text-xl font-bold text-primary">
                              {project.key}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                              <Badge variant="outline" className="shrink-0">{project.key}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                              {project.description || "Sem descrição"}
                            </p>
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-muted-foreground">
                                Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
                              </p>
                              {project.project_members && project.project_members.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <UsersRound className="h-3 w-3 text-muted-foreground" />
                                  <ProjectMemberAvatars members={project.project_members as any} maxDisplay={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(project);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Projeto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setManagingMembersProject(project.id);
                              }}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Gerenciar Membros
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setInviteProject(project.id);
                              }}
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Convites por Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar Projeto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="sprints">
        <SprintsSection />
      </TabsContent>

      <TabsContent value="backlog">
        <GlobalBacklog />
      </TabsContent>
    </Tabs>
  </main>

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSuccess={fetchProjects}
        />
      )}

      {managingMembersProject && (
        <ManageMembersDialog
          projectId={managingMembersProject}
          open={!!managingMembersProject}
          onOpenChange={(open) => !open && setManagingMembersProject(null)}
        />
      )}

      {inviteProject && (
        <ProjectInviteDialog
          projectId={inviteProject}
          open={!!inviteProject}
          onOpenChange={(open) => !open && setInviteProject(null)}
        />
      )}

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o projeto "{projectToDelete?.name}"?
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
