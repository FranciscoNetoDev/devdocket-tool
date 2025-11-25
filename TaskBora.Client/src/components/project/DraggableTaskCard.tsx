import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimated_hours: number | null;
  due_date: string | null;
  task_assignees: Array<{
    user_id: string;
    profiles: {
      name: string;
    } | null;
  }>;
}

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
  onRemove?: () => void;
}

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function DraggableTaskCard({ task, onClick, onRemove }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02]",
        "animate-fade-in",
        isDragging && "shadow-2xl ring-2 ring-primary scale-105 rotate-2 z-50"
      )}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing mt-1",
              "text-muted-foreground hover:text-primary",
              "transition-colors duration-200",
              "p-1 -ml-1 rounded hover:bg-accent"
            )}
            title="Arraste para mover"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Task Content */}
          <div className="flex-1" onClick={onClick}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                {task.title}
              </CardTitle>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    priorityColors[task.priority as keyof typeof priorityColors]
                  }`}
                  title={`Prioridade: ${task.priority}`}
                />
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0" onClick={onClick}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_hours}h
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            )}
          </div>
          {task.task_assignees.length > 0 && (
            <div className="flex -space-x-2">
              {task.task_assignees.slice(0, 3).map((assignee, idx) => (
                <Avatar key={idx} className="w-6 h-6 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {assignee.profiles?.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
