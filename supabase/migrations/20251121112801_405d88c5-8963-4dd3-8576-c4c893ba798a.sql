-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Users can view accessible profiles" ON profiles;

-- Create a simpler and more permissive policy
-- All authenticated users can view basic profile information of other users
-- This allows admins to find and add users to projects
CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);