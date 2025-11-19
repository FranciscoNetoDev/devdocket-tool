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

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
