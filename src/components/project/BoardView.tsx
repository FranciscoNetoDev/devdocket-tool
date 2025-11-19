import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TaskDialog from "./TaskDialog";
import DroppableColumn from "./DroppableColumn";
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

interface BoardViewProps {
  projectId: string;
  projectKey: string;
}

const statusColumns = [
  { id: "todo", label: "A Fazer", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "in_progress", label: "Em Progresso", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "done", label: "Concluído", color: "bg-green-50 dark:bg-green-950" },
  { id: "blocked", label: "Bloqueado", color: "bg-red-50 dark:bg-red-950" },
];

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function BoardView({ projectId, projectKey }: BoardViewProps) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Arrasta após mover 8px
      },
    })
  );

  useEffect(() => {
    fetchTasks();
    
    // Realtime subscription
    const channel = supabase
      .channel('board-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Buscar sprints ativas do projeto que estão dentro do período
      const today = new Date().toISOString().split('T')[0];
      const { data: activeSprints, error: sprintError } = await supabase
        .from("sprints")
        .select("id")
        .eq("project_id", projectId)
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today);

      if (sprintError) throw sprintError;

      // Se não houver sprint ativa no período, não mostra tasks
      if (!activeSprints || activeSprints.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const sprintIds = activeSprints.map(s => s.id);

      // Buscar tasks das sprints ativas
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .in("sprint_id", sprintIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform to match interface
      const tasksWithAssignees = (data || []).map(task => ({
        ...task,
        task_assignees: []
      }));
      
      setTasks(tasksWithAssignees);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  /**
   * Atualiza o status da task quando arrastada para outra coluna
   */
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus as any }) // Type assertion necessário para enum
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("✅ Status da task atualizado!");
    } catch (error: any) {
      console.error("❌ Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da task");
      // Reverte mudança em caso de erro
      fetchTasks();
    }
  };

  /**
   * Handler quando começa a arrastar
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  /**
   * Handler quando solta o item
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overColumnId = over.id as string;

    // Verifica se é uma coluna válida
    const isValidColumn = statusColumns.some(col => col.id === overColumnId);
    
    if (isValidColumn) {
      // Task foi solta em uma coluna diferente
      const activeTask = tasks.find(t => t.id === activeTaskId);
      
      if (activeTask && activeTask.status !== overColumnId) {
        // Atualiza localmente primeiro (otimistic update)
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeTaskId
              ? { ...task, status: overColumnId }
              : task
          )
        );
        
        // Atualiza no banco de dados
        updateTaskStatus(activeTaskId, overColumnId);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Board</h2>
            <p className="text-muted-foreground">
              Visualize as tasks da sprint ativa
            </p>
          </div>
          <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Task
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground mb-2">
            Nenhuma sprint ativa no momento
          </p>
          <p className="text-sm text-muted-foreground">
            Vá para a aba "Sprints" para iniciar uma sprint
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Board</h2>
            <p className="text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
            </p>
          </div>
          <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Task
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <DroppableColumn
                key={column.id}
                id={column.id}
                label={column.label}
                color={column.color}
                tasks={columnTasks}
                onTaskClick={handleTaskClick}
              />
            );
          })}
        </div>

        {/* Overlay visual durante o drag */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-6 scale-110 opacity-80 animate-pulse">
              <DraggableTaskCard
                task={activeTask}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>

        <TaskDialog
          taskId={selectedTaskId}
          projectKey={projectKey}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onTaskUpdated={fetchTasks}
        />
      </div>
    </DndContext>
  );
}
