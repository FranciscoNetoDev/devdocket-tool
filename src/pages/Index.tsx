import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Rocket, Users, BarChart3, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Rocket,
      title: "Gestão Ágil",
      description: "Gerencie sprints, backlog e entregas com metodologias ágeis",
    },
    {
      icon: Users,
      title: "Colaboração em Equipe",
      description: "Trabalhe junto com seu time em tempo real",
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Acompanhe métricas e progresso com dashboards visuais",
    },
    {
      icon: Zap,
      title: "Automação Inteligente",
      description: "Automatize tarefas repetitivas e ganhe produtividade",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-6 shadow-large">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gerencie Projetos com Eficiência
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A plataforma completa de gestão de projetos para times de desenvolvimento e PMs.
            Organize tarefas, sprints e entregas em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
              Fazer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recursos Poderosos</h2>
            <p className="text-muted-foreground text-lg">
              Tudo que você precisa para gerenciar seus projetos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-medium transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border shadow-medium">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Por que escolher TaskFlow?</h2>
              <div className="space-y-4">
                {[
                  "Gestão completa de projetos e tarefas",
                  "Quadros Kanban e Sprints ágeis",
                  "Controle de permissões por função",
                  "Comentários e colaboração em tempo real",
                  "Relatórios e métricas de progresso",
                  "Exportação de dados (CSV/JSON)",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-primary/20 bg-gradient-primary text-white shadow-large">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
              <p className="text-lg opacity-90 mb-8">
                Crie sua conta gratuitamente e comece a gerenciar seus projetos hoje mesmo.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">TaskFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TaskFlow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
