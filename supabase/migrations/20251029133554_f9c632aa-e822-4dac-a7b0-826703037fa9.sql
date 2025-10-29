-- Criar funções security definer para evitar recursão nas políticas RLS

-- Função para verificar se o usuário é membro de um projeto
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
  )
$$;

-- Função para verificar se o usuário está atribuído a alguma task do projeto
CREATE OR REPLACE FUNCTION public.is_assigned_to_project_task(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_assignees ta
    INNER JOIN public.tasks t ON ta.task_id = t.id
    WHERE ta.user_id = _user_id
      AND t.project_id = _project_id
  )
$$;

-- Função para verificar se o usuário criou o projeto
CREATE OR REPLACE FUNCTION public.is_project_creator(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND created_by = _user_id
  )
$$;

-- Função para verificar se o usuário pode acessar o projeto (qualquer uma das condições)
CREATE OR REPLACE FUNCTION public.can_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_project_creator(_user_id, _project_id) OR
    public.is_project_member(_user_id, _project_id) OR
    public.is_assigned_to_project_task(_user_id, _project_id)
  )
$$;

-- Função para verificar se o usuário pode acessar uma task
CREATE OR REPLACE FUNCTION public.can_access_task(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = _task_id
      AND (
        t.created_by = _user_id OR
        public.is_project_member(_user_id, t.project_id) OR
        EXISTS (
          SELECT 1
          FROM public.task_assignees ta
          WHERE ta.task_id = _task_id
            AND ta.user_id = _user_id
        )
      )
  )
$$;

-- ==========================================
-- POLÍTICAS RLS PARA PROJECTS
-- ==========================================

CREATE POLICY "Users can view projects they have access to"
ON public.projects
FOR SELECT
TO authenticated
USING (public.can_access_project(auth.uid(), id));

CREATE POLICY "Users can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators and members can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  public.is_project_creator(auth.uid(), id) OR
  public.is_project_member(auth.uid(), id)
);

CREATE POLICY "Project creators can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (public.is_project_creator(auth.uid(), id));

-- ==========================================
-- POLÍTICAS RLS PARA TASKS
-- ==========================================

CREATE POLICY "Users can view tasks they have access to"
ON public.tasks
FOR SELECT
TO authenticated
USING (public.can_access_task(auth.uid(), id));

CREATE POLICY "Project members can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  public.can_access_project(auth.uid(), project_id)
);

CREATE POLICY "Task creators and assignees can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (public.can_access_task(auth.uid(), id));

CREATE POLICY "Task creators can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ==========================================
-- POLÍTICAS RLS PARA PROJECT_MEMBERS
-- ==========================================

CREATE POLICY "Users can view project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project creators can add members"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_project_creator(auth.uid(), project_id));

CREATE POLICY "Project creators can update members"
ON public.project_members
FOR UPDATE
TO authenticated
USING (public.is_project_creator(auth.uid(), project_id));

CREATE POLICY "Project creators can remove members"
ON public.project_members
FOR DELETE
TO authenticated
USING (public.is_project_creator(auth.uid(), project_id));

-- ==========================================
-- POLÍTICAS RLS PARA TASK_ASSIGNEES
-- ==========================================

CREATE POLICY "Users can view task assignees"
ON public.task_assignees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_task(auth.uid(), t.id)
  )
);

CREATE POLICY "Project members can assign tasks"
ON public.task_assignees
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_project(auth.uid(), t.project_id)
  )
);

CREATE POLICY "Project members can update assignments"
ON public.task_assignees
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_project(auth.uid(), t.project_id)
  )
);

CREATE POLICY "Project members can remove assignments"
ON public.task_assignees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_project(auth.uid(), t.project_id)
  )
);

-- ==========================================
-- POLÍTICAS RLS PARA COMMENTS
-- ==========================================

CREATE POLICY "Users can view comments"
ON public.comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_task(auth.uid(), t.id)
  )
);

CREATE POLICY "Users can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_task(auth.uid(), t.id)
  )
);

CREATE POLICY "Comment creators can update comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Comment creators can delete comments"
ON public.comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ==========================================
-- POLÍTICAS RLS PARA SPRINTS
-- ==========================================

CREATE POLICY "Users can view sprints"
ON public.sprints
FOR SELECT
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can create sprints"
ON public.sprints
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can update sprints"
ON public.sprints
FOR UPDATE
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project creators can delete sprints"
ON public.sprints
FOR DELETE
TO authenticated
USING (public.is_project_creator(auth.uid(), project_id));

-- ==========================================
-- POLÍTICAS RLS PARA LABELS
-- ==========================================

CREATE POLICY "Users can view labels"
ON public.labels
FOR SELECT
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can create labels"
ON public.labels
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can update labels"
ON public.labels
FOR UPDATE
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can delete labels"
ON public.labels
FOR DELETE
TO authenticated
USING (public.can_access_project(auth.uid(), project_id));

-- ==========================================
-- POLÍTICAS RLS PARA TASK_LABELS
-- ==========================================

CREATE POLICY "Users can view task labels"
ON public.task_labels
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_task(auth.uid(), t.id)
  )
);

CREATE POLICY "Project members can add task labels"
ON public.task_labels
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_project(auth.uid(), t.project_id)
  )
);

CREATE POLICY "Project members can remove task labels"
ON public.task_labels
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_project(auth.uid(), t.project_id)
  )
);

-- ==========================================
-- POLÍTICAS RLS PARA TASK_AUDIT_LOG
-- ==========================================

CREATE POLICY "Users can view task audit logs"
ON public.task_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id
      AND public.can_access_task(auth.uid(), t.id)
  )
);

-- ==========================================
-- POLÍTICAS RLS PARA PROFILES
-- ==========================================

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ==========================================
-- POLÍTICAS RLS PARA USER_ROLES
-- ==========================================

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- POLÍTICAS RLS PARA ORGANIZATIONS
-- ==========================================

CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);