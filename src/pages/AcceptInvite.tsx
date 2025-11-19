import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteData {
  id: string;
  token: string;
  project_id: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  role: string;
  project_name: string;
  project_key: string;
  project_created_by: string;
}

interface AcceptInviteResult {
  success?: boolean;
  error?: string;
  project_id?: string;
}

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

      // Use secure function to fetch invite
      const { data, error: inviteError } = await supabase
        .rpc("get_invite_by_token", { _token: token });

      if (inviteError || !data) {
        setError("Convite não encontrado");
        return;
      }

      const inviteData = data as unknown as InviteData;

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

      // Transform data to match expected structure
      setInvite({
        ...inviteData,
        project_id: inviteData.project_id
      });
      setProject({
        id: inviteData.project_id,
        name: inviteData.project_name,
        key: inviteData.project_key
      });
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
      navigate("/auth", { state: { returnTo: `/i/${token}` } });
      return;
    }

    try {
      setAccepting(true);

      // Use secure function to accept invite
      const { data, error } = await supabase
        .rpc("accept_project_invite", { 
          _token: token,
          _user_id: user.id 
        });

      if (error) throw error;

      const result = data as unknown as AcceptInviteResult;

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.success) {
        setSuccess(true);
        toast.success("Convite aceito com sucesso!");
        
        setTimeout(() => {
          navigate(`/project/${result.project_id}`);
        }, 2000);
      }
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
        <Card className="max-w-lg w-full shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Convite Inválido</CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full h-11" size="lg">
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
        <Card className="max-w-lg w-full shadow-lg border-border/50">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Convite Aceito!</CardTitle>
            <CardDescription className="text-base">
              Você agora é membro do projeto. Redirecionando...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="max-w-lg w-full shadow-lg border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Convite para Projeto</CardTitle>
          <CardDescription className="text-base">
            Você foi convidado para colaborar em um projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-6">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2">{project?.name}</h3>
              {project?.description && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground">Papel:</span>
                  <span className="text-sm font-semibold capitalize">{invite.role}</span>
                </div>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-foreground">
                  Você precisa estar logado para aceitar este convite
                </p>
              </div>
              <Button 
                onClick={() => navigate("/auth", { state: { returnTo: `/i/${token}` } })} 
                className="w-full h-11"
                size="lg"
              >
                Fazer Login
              </Button>
            </div>
          ) : (
            <Button 
              onClick={acceptInvite} 
              disabled={accepting}
              className="w-full h-11"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Aceitando convite...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
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
