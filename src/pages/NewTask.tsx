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
   * 2. Criação da task no banco via Supabase
   * 3. Atribuição de membros à task (se houver)
   * 4. Redirecionamento para a página do projeto
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
      
      // Monta o payload da task com os dados do formulário
      const taskPayload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        project_id: projectId,
        created_by: user.id, // Importante: define o criador como o usuário logado
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        due_date: dueDate || null,
      };
      
      // Cria a task no Supabase
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert([taskPayload])
        .select()
        .single();

      if (taskError) {
        console.error("Error creating task:", taskError);
        
        // Tratamento de erros com mensagens amigáveis
        if (taskError.code === "42501") {
          toast.error("Você não tem permissão para criar tasks neste projeto. Verifique se você é membro do projeto.");
        } else if (taskError.code === "23503") {
          toast.error("Projeto não encontrado ou inválido. Tente recarregar a página.");
        } else if (taskError.message.includes("permission")) {
          toast.error("Você não tem permissão para realizar esta ação.");
        } else {
          toast.error(`Erro ao criar task: ${taskError.message || "Erro desconhecido"}`);
        }
        return;
      }

      // Se houver membros selecionados, atribui eles à task
      if (assignedMembers.length > 0 && taskData) {
        const assignees = assignedMembers.map(userId => ({
          task_id: taskData.id,
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
      console.error("Unexpected error creating task:", error);
      toast.error("Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card shadow-soft">
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
