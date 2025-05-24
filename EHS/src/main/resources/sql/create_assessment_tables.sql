-- Create assessment_attempts table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    component_id UUID NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    answers JSONB,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    time_taken_seconds BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_assessment_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_attempt_component FOREIGN KEY (component_id) REFERENCES course_components(id) ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT uk_user_component_attempt UNIQUE (user_id, component_id, attempt_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_component_id ON assessment_attempts(component_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_started_at ON assessment_attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_passed ON assessment_attempts(passed);

-- Also ensure other related tables exist
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    certificate_data JSONB,
    
    CONSTRAINT fk_certificate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    completed_at TIMESTAMP,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_course_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_course_progress_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_course_progress UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS component_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    component_id UUID NOT NULL,
    user_course_progress_id UUID,
    completed_at TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    attempts_count INTEGER DEFAULT 0,
    max_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_component_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_component_progress_component FOREIGN KEY (component_id) REFERENCES course_components(id) ON DELETE CASCADE,
    CONSTRAINT fk_component_progress_user_course FOREIGN KEY (user_course_progress_id) REFERENCES user_course_progress(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_component_progress UNIQUE (user_id, component_id)
);

-- Create indexes for component_progress
CREATE INDEX IF NOT EXISTS idx_component_progress_user_id ON component_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_component_progress_component_id ON component_progress(component_id);
CREATE INDEX IF NOT EXISTS idx_component_progress_status ON component_progress(status);