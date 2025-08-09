-- Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    expires_at TIMESTAMP NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_active_priority ON announcements(is_active, priority, created_at DESC);

-- Composite index for active non-expired announcements
CREATE INDEX idx_announcements_active_non_expired ON announcements(is_active, expires_at, priority, created_at DESC) 
WHERE is_active = true;

-- Index for text search
CREATE INDEX idx_announcements_text_search ON announcements USING gin(to_tsvector('english', title || ' ' || content || ' ' || author_name));

-- Add comments for documentation
COMMENT ON TABLE announcements IS 'Stores system announcements created by administrators';
COMMENT ON COLUMN announcements.title IS 'Title of the announcement';
COMMENT ON COLUMN announcements.content IS 'Full content/body of the announcement';
COMMENT ON COLUMN announcements.created_by IS 'UUID of the admin user who created this announcement';
COMMENT ON COLUMN announcements.author_name IS 'Display name of the announcement author';
COMMENT ON COLUMN announcements.created_at IS 'Timestamp when the announcement was created';
COMMENT ON COLUMN announcements.is_active IS 'Whether the announcement is currently active/visible';
COMMENT ON COLUMN announcements.priority IS 'Priority level: LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN announcements.expires_at IS 'Optional expiration timestamp (NULL means never expires)';