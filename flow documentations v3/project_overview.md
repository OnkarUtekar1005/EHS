# EHS E-Learning Platform - Project Overview

## Project Context

An Environment, Health, and Safety (EHS) e-learning application with two main roles:
- **Admin**: Creates, manages, and publishes training modules, manages users, assigns domains, and has full access to the application
- **User**: Views and completes training modules, sees progress, generates reports

## Current Implementation Status

### ✅ Completed Features

#### Admin Module
- **User Management**
  - Add users individually or in bulk
  - List all users with their passwords
  - Assign domains to users
  - Password reset functionality
  - Domain assignment system

- **Course/Training Module Management**
  - Create, edit, delete training modules
  - Publish/take down modules
  - Module structure:
    - Pre-assessment
    - Training content (materials: PDFs, videos, documents)
    - Post-assessment
    - Basic evaluation
  - Clone existing courses
  - Course filtering by domain and status

#### Security & Authentication
- JWT-based authentication
- Role-based access control (Admin/User roles)
- Password encryption

#### Domain System
- Domains act as categories/groups
- Users are assigned to domains
- Courses are assigned to domains
- Many-to-many relationship between users and domains

### 🚧 In Progress / TODO

#### User Module
- View courses filtered by assigned domain ("My Courses")
- Access to all courses with "Show All" option
- Complete training modules
- Track progress
- Generate completion reports

#### Other Features
- Progress tracking
- Assessment submission and evaluation
- Reporting system
- Email notifications

## Technical Architecture

### Backend (Spring Boot)
- **Models**: Users, Course, Domain, CourseComponent, Material
- **Services**: CourseService, UserService, DomainService, etc.
- **Repositories**: JPA/Hibernate repositories
- **Controllers**: RESTful API endpoints
- **Security**: JWT authentication, role-based access

### Frontend (React)
- **Authentication**: JWT token management
- **Components**: Dashboard, UserManagement, CourseManagement
- **State Management**: React contexts (AuthContext)
- **UI Framework**: Material-UI
- **Routing**: React Router

### Database Structure
- **Users**: id, username, email, password, role, domains
- **Courses**: id, title, description, domain, status, components
- **Domains**: id, name, description, users
- **CourseComponents**: id, type, orderIndex, data (JSON)

## API Endpoints

### Admin Endpoints (/api/v2/admin)
- `/courses` - CRUD operations for courses
- `/courses/{id}/publish` - Publish a course
- `/courses/{id}/takedown` - Take down a course
- `/users` - User management
- `/domains` - Domain management

### User Endpoints (To be implemented)
- `/api/v2/user/courses` - Get user's courses
- `/api/v2/user/courses/all` - Get all published courses
- `/api/v2/user/progress` - Track progress
- `/api/v2/user/assessments` - Submit assessments

## Next Steps

1. **Implement User Course View**
   - Create user-specific API endpoints
   - Filter courses by user's domains
   - Add "My Courses" tab in sidebar
   - Implement "Show All" functionality

2. **Course Progress Tracking**
   - Track component completion
   - Store user progress
   - Calculate completion percentage

3. **Assessment System**
   - Create assessment submission endpoints
   - Implement evaluation logic
   - Store assessment results

4. **Reporting System**
   - Generate user progress reports
   - Create completion certificates
   - Export reports in various formats