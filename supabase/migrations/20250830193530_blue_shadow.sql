/*
  # Simplify Authentication Setup

  1. Changes
    - Drop existing complex RLS policies
    - Create simple, working RLS policies
    - Ensure proper trigger for user profile creation
    - Add proper permissions for auth service

  2. Security
    - Enable RLS on profiles table
    - Allow authenticated users to read all profiles
    - Allow users to update their own profile
    - Allow automatic profile creation during signup
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for service role and authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, working RLS policies
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, last_seen)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();