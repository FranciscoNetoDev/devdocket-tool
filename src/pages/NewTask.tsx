import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MemberSelect from "@/components/project/MemberSelect";

export default function NewTask() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Database["public"]["Enums"]["task_priority"]>("medium");
  const [status, setStatus] = useState<Database["public"]["Enums"]["task_status"]>("todo");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [userStoryId, setUserStoryId] = useState<string | null>(null);
  const [userStories, setUserStories] = useState<Array<{ id: string; title: string; story_points: number | null }>>([]);
  const [dailyPointsInfo, setDailyPointsInfo] = useState<{
    currentDayPoints: number;
    daysNeeded: number;
    distribution: Array<{ date: string; points: number }>;
  } | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchUserStories();
    }
  }, [projectId]);

  useEffect(() => {
    if (dueDate && estimatedHours && projectId) {
      calculateDailyPoints(dueDate, parseFloat(estimatedHours), projectId);
    } else {
      setDailyPointsInfo(null);
    }
  }, [dueDate, estimatedHours, projectId]);

  const fetchUserStories = async () => {
    if (!projectId) return;

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

  // Função removida - Story points não estão relacionados com horas das tasks
  // Story points medem complexidade (valores Fibonacci), tasks medem horas

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

      // Calcular pontos já alocados no dia selecionado
      const tasksOnDate = (projectTasks || [])
        .filter(t => t.due_date === selectedDate);
      
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
          .filter(t => t.due_date === dateStr);
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

  /**
   * Submete o formulário de criação de task
   * Fluxo:
   * 1. Validação dos campos obrigatórios (título, projeto, usuário)
   * 2. Verificação se usuário está vinculado ao projeto
   * 3. Criação da task no banco via Supabase
   * 4. Atribuição de membros à task (se houver)
   * 5. Redirecionamento para a página do projeto
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: título obrigatório
    if (!title.trim()) {
      toast.error("Por favor, preencha o título da task");
      return;
    }

    if (!userStoryId) {
      toast.error("Por favor, selecione uma User Story");
      return;
    }

    // Validar limite de 8 horas por dia
    if (dailyPointsInfo && estimatedHours && dueDate) {
      const newHours = parseFloat(estimatedHours);
      if (!isNaN(newHours)) {
        if (dailyPointsInfo.daysNeeded === 1 && dailyPointsInfo.currentDayPoints + newHours > 8) {
          toast.error(`Limite de 8pts/dia excedido! Dia ${new Date(dueDate).toLocaleDateString('pt-BR')} já tem ${dailyPointsInfo.currentDayPoints}pts alocados. Você pode alocar no máximo ${8 - dailyPointsInfo.currentDayPoints}pts neste dia.`);
          return;
        }
        if (dailyPointsInfo.daysNeeded > 1) {
          toast.error(`Esta task de ${newHours}pts não cabe no dia ${new Date(dueDate).toLocaleDateString('pt-BR')} (já tem ${dailyPointsInfo.currentDayPoints}pts). Escolha uma data com mais disponibilidade ou reduza as horas estimadas.`);
          return;
        }
      }
    }

    // Validação: projeto deve estar identificado
    if (!projectId) {
      toast.error("Projeto não identificado. Tente voltar e acessar novamente.");
      return;
    }

    // Validação: usuário deve estar autenticado
    if (!user || !user.id) {
      toast.error("Você precisa estar autenticado para criar tasks");
      return;
    }

    try {
      setLoading(true);
      
      // VERIFICAÇÃO PRÉVIA: Checa se o usuário está vinculado ao projeto
      const { data: membershipCheck, error: membershipError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      // Também verifica se é o criador do projeto
      const { data: projectCheck, error: projectError } = await supabase
        .from("projects")
        .select("id, created_by")
        .eq("id", projectId)
        .maybeSingle();
      
      if (membershipError || projectError) {
        console.error("Erro ao verificar vínculo:", { membershipError, projectError });
        toast.error("Erro ao verificar suas permissões no projeto");
        return;
      }
      
      const isMember = membershipCheck !== null;
      const isCreator = projectCheck?.created_by === user.id;
      
      if (!isMember && !isCreator) {
        toast.error("❌ Você não está vinculado a este projeto. Solicite ao administrador para adicionar você como membro.");
        return;
      }
      
      // Monta o payload da task com os dados do formulário
      const taskPayload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        project_id: projectId,
        user_story_id: userStoryId,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        due_date: dueDate || null,
      };
      
      // Usa a função SECURITY DEFINER para criar a task
      // Isso bypassa problemas de RLS mantendo todas as verificações de segurança
      const { data: taskData, error: taskError } = await supabase.rpc('create_task', {
        p_title: taskPayload.title,
        p_description: taskPayload.description,
        p_priority: taskPayload.priority,
        p_status: taskPayload.status,
        p_project_id: taskPayload.project_id,
        p_user_story_id: taskPayload.user_story_id,
        p_estimated_hours: taskPayload.estimated_hours,
        p_due_date: taskPayload.due_date,
      });

      if (taskError) {
        console.error("❌ Erro ao criar task:", taskError);
        
        // Tratamento de erros específicos da função
        if (taskError.message?.includes('não tem permissão')) {
          toast.error("❌ Você não tem permissão para criar tasks neste projeto.");
        } else if (taskError.message?.includes('não autenticado')) {
          toast.error("❌ Sessão expirada. Por favor, faça login novamente.");
        } else if (taskError.code === "23503") {
          // Foreign key violation
          toast.error("❌ Projeto não encontrado ou inválido. Tente recarregar a página.");
        } else if (taskError.code === "23505") {
          // Unique constraint violation
          toast.error("❌ Já existe uma task com essas características.");
        } else {
          // Erro genérico - mostra a exception completa
          const errorDetails = `
Código: ${taskError.code || 'N/A'}
Mensagem: ${taskError.message || 'Erro desconhecido'}
Detalhes: ${taskError.details || 'N/A'}
Hint: ${taskError.hint || 'N/A'}
          `.trim();
          
          toast.error(
            <div className="space-y-2">
              <div className="font-semibold">❌ Erro ao criar task:</div>
              <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32">
                {errorDetails}
              </pre>
            </div>,
            { duration: 8000 }
          );
          
          console.error("Exception completa:", taskError);
        }
        return;
      }

      // Converte o resultado JSON para objeto
      const createdTask = typeof taskData === 'string' ? JSON.parse(taskData) : taskData;

      // Se houver user story selecionada, atualiza a task
      if (userStoryId && createdTask) {
        const { error: storyError } = await supabase
          .from("tasks")
          .update({ user_story_id: userStoryId })
          .eq("id", createdTask.id);

        if (storyError) {
          console.error("Error linking user story:", storyError);
        }
      }

      // Se houver membros selecionados, atribui eles à task
      if (assignedMembers.length > 0 && createdTask) {
        const assignees = assignedMembers.map(userId => ({
          task_id: createdTask.id,
          user_id: userId,
        }));

        const { error: assigneesError } = await supabase
          .from("task_assignees")
          .insert(assignees);

        if (assigneesError) {
          console.error("Error assigning members:", assigneesError);
          toast.warning("Task criada, mas houve erro ao atribuir membros. Você pode fazer isso depois.");
          navigate(`/projects/${projectId}`);
          return;
        }
      }

      toast.success("✅ Task criada com sucesso!");
      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      // Captura qualquer erro não tratado e mostra a exception completa
      console.error("❌ Erro inesperado ao criar task:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : JSON.stringify(error, null, 2);
      
      toast.error(
        <div className="space-y-2">
          <div className="font-semibold">❌ Erro inesperado:</div>
          <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32">
            {errorMessage}
          </pre>
          <div className="text-xs opacity-70">
            Verifique o console do navegador para mais detalhes
          </div>
        </div>,
        { duration: 10000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Projeto
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Nova Task</CardTitle>
            <CardDescription>
              Preencha os detalhes da nova task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Implementar autenticação"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os detalhes da task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as Database["public"]["Enums"]["task_priority"])} disabled={loading}>
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
                  <Select value={status} onValueChange={(val) => setStatus(val as Database["public"]["Enums"]["task_status"])} disabled={loading}>
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
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ex: 8"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tasks são medidas em horas, independente dos story points
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Entrega</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={loading}
                  />
                  {dailyPointsInfo && dailyPointsInfo.daysNeeded > 1 && (
                    <div className="text-sm p-3 rounded-lg border bg-destructive/10 border-destructive text-destructive">
                      <p className="font-medium mb-2">🚫 Task não cabe no dia selecionado!</p>
                      <p className="text-xs mb-2">
                        Esta task de {estimatedHours}pts precisa de {dailyPointsInfo.daysNeeded} dias (limite: 8pts/dia).
                        Dia {dueDate && new Date(dueDate).toLocaleDateString('pt-BR')} já tem {dailyPointsInfo.currentDayPoints}pts alocados.
                      </p>
                      <p className="text-xs font-medium">
                        Escolha outra data ou reduza as horas estimadas.
                      </p>
                    </div>
                  )}
                  {dailyPointsInfo && dailyPointsInfo.currentDayPoints > 0 && dailyPointsInfo.daysNeeded === 1 && 
                    estimatedHours && parseFloat(estimatedHours) + dailyPointsInfo.currentDayPoints <= 8 && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Disponível: {8 - dailyPointsInfo.currentDayPoints - parseFloat(estimatedHours)}pts restantes neste dia
                    </p>
                  )}
                  {dailyPointsInfo && estimatedHours && dueDate && 
                    dailyPointsInfo.currentDayPoints + parseFloat(estimatedHours) > 8 && 
                    dailyPointsInfo.daysNeeded === 1 && (
                    <div className="text-sm p-3 rounded-lg border bg-destructive/10 border-destructive text-destructive">
                      <p className="font-medium">🚫 Limite de 8pts/dia excedido!</p>
                      <p className="text-xs mt-1">
                        Dia {new Date(dueDate).toLocaleDateString('pt-BR')} já tem {dailyPointsInfo.currentDayPoints}pts alocados.
                        Máximo permitido: {8 - dailyPointsInfo.currentDayPoints}pts
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Atribuir a</Label>
                <MemberSelect
                  projectId={projectId!}
                  selectedMembers={assignedMembers}
                  onMembersChange={setAssignedMembers}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userStory">User Story *</Label>
                {userStories.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma user story encontrada neste projeto
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/projects/${projectId}?view=stories`)}
                    >
                      Criar User Story
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select 
                      value={userStoryId || ""} 
                      onValueChange={setUserStoryId} 
                      disabled={loading}
                      required
                    >
                      <SelectTrigger id="userStory" className={!userStoryId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione uma user story" />
                      </SelectTrigger>
                      <SelectContent>
                        {userStories.map((story) => (
                          <SelectItem key={story.id} value={story.id}>
                            {story.title} {story.story_points ? `(${story.story_points} pts)` : "(sem pontos)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Toda task deve estar vinculada a uma user story
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !userStoryId || userStories.length === 0 || (dailyPointsInfo !== null && (
                    (dailyPointsInfo.daysNeeded === 1 && estimatedHours && dailyPointsInfo.currentDayPoints + parseFloat(estimatedHours) > 8) ||
                    dailyPointsInfo.daysNeeded > 1
                  ))}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Task
                </Button>
              </div>
              {!userStoryId && userStories.length > 0 && (
                <p className="text-sm text-destructive text-center">
                  Selecione uma user story para continuar
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
