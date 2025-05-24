-- Database Setup Script for EHS E-Learning Platform
-- Run this script to create all necessary tables if they don't exist

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(100),
    department VARCHAR(100),
    last_generated_password VARCHAR(100),
    last_password_reset DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_domains junction table
CREATE TABLE IF NOT EXISTS user_domains (
    user_id UUID NOT NULL,
    domain_id UUID NOT NULL,
    PRIMARY KEY (user_id, domain_id),
    CONSTRAINT fk_user_domains_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_domains_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    domain_id UUID,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    has_been_published BOOLEAN DEFAULT FALSE,
    first_published_at TIMESTAMP,
    CONSTRAINT fk_course_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Create course_components table
CREATE TABLE IF NOT EXISTS course_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    order_index INTEGER,
    title VARCHAR(255),
    description TEXT,
    content JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_component_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    google_drive_file_id VARCHAR(255),
    google_drive_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_component FOREIGN KEY (component_id) REFERENCES course_components(id) ON DELETE CASCADE
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_course_progress table
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

-- Create component_progress table
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

-- Create assessment_attempts table (the missing table causing the error)
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

-- Create certificates table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_courses_domain_id ON courses(domain_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

CREATE INDEX IF NOT EXISTS idx_course_components_course_id ON course_components(course_id);
CREATE INDEX IF NOT EXISTS idx_course_components_type ON course_components(type);

CREATE INDEX IF NOT EXISTS idx_materials_component_id ON materials(component_id);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id ON user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_status ON user_course_progress(status);

CREATE INDEX IF NOT EXISTS idx_component_progress_user_id ON component_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_component_progress_component_id ON component_progress(component_id);
CREATE INDEX IF NOT EXISTS idx_component_progress_status ON component_progress(status);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_component_id ON assessment_attempts(component_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_started_at ON assessment_attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_passed ON assessment_attempts(passed);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Insert default admin user if not exists (password: admin123)
INSERT INTO users (username, email, password, role, first_name, last_name)
SELECT 'admin', 'admin@ehs.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HI/2Qa9pOhZiFp6/kPYOa', 'ADMIN', 'System', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

COMMIT;