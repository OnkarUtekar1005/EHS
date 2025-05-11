# EHS Learning Platform - Project Overview

## Introduction

The EHS (Environmental Health and Safety) Learning Platform is a comprehensive e-learning solution designed to deliver safety training and certifications to employees. The platform facilitates the creation, distribution, and tracking of training modules, assessments, and learning materials within an organization's safety program.

## Core Features

### 1. User Authentication and Authorization
- Secure JWT-based authentication system
- Role-based access control (Admin, User)
- Domain-based content organization for different departments/locations

### 2. Training Module Management
- Create and organize training modules by domain
- Flexible module components (learning materials, assessments)
- Sequential learning flows with progress tracking
- Module versioning and publishing control

### 3. Learning Materials
- Support for multiple content types:
  - Video files (MP4)
  - Documents (PDF, DOCX)
  - Presentations (PPT)
  - HTML/rich text content
  - External URLs
- Material library for content reuse across modules
- Progress tracking for individual learning materials

### 4. Assessment System
- Pre and post-assessments
- Multiple question types (multiple choice, true/false)
- Automatic grading and result reporting
- Configurable passing thresholds

### 5. Progress Tracking
- Comprehensive user progress dashboard
- Module completion status tracking
- Learning time monitoring
- Assessment score comparisons
- Certification tracking

### 6. Administrative Features
- User management with bulk import
- Domain creation and assignment
- Content creation and management tools
- Reporting and analytics

## Technical Architecture

### Backend (Spring Boot)
The backend is built using Spring Boot 3.2.4 with Java 17, providing a robust RESTful API for all platform operations. Key components include:

1. **Controller Layer**: Handles HTTP requests and defines endpoints for all features
   - AuthController: User authentication
   - DomainController: Domain management
   - TrainingModuleController: Module CRUD operations
   - ModuleComponentController: Component management
   - LearningMaterialController: Material handling
   - AssessmentController: Assessment creation and submission
   - ProgressController: User progress tracking

2. **Service Layer**: Contains business logic
   - FileStorageService: Handles file uploads and streaming
   - LearningMaterialService: Material management logic
   - ProgressTrackingService: Progress calculation and tracking

3. **Repository Layer**: Data access layer using Spring Data JPA
   - UserRepository
   - DomainRepository
   - TrainingModuleRepository
   - ModuleComponentRepository
   - LearningMaterialRepository
   - Various progress repositories

4. **Security Layer**: Authentication and authorization using Spring Security
   - JWT-based authentication
   - Role-based access control
   - Content security policies

5. **Model Layer**: Entity definitions
   - Domain, TrainingModule, ModuleComponent entities
   - Learning material entities
   - User and progress tracking entities
   - Question and assessment entities

### Frontend (React)
The frontend is built with React 18.3, using Material UI 7.0 for the component library. Key features include:

1. **Admin Dashboard**
   - Module management interface
   - User management screens
   - Content creation tools
   - Reporting and analytics

2. **User Experience**
   - Domain selection
   - Module browsing and access
   - Interactive learning material viewers
   - Assessment taking interface
   - Progress dashboards

3. **Components**
   - Authentication components
   - Learning material viewers (PDFs, videos, etc.)
   - Assessment components
   - Progress tracking visualizations

4. **Services**
   - API integration services
   - Authentication service
   - File handling and streaming
   - Progress tracking

## Data Model

The platform uses a relational database model with the following key entities:

1. **User Management**
   - Users: User accounts with authentication details
   - Roles: User roles (Admin, User)
   - Domains: Organizational divisions

2. **Content Structure**
   - TrainingModule: Top-level training units
   - ModuleComponent: Components within modules (learning, assessment)
   - ComponentType: Type enumeration (LEARNING_MATERIAL, ASSESSMENT)
   - LearningMaterial: Educational content
   - Question/Answer: Assessment questions and options

3. **Progress Tracking**
   - UserModuleProgress: Overall module progress
   - UserComponentProgress: Component completion
   - MaterialProgress: Individual material progress
   - ModuleStatus: Status enumeration (NOT_STARTED, IN_PROGRESS, COMPLETED)

## Integration Points

The platform provides integration capabilities through:

1. **RESTful APIs**: Complete API for headless integration
2. **File Storage**: Handles various file formats for learning materials
3. **Authentication**: JWT-based authentication for API access
4. **Export Capabilities**: Progress and reporting data exports

## Development Stack

### Backend
- Java 17
- Spring Boot 3.2.4
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL
- Apache POI for document handling
- OpenCSV for data imports/exports

### Frontend
- React 18.3
- Material UI 7.0
- React Router 7.4
- Axios for API communication
- Recharts for data visualization
- Chart.js for performance analytics
- React Quill for rich text editing

## Deployment Architecture

The application is designed for flexible deployment:

1. **Development**: Local development environment
2. **Testing**: Staging environment for QA
3. **Production**: Deployed as containerized application or traditional deployment

## Future Enhancements

Planned improvements for the platform include:

1. **Mobile Responsive Design**: Enhance mobile experience
2. **Offline Learning**: Support for offline learning
3. **Advanced Analytics**: More detailed insights and reporting
4. **Gamification**: Add badges, points, and leaderboards
5. **AI-Powered Recommendations**: Personalized module recommendations
6. **Localization**: Multi-language support
7. **Integration Enhancements**: LMS standards compatibility (SCORM, xAPI)

---

This EHS Learning Platform provides a complete solution for organizations to manage their safety training programs, ensuring compliance and tracking employee progress through required safety education.