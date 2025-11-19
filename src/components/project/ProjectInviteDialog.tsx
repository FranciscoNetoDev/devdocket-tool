import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Copy, Link as LinkIcon, Loader2, Plus, Trash2 } from "lucide-react";
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
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (invite: Invite) => {
    return invite.max_uses !== null && invite.use_count >= invite.max_uses;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convites por Link</DialogTitle>
          <DialogDescription>
            Crie links de convite para adicionar membros ao projeto
          </DialogDescription>
        </DialogHeader>

        {/* Create New Invite */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Convite
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expira em</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="expiry">
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
              <Label htmlFor="max-uses">Usos máximos</Label>
              <Input
                id="max-uses"
                type="number"
                placeholder="Ilimitado"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createInvite} disabled={creating} className="w-full">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Gerar Link
              </>
            )}
          </Button>
        </div>

        {/* Active Invites */}
        <div className="space-y-3">
          <h3 className="font-semibold">Convites Ativos</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum convite criado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => {
                const expired = isExpired(invite.expires_at);
                const maxedOut = isMaxedOut(invite);
                const inactive = expired || maxedOut;

                return (
                  <div
                    key={invite.id}
                    className={`p-3 border rounded-lg ${
                      inactive ? "bg-muted/50 opacity-60" : "bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={inactive ? "secondary" : "default"}>
                            {invite.role}
                          </Badge>
                          {expired && <Badge variant="destructive">Expirado</Badge>}
                          {maxedOut && <Badge variant="destructive">Limite atingido</Badge>}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                            {window.location.origin}/invite/{invite.token}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInviteLink(invite.token)}
                            disabled={inactive}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>
                            Expira: {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
                          </span>
                          <span>
                            Usos: {invite.use_count}
                            {invite.max_uses && `/${invite.max_uses}`}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInvite(invite.id)}
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
