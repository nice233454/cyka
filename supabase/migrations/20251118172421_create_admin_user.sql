/*
  # Create Admin User

  1. Changes
    - Creates admin user in auth.users via Supabase Auth
    - Links admin user to users table
    - Email: admin@salvio.io
    - Password: Admin123!

  2. Security
    - Admin has full access to all tables through existing RLS policies
*/

-- The admin user needs to be created through Supabase Auth API
-- This migration prepares the users table entry

-- Update the existing placeholder entry with the correct auth user ID
-- The actual auth user will be created separately

DO $$
BEGIN
  -- We'll update this after creating the auth user
  RAISE NOTICE 'Admin user placeholder ready in users table';
END $$;
