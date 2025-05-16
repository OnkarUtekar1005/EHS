# EHS E-Learning Platform - Project Overview

## Project Description
The EHS (Environment Health & Safety) E-Learning Platform is a comprehensive training and education system designed to deliver safety and compliance training to employees. The platform supports two primary user roles: administrators who create and manage training modules, and users who complete the training and track their progress.

## Core Features

### 1. User Roles

#### Admin Role
- Create, edit, and manage training modules
- Publish/unpublish courses for user access
- Manage user accounts and permissions
- Assign domains to users
- Track user progress and generate reports
- Handle user password resets
- Bulk import users

#### User Role
- Access and complete assigned training modules
- Track personal progress
- View certificates of completion
- Update profile information
- Reset password functionality

### 2. Course Management System

#### Course Structure
- **Basic Information**: Title, description, domain, icon, time limit, passing score
- **Components**: Flexible course builder with three component types:
  - Pre-assessment (MCQ or True/False questions)
  - Learning materials (PDF, Video, PPT)
  - Post-assessment (MCQ or True/False questions)
- **Flexibility**: Components can be arranged in any order with optional "required" flag

#### Course Operations
- Create new courses
- Edit existing courses (when not published)
- Publish/take down courses
- Delete courses
- Clone courses for quick duplication

### 3. Domain Management
- Categorize courses by domains (e.g., Warehouse, Office, General)
- Filter courses and users by domain
- Assign multiple domains to users

### 4. Authentication & Security
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password reset via email tokens
- Session management
- Protected routes based on user roles

## Technical Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot with Java
- **Database**: PostgreSQL (based on JPA entities)
- **Security**: Spring Security with JWT
- **Email**: JavaMailSender for notifications
- **File Storage**: Local file system for uploads

### Frontend (React)
- **Framework**: React with Material-UI
- **Routing**: React Router for navigation
- **State Management**: Context API for authentication
- **HTTP Client**: Axios for API calls
- **Styling**: Material-UI with custom CSS

### Key Technologies
- Java Spring Boot
- React.js
- PostgreSQL
- JWT Authentication
- Material-UI
- Docker support

## Current Implementation Status

### Completed Features
- User authentication (login/logout)
- User registration
- Password reset functionality
- User management (CRUD operations)
- Domain management
- Basic admin dashboard
- User profile management
- File upload system

### In Progress
- Course creation and management system
- Course component builder
- Assessment creation tools
- Learning material integration

### Pending Features
- Course completion tracking
- Progress reporting
- Certificate generation
- Advanced analytics
- Notification system
- Course versioning

## API Structure

### Authentication APIs
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/forgot-password` - Request password reset
- `/api/auth/reset-password` - Complete password reset

### Admin APIs
- `/api/admin/users/*` - User management
- `/api/admin/domains/*` - Domain management
- `/api/admin/courses/*` - Course management (to be implemented)

### User APIs
- `/api/users/profile` - User profile management
- `/api/users/courses` - User course access (to be implemented)

## Development Guidelines

### Code Organization
- Backend: Package structure by feature (controller, service, repository, model)
- Frontend: Component-based architecture with separation of concerns
- Shared components for reusability
- Utility functions for common operations

### Security Best Practices
- Input validation on both client and server
- Parameterized queries to prevent SQL injection
- XSS protection through proper escaping
- CSRF protection
- Secure password storage with bcrypt
- JWT token expiration and refresh

### Testing Strategy
- Unit tests for individual components
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Manual testing for UI/UX

## Future Roadmap

### Phase 1: Course Management (Current)
- Complete course creation system
- Implement component builder
- Add assessment tools
- Enable course publishing

### Phase 2: Learning Experience
- Course player implementation
- Progress tracking
- Assessment grading
- Certificate generation

### Phase 3: Analytics & Reporting
- User progress dashboards
- Completion reports
- Performance analytics
- Export capabilities

### Phase 4: Advanced Features
- Course templates
- Gamification elements
- Mobile app support
- Third-party integrations
- Multi-language support

## Development Environment

### Prerequisites
- Java 17+
- Node.js 16+
- PostgreSQL 13+
- Git

### Setup Instructions
1. Clone the repository
2. Set up PostgreSQL database
3. Configure application.properties
4. Run Spring Boot backend
5. Install frontend dependencies
6. Start React development server

### Environment Variables
- Database connection strings
- JWT secret key
- Email server configuration
- File upload directory
- Frontend API base URL