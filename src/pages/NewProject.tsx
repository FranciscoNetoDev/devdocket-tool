import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, FolderKanban } from "lucide-react";
import { toast } from "sonner";

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
  });

  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 5);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      key: prev.key === "" ? generateKey(name) : prev.key,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validação básica
    if (!formData.name.trim()) {
      toast.error("O nome do projeto é obrigatório");
      return;
    }

    if (!formData.key.trim()) {
      toast.error("A chave do projeto é obrigatória");
      return;
    }

    if (formData.key.length < 2 || formData.key.length > 10) {
      toast.error("A chave deve ter entre 2 e 10 caracteres");
      return;
    }

    setLoading(true);
    try {
      // Primeiro, verifica se existe uma organização ou cria uma padrão
      let orgId: string;
      
      const { data: existingOrg } = await (supabase as any)
        .from("organizations")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        // Cria organização padrão
        const { data: newOrg, error: orgError } = await (supabase as any)
          .from("organizations")
          .insert({ name: "Minha Organização" })
          .select()
          .single();

        if (orgError) {
          if (orgError.code === '23505') {
            toast.error("Já existe uma organização. Tente novamente.");
          }
          throw orgError;
        }
        orgId = newOrg.id;

        // Adiciona role de admin para o usuário
        await (supabase as any)
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: "admin",
            org_id: orgId,
          });
      }

      // Verifica se já existe um projeto com essa chave
      const { data: existingProject } = await (supabase as any)
        .from("projects")
        .select("id")
        .eq("key", formData.key)
        .eq("org_id", orgId)
        .maybeSingle();

      if (existingProject) {
        toast.error("Já existe um projeto com essa chave. Escolha outra.");
        setLoading(false);
        return;
      }

      // Cria o projeto
      const { data: project, error: projectError } = await (supabase as any)
        .from("projects")
        .insert({
          org_id: orgId,
          name: formData.name.trim(),
          key: formData.key.trim().toUpperCase(),
          description: formData.description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (projectError) {
        if (projectError.code === '23505') {
          toast.error("Já existe um projeto com essa chave.");
        }
        throw projectError;
      }

      // Adiciona o usuário como membro do projeto
      const { error: memberError } = await (supabase as any)
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      toast.success("Projeto criado com sucesso!");
      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Erro ao criar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Novo Projeto</h1>
              <p className="text-muted-foreground">
                Crie um projeto para organizar suas tarefas
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
            <CardDescription>
              Preencha os dados básicos do seu novo projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Plataforma E-commerce"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Um nome claro e descritivo para o projeto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Chave do Projeto *</Label>
                <Input
                  id="key"
                  placeholder="Ex: ECOM"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, key: e.target.value.toUpperCase() }))
                  }
                  required
                  disabled={loading}
                  maxLength={10}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único (até 10 caracteres). Ex: ECOM-123
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo e escopo do projeto..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  disabled={loading}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional: adicione mais contexto sobre o projeto
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Projeto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
