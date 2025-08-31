/*
  # Complete Authentication Setup Fix

  1. New Tables
    - Ensures `profiles` table exists with proper structure
    - `id` (uuid, primary key, references auth.users)
    - `email` (text, unique)
    - `created_at` (timestamp)
    - `last_seen` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add permissive policies for profile creation during signup
    - Add policies for authenticated users to manage their data

  3. Triggers
    - Auto-create profile when user signs up
    - Handle user creation seamlessly
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, permissive policies
CREATE POLICY "Enable insert for service role and authenticated users"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on user_id"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, last_seen)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure chat_rooms table exists
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can read all chat rooms" ON chat_rooms;

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read all chat rooms"
  ON chat_rooms
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure messages table exists
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can read all messages" ON messages;

CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Insert a default chat room if none exist
INSERT INTO chat_rooms (name, description)
SELECT 'General', 'Welcome to the general chat room!'
WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'General');