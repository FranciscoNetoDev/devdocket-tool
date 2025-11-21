
-- Recriar a função handle_new_user com melhorias
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  user_name text;
BEGIN
  -- Get user name from metadata or use email
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_name
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default organization for the user
  INSERT INTO public.organizations (name)
  VALUES (user_name || '''s Organization')
  RETURNING id INTO new_org_id;
  
  -- Add user as admin of their organization
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (NEW.id, 'admin', new_org_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
