import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  user_id: string;
  profiles?: {
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
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

  const getDisplayName = (member: Member) => {
    return member.profiles?.full_name || member.profiles?.nickname || "Membro";
  };

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {displayMembers.map((member, index) => (
          <Tooltip key={member.user_id}>
            <TooltipTrigger asChild>
              <Avatar
                className="h-8 w-8 border-2 border-background cursor-pointer hover:z-50 transition-transform hover:scale-110"
                style={{ zIndex: displayMembers.length - index }}
              >
                {member.profiles?.avatar_url && (
                  <AvatarImage src={member.profiles.avatar_url} alt={getDisplayName(member)} />
                )}
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getDisplayName(member)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className="h-8 w-8 border-2 border-background cursor-pointer"
                style={{ zIndex: 0 }}
              >
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} {remainingCount === 1 ? 'outro membro' : 'outros membros'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
