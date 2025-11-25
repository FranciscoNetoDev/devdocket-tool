import { FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIconComponent } from "./IconPicker";

interface ProjectIconProps {
  projectKey?: string;
  iconName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showKey?: boolean;
}

const sizeMap = {
  sm: {
    container: "w-8 h-8",
    icon: "w-4 h-4",
    text: "text-xs"
  },
  md: {
    container: "w-12 h-12",
    icon: "w-5 h-5",
    text: "text-sm"
  },
  lg: {
    container: "w-16 h-16",
    icon: "w-7 h-7",
    text: "text-base"
  }
};

export default function ProjectIcon({ 
  projectKey, 
  iconName,
  size = "md", 
  className,
  showKey = true 
}: ProjectIconProps) {
  const sizes = sizeMap[size];
  const IconComponent = iconName ? getIconComponent(iconName) : FolderKanban;
  
  return (
    <div 
      className={cn(
        "rounded-lg bg-primary/10 flex items-center justify-center transition-colors",
        sizes.container,
        className
      )}
    >
      {showKey && projectKey ? (
        <span className={cn("font-bold text-primary", sizes.text)}>
          {projectKey}
        </span>
      ) : (
        <IconComponent className={cn("text-primary", sizes.icon)} />
      )}
    </div>
  );
}
