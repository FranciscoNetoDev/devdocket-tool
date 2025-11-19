import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Calendar, Clock } from "lucide-react";
import MemberSelect from "./MemberSelect";
import { toast } from "sonner";
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
  project_id: string;
}

interface TaskDialogProps {
  taskId: string | null;
  projectKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

export default function TaskDialog({
  taskId,
  projectKey,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDialogProps) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Database["public"]["Enums"]["task_priority"]>("medium");
  const [status, setStatus] = useState<Database["public"]["Enums"]["task_status"]>("todo");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [sprints, setSprints] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [userStoryId, setUserStoryId] = useState<string | null>(null);
  const [userStories, setUserStories] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (taskId && open) {
      fetchTask();
    }
    if (open) {
      fetchSprints();
      
      // Solicitar permissão para notificações
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [taskId, open]);

  const fetchSprints = async () => {
    // Esta função será chamada pelo useEffect mas não faz nada
    // As sprints são buscadas por fetchSprintsForProject após carregar a task
  };

  const fetchSprintsForProject = async (projectId: string) => {
    try {
      // Sprints agora são globais, busca todas as sprints da org
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("org_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.org_id) return;

      const { data, error } = await supabase
        .from("sprints")
        .select("id, name, status")
        .eq("org_id", userRole.org_id)
        .in("status", ["planning", "active", "paused"])
        .order("start_date", { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
    }
  };

  const fetchUserStoriesForProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_stories")
        .select("id, title")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserStories(data || []);
    } catch (error: any) {
      console.error("Error fetching user stories:", error);
    }
  };

  const fetchTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) throw error;

      setTask(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setPriority(data.priority);
      setStatus(data.status);
      setEstimatedHours(data.estimated_hours?.toString() || "");
      setActualHours(data.actual_hours?.toString() || "");
      setDueDate(data.due_date || "");
      setSprintId(data.sprint_id || null);
      setUserStoryId((data as any).user_story_id || null);
      
      // Buscar membros atribuídos
      const { data: assignees } = await supabase
        .from("task_assignees")
        .select("user_id")
        .eq("task_id", taskId);
      
      setAssignedMembers(assignees?.map(a => a.user_id) || []);
      
      // Buscar sprints e user stories após carregar a task
      fetchSprintsForProject(data.project_id);
      fetchUserStoriesForProject(data.project_id);
    } catch (error: any) {
      console.error("Error fetching task:", error);
      toast.error("Erro ao carregar task");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!taskId || !title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!userStoryId) {
      toast.error("User Story é obrigatória - toda Task deve ser vinculada a uma User Story");
      return;
    }

    try {
      setSaving(true);
      
      // Se a user story está em uma sprint, verificar e vincular a task também
      let finalSprintId = sprintId;
      
      if (userStoryId) {
        const { data: sprintStory } = await supabase
          .from("sprint_user_stories")
          .select("sprint_id")
          .eq("user_story_id", userStoryId)
          .maybeSingle();
        
        if (sprintStory?.sprint_id) {
          finalSprintId = sprintStory.sprint_id;
        }
      }
      
      const { error } = await supabase
        .from("tasks")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          actual_hours: actualHours ? parseFloat(actualHours) : null,
          due_date: dueDate || null,
          sprint_id: finalSprintId,
          user_story_id: userStoryId,
        })
        .eq("id", taskId);

      if (error) throw error;

      // Atualizar assignees
      await handleUpdateAssignees();

      toast.success("Task atualizada com sucesso!");
      onTaskUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar task");
    } finally {
      setSaving(false);
    }
  };

  const sendBrowserNotification = (assigneeName: string) => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Request permission if not granted
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Send notification if permission granted
    if (Notification.permission === "granted") {
      new Notification("Nova Task Atribuída", {
        body: `${assigneeName} foi atribuído à task: ${title}`,
        icon: "/favicon.ico",
        tag: taskId || "task-assignment",
      });
    }
  };

  const handleUpdateAssignees = async () => {
    if (!taskId || !task) return;

    try {
      setSavingAssignees(true);

      // Buscar assignees atuais
      const { data: currentAssignees } = await supabase
        .from("task_assignees")
        .select("user_id")
        .eq("task_id", taskId);

      const currentUserIds = currentAssignees?.map(a => a.user_id) || [];
      
      // Identificar novos assignees
      const newAssignees = assignedMembers.filter(
        userId => !currentUserIds.includes(userId)
      );
      
      // Identificar assignees removidos
      const removedAssignees = currentUserIds.filter(
        userId => !assignedMembers.includes(userId)
      );

      // Remover assignees
      if (removedAssignees.length > 0) {
        const { error: deleteError } = await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .in("user_id", removedAssignees);

        if (deleteError) throw deleteError;
      }

      // Adicionar novos assignees
      if (newAssignees.length > 0) {
        const assigneesToInsert = newAssignees.map(userId => ({
          task_id: taskId,
          user_id: userId,
        }));

        const { error: insertError } = await supabase
          .from("task_assignees")
          .insert(assigneesToInsert);

        if (insertError) throw insertError;

        // Buscar perfis dos novos assignees
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, nickname")
          .in("id", newAssignees);

        // Enviar notificações para novos assignees
        for (const userId of newAssignees) {
          const profile = profiles?.find(p => p.id === userId);
          const assigneeName = profile?.nickname || profile?.full_name || "Usuário";

          // Enviar notificação do navegador
          sendBrowserNotification(assigneeName);

          // Enviar email
          try {
            await supabase.functions.invoke("send-task-assignment-email", {
              body: {
                taskId: task.id,
                taskTitle: title,
                taskDescription: description,
                dueDate: dueDate,
                assignedByUserId: user?.id,
                assignedToUserId: userId,
              },
            });
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Não bloqueia o fluxo se o email falhar
          }
        }
      }
    } catch (error: any) {
      console.error("Error updating assignees:", error);
      throw error;
    } finally {
      setSavingAssignees(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task inativada com sucesso!");
      onTaskUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error("Erro ao inativar task");
    }
  };

  const handleReactivate = async () => {
    if (!taskId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: null })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task reativada com sucesso!");
      onTaskUpdated?.();
      fetchTask();
    } catch (error: any) {
      console.error("Error reactivating task:", error);
      toast.error("Erro ao reativar task");
    } finally {
      setSaving(false);
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      critical: "Crítica",
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: "A Fazer",
      in_progress: "Em Progresso",
      done: "Concluído",
      blocked: "Bloqueado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canDelete = task?.created_by === user?.id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Detalhes da Task</DialogTitle>
              {task?.deleted_at && (
                <Badge variant="destructive">Inativa</Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as Database["public"]["Enums"]["task_priority"])} disabled={saving}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as Database["public"]["Enums"]["task_status"])} disabled={saving}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint">Sprint</Label>
                <Select 
                  value={sprintId || "backlog"} 
                  onValueChange={(val) => setSprintId(val === "backlog" ? null : val)} 
                  disabled={saving || !!userStoryId}
                >
                  <SelectTrigger id="sprint">
                    <SelectValue placeholder="Herda da User Story" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog (Sem Sprint)</SelectItem>
                    {sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name} ({sprint.status === "active" ? "Ativa" : sprint.status === "paused" ? "Pausada" : "Planejamento"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userStoryId && (
                  <p className="text-xs text-muted-foreground">
                    Sprint herdada da User Story
                  </p>
                )}
              </div>

            <div className="space-y-2">
              <Label htmlFor="userStory">User Story *</Label>
              <Select 
                value={userStoryId || "none"} 
                onValueChange={(val) => setUserStoryId(val === "none" ? null : val)} 
                disabled={saving}
              >
                <SelectTrigger id="userStory">
                  <SelectValue placeholder="Selecione uma user story" />
                </SelectTrigger>
                <SelectContent>
                  {userStories.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhuma user story disponível</SelectItem>
                  ) : (
                    <>
                      {userStories.map((story) => (
                        <SelectItem key={story.id} value={story.id}>
                          {story.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Toda task deve ser vinculada a uma User Story
              </p>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualHours">Horas Reais</Label>
                <Input
                  id="actualHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Entrega</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={saving}
              />
            </div>

            {task && (
              <div className="space-y-2">
                <Label>Membros Atribuídos</Label>
                <MemberSelect
                  projectId={task.project_id}
                  selectedMembers={assignedMembers}
                  onMembersChange={setAssignedMembers}
                  disabled={saving || savingAssignees}
                />
              </div>
            )}

            {task && (
              <>
                <Separator />
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Criada em: {new Date(task.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 justify-between pt-4">
              <div>
                {task?.deleted_at ? (
                  <Button
                    variant="outline"
                    onClick={handleReactivate}
                    disabled={saving}
                  >
                    Reativar Task
                  </Button>
                ) : (
                  canDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={saving}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Inativar
                    </Button>
                  )
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar inativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar esta task? Ela não aparecerá mais no board, mas continuará visível no backlog como inativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
