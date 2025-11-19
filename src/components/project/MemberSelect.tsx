import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Member {
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

interface MemberSelectProps {
  projectId: string;
  selectedMembers: string[];
  onMembersChange: (members: string[]) => void;
  disabled?: boolean;
}

export default function MemberSelect({
  projectId,
  selectedMembers,
  onMembersChange,
  disabled = false,
}: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // Fetch project members
      const { data: projectMembers, error: membersError } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", projectId);

      if (membersError) throw membersError;
      
      if (!projectMembers || projectMembers.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch profiles for those user IDs
      const userIds = projectMembers.map(pm => pm.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const combinedData = projectMembers.map(pm => ({
        user_id: pm.user_id,
        profiles: profiles?.find(p => p.id === pm.user_id) || null
      }));

      setMembers(combinedData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      onMembersChange(selectedMembers.filter(id => id !== userId));
    } else {
      onMembersChange([...selectedMembers, userId]);
    }
  };

  const getSelectedMembersDisplay = () => {
    if (selectedMembers.length === 0) return "Selecionar membros";
    if (selectedMembers.length === 1) {
      const member = members.find(m => m.user_id === selectedMembers[0]);
      return member?.profiles?.full_name || member?.profiles?.email || "Membro";
    }
    return `${selectedMembers.length} membros selecionados`;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {getSelectedMembersDisplay()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar membro..." />
            <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.user_id}
                  value={member.profiles?.full_name || member.profiles?.email || member.user_id}
                  onSelect={() => toggleMember(member.user_id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMembers.includes(member.user_id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {member.profiles?.full_name || member.profiles?.email || "Membro"}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((userId) => {
            const member = members.find(m => m.user_id === userId);
            return (
              <Badge
                key={userId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => !disabled && toggleMember(userId)}
              >
                {member?.profiles?.full_name || member?.profiles?.email || "Membro"}
                {!disabled && " ×"}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
