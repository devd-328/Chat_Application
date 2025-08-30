/*
  # Add user signup trigger

  1. New Functions
    - `handle_new_user()` - Trigger function to automatically create profile when user signs up
  
  2. New Triggers
    - `on_auth_user_created` - Trigger that fires when a new user is created in auth.users
  
  3. Security
    - Updated RLS policy to allow the trigger function to insert profiles
  
  This migration fixes the "Database error saving new user" issue by ensuring that when a user signs up through Supabase Auth, a corresponding profile record is automatically created in the profiles table.
*/

-- Create the trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, last_seen)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policy to allow the trigger function to insert profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Enable insert for service role and authenticated users"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);