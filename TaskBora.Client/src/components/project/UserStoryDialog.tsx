import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Paperclip, MessageSquare, CheckSquare, Upload, Trash2, Send, Download, Eye, FileText, File, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  story?: {
    id: string;
    title: string;
    description: string | null;
    acceptance_criteria: string | null;
    story_points: number | null;
    priority: string;
    status: string;
  } | null;
  onSuccess: () => void;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
  uploaded_by: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function UserStoryDialog({
  open,
  onOpenChange,
  projectId,
  story,
  onSuccess,
}: UserStoryDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: story?.title || "",
    description: story?.description || "",
    acceptance_criteria: story?.acceptance_criteria || "",
    story_points: story?.story_points?.toString() || "",
    priority: story?.priority || "medium",
    status: story?.status || "draft",
    due_date: (story as any)?.due_date || "",
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        title: story?.title || "",
        description: story?.description || "",
        acceptance_criteria: story?.acceptance_criteria || "",
        story_points: story?.story_points?.toString() || "",
        priority: story?.priority || "medium",
        status: story?.status || "draft",
        due_date: (story as any)?.due_date || "",
      });
    }
  }, [story, open]);

  useEffect(() => {
    if (story?.id) {
      fetchRelatedData();
    }
  }, [story?.id]);

  const fetchRelatedData = async () => {
    if (!story?.id) return;

    try {
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, status, priority")
        .eq("user_story_id", story.id)
        .is("deleted_at", null);

      if (tasksData) setTasks(tasksData);

      // Fetch attachments
      const { data: attachmentsData } = await supabase
        .from("user_story_attachments")
        .select("*")
        .eq("user_story_id", story.id)
        .order("created_at", { ascending: false });

      if (attachmentsData) setAttachments(attachmentsData);

      // Fetch comments with profiles
      const { data: commentsData } = await supabase
        .from("user_story_comments")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq("user_story_id", story.id)
        .order("created_at", { ascending: true });

      if (commentsData) setComments(commentsData as any);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        acceptance_criteria: formData.acceptance_criteria || null,
        story_points: formData.story_points ? parseInt(formData.story_points) : null,
        priority: formData.priority as "low" | "medium" | "high" | "critical",
        status: formData.status,
        due_date: formData.due_date || null,
        project_id: projectId,
      };

      if (story) {
        const { error } = await supabase
          .from("user_stories")
          .update(data)
          .eq("id", story.id);

        if (error) throw error;
        toast.success("User Story atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("user_stories")
          .insert([{ ...data, created_by: user?.id! }]);

        if (error) throw error;
        toast.success("User Story criada com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving user story:", error);
      toast.error("Erro ao salvar user story");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !story?.id || !user?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${story.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-story-attachments")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-story-attachments")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("user_story_attachments")
        .insert({
          user_story_id: story.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success("Anexo enviado com sucesso!");
      fetchRelatedData();
      // Limpar o input
      e.target.value = '';
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Erro ao enviar anexo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from("user_story_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;

      toast.success("Anexo removido!");
      fetchRelatedData();
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      toast.error("Erro ao remover anexo");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !story?.id) return;

    try {
      const { error } = await supabase
        .from("user_story_comments")
        .insert([{
          user_story_id: story.id,
          content: newComment,
          user_id: user?.id!,
        }]);

      if (error) throw error;

      setNewComment("");
      toast.success("Comentário adicionado!");
      fetchRelatedData();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao adicionar comentário");
    }
  };

  const statusColors: Record<string, string> = {
    todo: "bg-gray-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
    blocked: "bg-red-500",
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{story ? "Editar" : "Nova"} User Story</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            {story && (
              <>
                <TabsTrigger value="tasks">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Anexos ({attachments.length})
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comentários ({comments.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Como usuário, eu quero..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a user story em detalhes..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acceptance_criteria">Critérios de Aceitação</Label>
                <Textarea
                  id="acceptance_criteria"
                  value={formData.acceptance_criteria}
                  onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                  placeholder="Dado que... Quando... Então..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="story_points">Story Points (Fibonacci)</Label>
                    <Select
                      value={formData.story_points}
                      onValueChange={(value) => setFormData({ ...formData, story_points: value })}
                    >
                      <SelectTrigger id="story_points">
                        <SelectValue placeholder="Selecione a complexidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muito Simples</SelectItem>
                        <SelectItem value="2">2 - Simples</SelectItem>
                        <SelectItem value="3">3 - Médio</SelectItem>
                        <SelectItem value="5">5 - Complexo</SelectItem>
                        <SelectItem value="8">8 - Muito Complexo</SelectItem>
                        <SelectItem value="13">13 - Extremamente Complexo</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Story points medem complexidade, não horas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Entrega</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    As tasks desta história não poderão ter prazo maior que esta data
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="ready">Pronta</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {story ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma task vinculada</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={statusColors[task.status]}>{task.status}</Badge>
                          <Badge variant="outline">{task.priority}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Enviando..." : "Clique para enviar um arquivo"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta imagens, PDFs, documentos, etc.
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </Label>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">Nenhum anexo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Envie imagens, documentos ou outros arquivos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((attachment) => (
                  <Card key={attachment.id} className="group hover:shadow-md transition-all overflow-hidden">
                    <CardContent className="p-0">
                      {/* Preview/Thumbnail */}
                      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        {isImageFile(attachment.file_name) ? (
                          <img
                            src={attachment.file_url}
                            alt={attachment.file_name}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewImage(attachment.file_url)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            {getFileIcon(attachment.file_name)}
                            <span className="text-xs mt-2 font-mono">
                              {attachment.file_name.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (isImageFile(attachment.file_name)) {
                                setPreviewImage(attachment.file_url);
                              } else {
                                window.open(attachment.file_url, '_blank');
                              }
                            }}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = attachment.file_url;
                              link.download = attachment.file_name;
                              link.click();
                            }}
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* File info */}
                      <div className="p-3">
                        <p className="text-sm font-medium truncate" title={attachment.file_name}>
                          {attachment.file_name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(attachment.created_at), "dd/MM/yy", { locale: ptBR })}
                          </p>
                          {attachment.file_size && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
              />
              <Button onClick={handleAddComment} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum comentário</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {comment.profiles?.full_name || "Usuário"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview da Imagem</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            <img
              src={previewImage || ''}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
