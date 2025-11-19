import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectInviteDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Invite {
  id: string;
  token: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  role: string;
  created_at: string;
}

export default function ProjectInviteDialog({
  projectId,
  open,
  onOpenChange,
}: ProjectInviteDialogProps) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState("7");
  const [maxUses, setMaxUses] = useState("");
  const [role, setRole] = useState("member");

  useEffect(() => {
    if (open) {
      fetchInvites();
    }
  }, [open, projectId]);

  // Listen for new members accepting invites
  useEffect(() => {
    if (!open || !user) return;

    const channel = supabase
      .channel('project-members-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          // Fetch the new member's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nickname, email')
            .eq('id', payload.new.user_id)
            .single();

          const memberName = profile?.full_name || profile?.nickname || profile?.email || 'Novo membro';
          
          toast.success(`${memberName} aceitou o convite!`, {
            description: 'Um novo membro entrou no projeto',
          });

          // Refresh invites to update use count
          fetchInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, projectId, user]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_invites")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      console.error("Error fetching invites:", error);
      toast.error("Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      setCreating(true);
      
      // Generate random token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

      const { error } = await supabase
        .from("project_invites")
        .insert([{
          project_id: projectId,
          token,
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses ? parseInt(maxUses) : null,
          role,
          created_by: (await supabase.auth.getUser()).data.user?.id || "",
        }]);

      if (error) throw error;

      toast.success("Link de convite criado!");
      fetchInvites();
    } catch (error: any) {
      console.error("Error creating invite:", error);
      toast.error("Erro ao criar convite");
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("project_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Convite removido!");
      fetchInvites();
    } catch (error: any) {
      console.error("Error deleting invite:", error);
      toast.error("Erro ao remover convite");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/i/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para área de transferência!");
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (invite: Invite) => {
    return invite.max_uses !== null && invite.use_count >= invite.max_uses;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Convites por Link</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Crie links de convite para adicionar membros ao projeto
          </DialogDescription>
        </DialogHeader>

        {/* Create New Invite */}
        <div className="space-y-3 sm:space-y-4 p-4 sm:p-5 border rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">Criar Novo Convite</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry" className="text-xs sm:text-sm font-medium">Expira em</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="expiry" className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-uses" className="text-xs sm:text-sm font-medium">Usos máximos</Label>
              <Input
                id="max-uses"
                type="number"
                placeholder="Ilimitado"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs sm:text-sm font-medium">Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createInvite} disabled={creating} className="w-full h-9 sm:h-10 text-sm sm:text-base">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Gerar Link de Convite
              </>
            )}
          </Button>
        </div>

        {/* Active Invites */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm sm:text-base">Convites Ativos</h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4 border-2 border-dashed rounded-xl bg-muted/20">
              <LinkIcon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Nenhum convite criado ainda
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
                Crie seu primeiro link de convite acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => {
                const expired = isExpired(invite.expires_at);
                const maxedOut = isMaxedOut(invite);
                const inactive = expired || maxedOut;

                return (
                  <div
                    key={invite.id}
                    className={`p-3 sm:p-4 border rounded-xl transition-all ${
                      inactive 
                        ? "bg-muted/30 opacity-60 border-border/50" 
                        : "bg-background hover:shadow-sm border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="flex-1 w-full min-w-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant={inactive ? "secondary" : "default"} 
                            className="capitalize font-medium text-xs"
                          >
                            {invite.role}
                          </Badge>
                          {expired && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              Expirado
                            </Badge>
                          )}
                          {maxedOut && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              Limite atingido
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50 overflow-hidden">
                          <code className="text-[10px] sm:text-xs font-mono truncate flex-1 break-all">
                            {window.location.origin}/i/{invite.token.substring(0, 8)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInviteLink(invite.token)}
                            disabled={inactive}
                            className="h-7 px-2 shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Expira:</span>
                            {new Date(invite.expires_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Usos:</span>
                            {invite.use_count}
                            {invite.max_uses && `/${invite.max_uses}`}
                            {!invite.max_uses && " / ∞"}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInvite(invite.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 self-end sm:self-start"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
