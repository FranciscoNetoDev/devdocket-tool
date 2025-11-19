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

interface User {
  id: string;
  full_name: string | null;
  nickname: string | null;
  email: string | null;
}

interface UserSelectProps {
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
  disabled?: boolean;
  excludeCurrentUser?: boolean;
  currentUserId?: string;
  excludeUsers?: string[];
}

export default function UserSelect({
  selectedUsers,
  onUsersChange,
  disabled = false,
  excludeCurrentUser = false,
  currentUserId,
  excludeUsers = [],
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, nickname, email")
        .order("nickname");

      if (error) throw error;

      // Filter out current user and excluded users if needed
      let filteredUsers = profiles || [];
      if (excludeCurrentUser && currentUserId) {
        filteredUsers = filteredUsers.filter(u => u.id !== currentUserId);
      }
      if (excludeUsers.length > 0) {
        filteredUsers = filteredUsers.filter(u => !excludeUsers.includes(u.id));
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onUsersChange(selectedUsers.filter(id => id !== userId));
    } else {
      onUsersChange([...selectedUsers, userId]);
    }
  };

  const getSelectedUsersDisplay = () => {
    if (selectedUsers.length === 0) return "Selecionar membros";
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.id === selectedUsers[0]);
      return user?.nickname || user?.full_name || user?.email || "Membro";
    }
    return `${selectedUsers.length} membros selecionados`;
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
            {getSelectedUsersDisplay()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar usuário..." />
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.nickname || user.full_name || user.email || user.id}
                  onSelect={() => toggleUser(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.includes(user.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {user.nickname || user.full_name || user.email || "Usuário"}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((userId) => {
            const user = users.find(u => u.id === userId);
            return (
              <Badge
                key={userId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => !disabled && toggleUser(userId)}
              >
                {user?.nickname || user?.full_name || user?.email || "Usuário"}
                {!disabled && " ×"}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
