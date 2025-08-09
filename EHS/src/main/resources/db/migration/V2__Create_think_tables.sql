-- Create Think Submissions Table
CREATE TABLE IF NOT EXISTS think_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('QUERY', 'COMPLAINT', 'NEW_IDEA')),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    admin_response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_think_type ON think_submissions(type);
CREATE INDEX idx_think_status ON think_submissions(status);
CREATE INDEX idx_think_user_id ON think_submissions(user_id);
CREATE INDEX idx_think_created_at ON think_submissions(created_at DESC);
CREATE INDEX idx_think_is_anonymous ON think_submissions(is_anonymous);

-- Add comments for documentation
COMMENT ON TABLE think_submissions IS 'Stores user feedback, complaints, and new ideas';
COMMENT ON COLUMN think_submissions.type IS 'Type of submission: QUERY, COMPLAINT, or NEW_IDEA';
COMMENT ON COLUMN think_submissions.subject IS 'Brief subject/title of the submission';
COMMENT ON COLUMN think_submissions.description IS 'Detailed description of the submission';
COMMENT ON COLUMN think_submissions.user_id IS 'Reference to the user who submitted (null for anonymous public submissions)';
COMMENT ON COLUMN think_submissions.is_anonymous IS 'Whether the user chose to submit anonymously';
COMMENT ON COLUMN think_submissions.status IS 'Current status: OPEN, IN_PROGRESS, or RESOLVED';
COMMENT ON COLUMN think_submissions.admin_response IS 'Admin response to the submission';
COMMENT ON COLUMN think_submissions.responded_by IS 'Admin who responded to the submission';
COMMENT ON COLUMN think_submissions.responded_at IS 'Timestamp when admin responded';