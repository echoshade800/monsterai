/*
  # Create storage bucket for user photos

  1. Storage
    - Create `photos` bucket for storing user-uploaded images
    - Enable public access for photos (so they can be displayed in the app)
    
  2. Security
    - Add policy for authenticated users to upload their own photos
    - Add policy for authenticated users to read their own photos
    - Photos are accessible via public URL for display purposes
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'photos');