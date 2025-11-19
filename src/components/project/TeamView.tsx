import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    email: string | null;
  } | null;
}

interface TeamViewProps {
  projectId: string;
}

export default function TeamView({ projectId }: TeamViewProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMembers, setAddingMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    fetchMembers();
    checkIfCreator();
  }, [projectId]);

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

      const userIds = projectMembers.map(pm => pm.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const combinedData = projectMembers.map(pm => ({
        ...pm,
        profiles: profiles?.find(p => p.id === pm.user_id) || null
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

      // Filter out users already members
      const existingMemberIds = members.map(m => m.user_id);
      const newMembers = selectedUsers.filter(id => !existingMemberIds.includes(id));

      if (newMembers.length === 0) {
        toast.error("Todos os usuários selecionados já são membros");
        return;
      }

      const memberInserts = newMembers.map(userId => ({
        project_id: projectId,
        user_id: userId,
        role: 'member'
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

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isCreator && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Membros</CardTitle>
            <CardDescription>
              Convide pessoas para colaborar neste projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              {addingMembers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membros
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe ({members.length})</CardTitle>
          <CardDescription>
            Pessoas com acesso a este projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(member.profiles?.full_name, member.profiles?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.profiles?.full_name || member.profiles?.email || "Usuário"}
                    </p>
                    {member.profiles?.email && member.profiles?.full_name && (
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === 'admin' ? (
                    <Badge variant="default">
                      <Crown className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Membro</Badge>
                  )}
                  {isCreator && member.role !== 'admin' && (
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
        </CardContent>
      </Card>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {memberToRemove?.profiles?.full_name || memberToRemove?.profiles?.email} do projeto?
              Esta ação não pode ser desfeita.
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
    </div>
  );
}
