import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserMinus, Crown } from "lucide-react";
import { toast } from "sonner";
import UserSelect from "./UserSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
    nickname: string | null;
    email: string | null;
  } | null;
}

interface ManageMembersDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageMembersDialog({
  projectId,
  open,
  onOpenChange,
}: ManageMembersDialogProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMembers, setAddingMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
      checkIfCreator();
    }
  }, [open, projectId]);

  const checkIfCreator = async () => {
    try {
      const { data } = await supabase
        .from("projects")
        .select("created_by")
        .eq("id", projectId)
        .single();

      setIsCreator(data?.created_by === user?.id);
    } catch (error) {
      console.error("Error checking creator:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const { data: projectMembers, error: membersError } = await supabase
        .from("project_members")
        .select("id, user_id, role")
        .eq("project_id", projectId);

      if (membersError) throw membersError;

      if (!projectMembers || projectMembers.length === 0) {
        setMembers([]);
        return;
      }

      const userIds = projectMembers.map((pm) => pm.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, nickname, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const combinedData = projectMembers.map((pm) => ({
        ...pm,
        profiles: profiles?.find((p) => p.id === pm.user_id) || null,
      }));

      setMembers(combinedData);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erro ao carregar membros");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um membro");
      return;
    }

    try {
      setAddingMembers(true);

      const existingMemberIds = members.map((m) => m.user_id);
      const newMembers = selectedUsers.filter(
        (id) => !existingMemberIds.includes(id)
      );

      if (newMembers.length === 0) {
        toast.error("Todos os usuários selecionados já são membros");
        return;
      }

      const memberInserts = newMembers.map((userId) => ({
        project_id: projectId,
        user_id: userId,
        role: "member",
      }));

      const { error } = await supabase
        .from("project_members")
        .insert(memberInserts);

      if (error) throw error;

      toast.success(`${newMembers.length} membro(s) adicionado(s) com sucesso`);
      setSelectedUsers([]);
      fetchMembers();
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast.error("Erro ao adicionar membros");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", member.id);

      if (error) throw error;

      toast.success("Membro removido com sucesso");
      setMemberToRemove(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error("Erro ao remover membro");
    }
  };

  const getInitials = (
    nickname: string | null,
    name: string | null,
    email: string | null
  ) => {
    const displayName = nickname || name;
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Membros</DialogTitle>
            <DialogDescription>
              Adicione ou remova membros do projeto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isCreator && (
              <div className="space-y-4">
                <h3 className="font-semibold">Adicionar Membros</h3>
                <UserSelect
                  selectedUsers={selectedUsers}
                  onUsersChange={setSelectedUsers}
                  disabled={addingMembers}
                  excludeCurrentUser={false}
                  currentUserId={user?.id}
                />
                <Button
                  onClick={handleAddMembers}
                  disabled={addingMembers || selectedUsers.length === 0}
                  className="w-full"
                >
                  {addingMembers && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Membros
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">
                Membros da Equipe ({members.length})
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(
                              member.profiles?.nickname,
                              member.profiles?.full_name,
                              member.profiles?.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {member.profiles?.nickname ||
                              member.profiles?.full_name ||
                              member.profiles?.email ||
                              "Usuário"}
                          </p>
                          {member.profiles?.email &&
                            (member.profiles?.nickname ||
                              member.profiles?.full_name) && (
                              <p className="text-xs text-muted-foreground">
                                {member.profiles.email}
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === "admin" ? (
                          <Badge variant="default" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Membro
                          </Badge>
                        )}
                        {isCreator && member.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              {memberToRemove?.profiles?.nickname ||
                memberToRemove?.profiles?.full_name ||
                memberToRemove?.profiles?.email}{" "}
              do projeto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
