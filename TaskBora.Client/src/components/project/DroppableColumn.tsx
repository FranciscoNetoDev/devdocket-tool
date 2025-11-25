import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DraggableTaskCard from "./DraggableTaskCard";

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

interface DroppableColumnProps {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
}

export default function DroppableColumn({
  id,
  label,
  color,
  tasks,
  onTaskClick,
  onRemoveTask,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col animate-fade-in">
      <div className={`rounded-t-lg px-4 py-3 ${color} transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{label}</h3>
          <Badge variant="secondary" className="animate-scale-in">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 p-2 min-h-[200px] rounded-b-lg",
          "transition-all duration-300 ease-in-out",
          isOver
            ? "bg-primary/20 ring-2 ring-primary ring-inset shadow-lg scale-[1.01]"
            : "bg-muted/30"
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              onRemove={onRemoveTask ? () => onRemoveTask(task.id) : undefined}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma task
          </div>
        )}
      </div>
    </div>
  );
}
