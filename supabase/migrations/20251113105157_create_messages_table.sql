/*
  # Create messages table for Monster AI chat

  1. New Tables
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `user_id` (uuid) - Reference to authenticated user
      - `type` (text) - Message type: 'user', 'assistant', or 'timestamp'
      - `content` (text) - Message text content
      - `image_url` (text, nullable) - URL to uploaded image if message contains photo
      - `avatar` (text, nullable) - Avatar emoji for assistant messages
      - `created_at` (timestamptz) - Timestamp when message was created
      
  2. Security
    - Enable RLS on `messages` table
    - Add policy for authenticated users to read their own messages
    - Add policy for authenticated users to insert their own messages
    - Add policy for authenticated users to delete their own messages
    
  3. Indexes
    - Index on user_id and created_at for efficient message queries
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('user', 'assistant', 'timestamp')),
  content text NOT NULL DEFAULT '',
  image_url text,
  avatar text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS messages_user_created_idx ON messages(user_id, created_at DESC);