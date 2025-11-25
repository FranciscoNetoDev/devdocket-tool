import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS } from "@/constants/taskConstants";

interface UserStory {
  id: string;
  title: string;
  story_points: number | null;
  priority: string;
  status: string;
}

interface UserStoriesListProps {
  userStories: UserStory[];
}

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };
  return labels[priority] || priority;
};

export default function UserStoriesList({ userStories }: UserStoriesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Stories da Sprint</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {userStories.map((story) => (
            <div
              key={story.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">{story.title}</div>
                <div className="flex gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={PRIORITY_COLORS[story.priority]}
                  >
                    {getPriorityLabel(story.priority)}
                  </Badge>
                  {story.story_points && (
                    <Badge variant="outline" className="font-bold">
                      {story.story_points} pts
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
