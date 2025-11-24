export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  icon_name?: string | null;
  created_by: string;
  org_id: string;
  updated_at: string;
}

export interface ProjectMember {
  user_id: string;
  profiles?: {
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

export interface ProjectWithMembers extends Project {
  project_members?: ProjectMember[];
}
