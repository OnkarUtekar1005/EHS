-- Add publication tracking columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS has_been_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMP;

-- Update existing courses to set hasBeenPublished based on their status
UPDATE courses 
SET has_been_published = true,
    first_published_at = published_at
WHERE status = 'PUBLISHED' 
  AND published_at IS NOT NULL 
  AND has_been_published IS NULL;

-- Set default false for any remaining null values
UPDATE courses 
SET has_been_published = false
WHERE has_been_published IS NULL;