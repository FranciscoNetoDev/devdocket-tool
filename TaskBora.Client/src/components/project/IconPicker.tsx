import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderKanban,
  Rocket,
  Target,
  Zap,
  Star,
  Heart,
  Briefcase,
  ShoppingCart,
  Code,
  Palette,
  BookOpen,
  GraduationCap,
  Music,
  Camera,
  Smartphone,
  Laptop,
  Coffee,
  Home,
  Users,
  Settings,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  Globe,
  Shield,
  Award,
  Flag,
  Package,
  CheckCircle2,
  Activity,
  BarChart,
  PieChart,
  Layers,
  Search,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de ícones disponíveis com seus nomes
const availableIcons: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "folder-kanban", icon: FolderKanban, label: "Pasta Kanban" },
  { name: "rocket", icon: Rocket, label: "Foguete" },
  { name: "target", icon: Target, label: "Alvo" },
  { name: "zap", icon: Zap, label: "Raio" },
  { name: "star", icon: Star, label: "Estrela" },
  { name: "heart", icon: Heart, label: "Coração" },
  { name: "briefcase", icon: Briefcase, label: "Maleta" },
  { name: "shopping-cart", icon: ShoppingCart, label: "Carrinho" },
  { name: "code", icon: Code, label: "Código" },
  { name: "palette", icon: Palette, label: "Paleta" },
  { name: "book-open", icon: BookOpen, label: "Livro" },
  { name: "graduation-cap", icon: GraduationCap, label: "Formatura" },
  { name: "music", icon: Music, label: "Música" },
  { name: "camera", icon: Camera, label: "Câmera" },
  { name: "smartphone", icon: Smartphone, label: "Celular" },
  { name: "laptop", icon: Laptop, label: "Laptop" },
  { name: "coffee", icon: Coffee, label: "Café" },
  { name: "home", icon: Home, label: "Casa" },
  { name: "users", icon: Users, label: "Usuários" },
  { name: "settings", icon: Settings, label: "Configurações" },
  { name: "trending-up", icon: TrendingUp, label: "Crescimento" },
  { name: "dollar-sign", icon: DollarSign, label: "Dinheiro" },
  { name: "message-square", icon: MessageSquare, label: "Mensagem" },
  { name: "mail", icon: Mail, label: "Email" },
  { name: "calendar", icon: Calendar, label: "Calendário" },
  { name: "clock", icon: Clock, label: "Relógio" },
  { name: "globe", icon: Globe, label: "Globo" },
  { name: "shield", icon: Shield, label: "Escudo" },
  { name: "award", icon: Award, label: "Prêmio" },
  { name: "flag", icon: Flag, label: "Bandeira" },
  { name: "package", icon: Package, label: "Pacote" },
  { name: "check-circle-2", icon: CheckCircle2, label: "Concluído" },
  { name: "activity", icon: Activity, label: "Atividade" },
  { name: "bar-chart", icon: BarChart, label: "Gráfico Barras" },
  { name: "pie-chart", icon: PieChart, label: "Gráfico Pizza" },
  { name: "layers", icon: Layers, label: "Camadas" },
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export default function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedIcon = availableIcons.find((i) => i.name === value);
  const SelectedIconComponent = selectedIcon?.icon || FolderKanban;

  const filteredIcons = availableIcons.filter((icon) =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <SelectedIconComponent className="w-4 h-4 text-primary" />
              </div>
              <span>{selectedIcon?.label || "Selecionar ícone"}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ícone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-4 gap-2 p-4">
              {filteredIcons.map((icon) => {
                const IconComponent = icon.icon;
                const isSelected = value === icon.name;
                return (
                  <button
                    key={icon.name}
                    onClick={() => {
                      onChange(icon.name);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent"
                    )}
                    title={icon.label}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs text-center line-clamp-1">
                      {icon.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ícone encontrado
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Export helper function to get icon component by name
export function getIconComponent(iconName: string): LucideIcon {
  const icon = availableIcons.find((i) => i.name === iconName);
  return icon?.icon || FolderKanban;
}
