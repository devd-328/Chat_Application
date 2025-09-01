/*
  # Chat Application Database Schema - Fixed Version

  Key fixes:
  - Fixed trigger function to handle edge cases
  - Fixed default room creation to not fail if no users exist
  - Better error handling and conflict resolution
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on profiles
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON profiles';
  END LOOP;
  
  -- Drop all policies on chat_rooms
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_rooms' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON chat_rooms';
  END LOOP;
  
  -- Drop all policies on messages
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON messages';
  END LOOP;
END $$;

-- Create fresh policies
-- Profiles policies
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

CREATE POLICY "Enable profile creation"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Chat rooms policies
CREATE POLICY "Users can read all chat rooms"
  ON chat_rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Users can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at, last_seen)
  VALUES (new.id, new.email, COALESCE(new.created_at, now()), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_seen = now();
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create profiles for existing users
INSERT INTO profiles (id, email, created_at, last_seen)
SELECT id, email, COALESCE(created_at, now()), now()
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Insert default chat rooms safely (only if we have users)
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user ID if any users exist
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    INSERT INTO chat_rooms (name, description, created_by) VALUES 
      ('General', 'General discussion for everyone', first_user_id),
      ('Tech Talk', 'Discuss technology and programming', first_user_id),
      ('Random', 'Random conversations and fun topics', first_user_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;