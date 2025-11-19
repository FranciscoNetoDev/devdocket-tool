import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch invite
      const { data: inviteData, error: inviteError } = await supabase
        .from("project_invites")
        .select("*, projects(id, name, description)")
        .eq("token", token)
        .single();

      if (inviteError) {
        setError("Convite não encontrado");
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("Este convite expirou");
        return;
      }

      // Check if max uses reached
      if (inviteData.max_uses !== null && inviteData.use_count >= inviteData.max_uses) {
        setError("Este convite atingiu o limite de usos");
        return;
      }

      setInvite(inviteData);
      setProject(inviteData.projects);
    } catch (error: any) {
      console.error("Error validating invite:", error);
      setError("Erro ao validar convite");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para aceitar o convite");
      navigate("/auth", { state: { returnTo: `/invite/${token}` } });
      return;
    }

    try {
      setAccepting(true);

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", invite.project_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast.success("Você já é membro deste projeto!");
        navigate(`/projects/${invite.project_id}`);
        return;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: invite.project_id,
          user_id: user.id,
          role: invite.role,
        });

      if (memberError) throw memberError;

      // Update invite use count
      const { error: updateError } = await supabase
        .from("project_invites")
        .update({ use_count: invite.use_count + 1 })
        .eq("id", invite.id);

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Convite aceito com sucesso!");
      
      setTimeout(() => {
        navigate(`/projects/${invite.project_id}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error("Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <XCircle className="h-6 w-6" />
              <CardTitle>Convite Inválido</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>Convite Aceito!</CardTitle>
            </div>
            <CardDescription>
              Você agora é membro do projeto. Redirecionando...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>Convite para Projeto</CardTitle>
          </div>
          <CardDescription>
            Você foi convidado para participar do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg mb-1">{project?.name}</h3>
            {project?.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-3 flex gap-2">
              <span className="text-xs px-2 py-1 bg-background rounded border">
                Papel: {invite.role}
              </span>
            </div>
          </div>

          {!user ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Você precisa estar logado para aceitar este convite
              </p>
              <Button 
                onClick={() => navigate("/auth", { state: { returnTo: `/invite/${token}` } })} 
                className="w-full"
              >
                Fazer Login
              </Button>
            </div>
          ) : (
            <Button 
              onClick={acceptInvite} 
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceitando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aceitar Convite
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
