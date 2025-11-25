import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedProjectRouteProps {
  children: React.ReactNode;
}

export default function ProtectedProjectRoute({ children }: ProtectedProjectRouteProps) {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [projectExists, setProjectExists] = useState(false);

  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!projectId || !user) {
        setLoading(false);
        return;
      }

      try {
        // Verificar se o projeto existe e se o usuário tem acesso
        const { data: project, error } = await supabase
          .from("projects")
          .select("id, name")
          .eq("id", projectId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar projeto:", error);
          toast.error("Erro ao verificar acesso ao projeto");
          setLoading(false);
          return;
        }

        if (!project) {
          setProjectExists(false);
          toast.error("Projeto não encontrado");
          setLoading(false);
          return;
        }

        setProjectExists(true);

        // Verificar se o usuário é membro do projeto
        const { data: membership } = await supabase
          .from("project_members")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (membership) {
          setHasAccess(true);
        } else {
          toast.error("Você não tem permissão para acessar este projeto");
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar projeto:", error);
        toast.error("Erro ao verificar acesso ao projeto");
      } finally {
        setLoading(false);
      }
    };

    checkProjectAccess();
  }, [projectId, user]);

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso ao projeto...</p>
        </div>
      </div>
    );
  }

  // Redirecionar se não tiver acesso ou projeto não existir
  if (!projectExists || !hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Renderizar a rota protegida se tudo estiver ok
  return <>{children}</>;
}
