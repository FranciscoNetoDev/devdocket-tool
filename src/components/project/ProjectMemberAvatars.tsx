import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Member {
  user_id: string;
  profiles?: {
    full_name: string | null;
    nickname: string | null;
  };
}

interface ProjectMemberAvatarsProps {
  members: Member[];
  maxDisplay?: number;
}

export default function ProjectMemberAvatars({ members, maxDisplay = 3 }: ProjectMemberAvatarsProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  const getInitials = (member: Member) => {
    const name = member.profiles?.nickname || member.profiles?.full_name;
    if (!name) return "?";
    
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center -space-x-2">
      {displayMembers.map((member, index) => (
        <Avatar
          key={member.user_id}
          className="h-8 w-8 border-2 border-background"
          style={{ zIndex: displayMembers.length - index }}
        >
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(member)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar
          className="h-8 w-8 border-2 border-background"
          style={{ zIndex: 0 }}
        >
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
