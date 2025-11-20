-- Modify handle_new_user to also create organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  );
  
  -- Create default organization for the user
  INSERT INTO public.organizations (name)
  VALUES (user_name || '''s Organization')
  RETURNING id INTO new_org_id;
  
  -- Add user as admin of their organization
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (NEW.id, 'admin', new_org_id);
  
  RETURN NEW;
END;
$function$;