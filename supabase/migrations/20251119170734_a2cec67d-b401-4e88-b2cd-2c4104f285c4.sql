-- Drop the restrictive policy that prevents users from seeing profiles
DROP POLICY IF EXISTS "Users can view profiles for collaboration" ON public.profiles;

-- Create a new policy that allows all authenticated users to view all profiles
-- This is needed so users can select team members when creating projects
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);