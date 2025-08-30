/*
  # Fix profiles table INSERT policy

  1. Security Changes
    - Drop the existing restrictive INSERT policy on profiles table
    - Create a new INSERT policy that allows authenticated users to create their own profile
    - This fixes the "Database error saving new user" issue during signup

  The previous policy was too restrictive and prevented Supabase's auth service 
  from creating user profiles during the signup process.
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows profile creation during signup
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Also ensure we have a policy for the auth service to create profiles
-- This allows the trigger function to work properly
CREATE POLICY "Enable insert for authenticated users during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);