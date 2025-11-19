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
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [userStoryId, setUserStoryId] = useState<string | null>(null);
  const [userStories, setUserStories] = useState<Array<{ id: string; title: string; story_points: number | null }>>([]);
  const [storyPointsInfo, setStoryPointsInfo] = useState<{
    total: number;
    consumed: number;
    available: number;
  } | null>(null);
  const [dailyPointsInfo, setDailyPointsInfo] = useState<{
    currentDayPoints: number;
    daysNeeded: number;
    distribution: Array<{ date: string; points: number }>;
  } | null>(null);

  useEffect(() => {
    if (taskId && open) {
      fetchTask();
    }
    if (open) {
      // Solicitar permissão para notificações
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [taskId, open]);


  const fetchUserStoriesForProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_stories")
        .select("id, title, story_points")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserStories(data || []);
    } catch (error: any) {
      console.error("Error fetching user stories:", error);
    }
  };

  const calculateStoryPoints = async (storyId: string, excludeTaskId?: string) => {
    try {
      // Buscar a user story
      const { data: story, error: storyError } = await supabase
        .from("user_stories")
        .select("story_points")
        .eq("id", storyId)
        .single();

      if (storyError) throw storyError;

      const totalPoints = story.story_points || 0;

      // Buscar todas as tasks da user story
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, estimated_hours")
        .eq("user_story_id", storyId)
        .is("deleted_at", null);

      if (tasksError) throw tasksError;

      // Calcular pontos consumidos (excluindo a task atual se estiver editando)
      const consumedPoints = (tasks || [])
        .filter(t => t.id !== excludeTaskId)
        .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

      const availablePoints = totalPoints - consumedPoints;

      setStoryPointsInfo({
        total: totalPoints,
        consumed: consumedPoints,
        available: availablePoints,
      });
    } catch (error: any) {
      console.error("Error calculating story points:", error);
      setStoryPointsInfo(null);
    }
  };

  const calculateDailyPoints = async (selectedDate: string, hours: number, projectId: string) => {
    try {
      // Buscar todas as tasks do projeto com due_date
      const { data: projectTasks, error } = await supabase
        .from("tasks")
        .select("id, estimated_hours, due_date")
        .eq("project_id", projectId)
        .not("due_date", "is", null)
        .is("deleted_at", null);

      if (error) throw error;

      // Calcular pontos já alocados no dia selecionado (excluindo a task atual)
      const tasksOnDate = (projectTasks || [])
        .filter(t => t.id !== taskId && t.due_date === selectedDate);
      
      const currentDayPoints = tasksOnDate.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const availableToday = Math.max(0, 8 - currentDayPoints);

      // Calcular distribuição se exceder 8pts
      const distribution: Array<{ date: string; points: number }> = [];
      let remainingHours = hours;
      let currentDate = new Date(selectedDate);
      
      while (remainingHours > 0) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Calcular pontos já alocados neste dia
        const tasksOnThisDate = (projectTasks || [])
          .filter(t => t.id !== taskId && t.due_date === dateStr);
        const pointsOnThisDate = tasksOnThisDate.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        const availableOnThisDate = Math.max(0, 8 - pointsOnThisDate);
        
        const pointsToAllocate = Math.min(remainingHours, availableOnThisDate);
        
        if (pointsToAllocate > 0) {
          distribution.push({
            date: dateStr,
            points: pointsToAllocate
          });
          remainingHours -= pointsToAllocate;
        }
        
        // Avançar para o próximo dia
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Limite de segurança: não calcular mais de 30 dias
        if (distribution.length >= 30) break;
      }

      setDailyPointsInfo({
        currentDayPoints,
        daysNeeded: distribution.length,
        distribution
      });
    } catch (error: any) {
      console.error("Error calculating daily points:", error);
      setDailyPointsInfo(null);
    }
  };

  useEffect(() => {
    if (userStoryId) {
      calculateStoryPoints(userStoryId, taskId || undefined);
    } else {
      setStoryPointsInfo(null);
    }
  }, [userStoryId, taskId]);

  useEffect(() => {
    if (dueDate && estimatedHours && task) {
      calculateDailyPoints(dueDate, parseFloat(estimatedHours), task.project_id);
    } else {
      setDailyPointsInfo(null);
    }
  }, [dueDate, estimatedHours, task]);

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
      setUserStoryId((data as any).user_story_id || null);
      
      // Buscar membros atribuídos
      const { data: assignees } = await supabase
        .from("task_assignees")
        .select("user_id")
        .eq("task_id", taskId);
      
      setAssignedMembers(assignees?.map(a => a.user_id) || []);
      
      // Buscar user stories após carregar a task
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
      toast.error("Preencha o título");
      return;
    }

    if (!userStoryId) {
      toast.error("Selecione uma user story");
      return;
    }

    // Validar pontos disponíveis
    if (storyPointsInfo && estimatedHours) {
      const newHours = parseFloat(estimatedHours);
      if (!isNaN(newHours) && newHours > storyPointsInfo.available) {
        toast.error(`Esta user story só tem ${storyPointsInfo.available} pontos disponíveis. Você está tentando usar ${newHours} pontos.`);
        return;
      }
    }

    try {
      setSaving(true);
      
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
                  <SelectItem value="none">Selecione...</SelectItem>
                  {userStories.map((story) => (
                    <SelectItem key={story.id} value={story.id}>
                      {story.title} {story.story_points ? `(${story.story_points} pts)` : "(sem pontos)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {storyPointsInfo && (
                <div className={`text-sm p-3 rounded-lg border ${
                  storyPointsInfo.available < 0 
                    ? "bg-destructive/10 border-destructive text-destructive" 
                    : storyPointsInfo.available === 0
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-green-50 border-green-200 text-green-800"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pontos da User Story:</span>
                    <span className="font-bold">{storyPointsInfo.total} pts total</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Já consumidos:</span>
                    <span>{storyPointsInfo.consumed} pts</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-semibold">
                    <span>Disponíveis:</span>
                    <span>{storyPointsInfo.available} pts</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                A task herda a vinculação à sprint através da user story
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas (1h = 1 ponto)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max={storyPointsInfo?.available || undefined}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={saving}
                />
                {estimatedHours && storyPointsInfo && (
                  <p className={`text-xs ${
                    parseFloat(estimatedHours) > storyPointsInfo.available
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}>
                    {parseFloat(estimatedHours) > storyPointsInfo.available
                      ? `⚠️ Excede os pontos disponíveis (${storyPointsInfo.available} pts)`
                      : `✓ Usará ${estimatedHours} dos ${storyPointsInfo.available} pontos disponíveis`
                    }
                  </p>
                )}
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
              {dailyPointsInfo && dailyPointsInfo.daysNeeded > 1 && (
                <div className="text-sm p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
                  <p className="font-medium mb-2">⚠️ Distribuição necessária ({dailyPointsInfo.daysNeeded} dias)</p>
                  <p className="text-xs mb-2">
                    Limite: 8pts/dia. Esta task precisa ser distribuída:
                  </p>
                  <div className="space-y-1">
                    {dailyPointsInfo.distribution.map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                        <span className="font-semibold">{day.points}pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dailyPointsInfo && dailyPointsInfo.currentDayPoints > 0 && dailyPointsInfo.daysNeeded === 1 && (
                <p className="text-xs text-muted-foreground">
                  📊 Já alocados neste dia: {dailyPointsInfo.currentDayPoints}pts de 8pts
                </p>
              )}
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
