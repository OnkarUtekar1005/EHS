# EHS Learning Platform

A comprehensive learning platform for Environmental Health and Safety training and education.

## Project Overview

This platform aims to provide an interactive learning experience for EHS (Environmental Health and Safety) education, complete with user authentication, progress tracking, and comprehensive training modules.

## Architecture

The project follows a modern microservices architecture:

- **Backend**: Spring Boot application with RESTful APIs
- **Frontend**: React-based user interfaces with Material UI components

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.4
- Spring Security with JWT authentication
- Spring Data JPA
- PostgreSQL database
- Apache POI for document handling
- OpenCSV for CSV processing
- Maven for dependency management

### Frontend
- React 18.3
- Material UI 7.0
- React Router DOM 7.4
- Axios 1.8.4 for API communication
- Recharts 2.15 for data visualization
- Chart.js 4.4 with react-chartjs-2
- React Quill for rich text editing
- React Beautiful DnD for drag-and-drop interfaces

## Project Structure

```
EHS/
├── EHS/                       # Backend Spring Boot application
│   ├── src/                   # Source code for backend
│   │   ├── main/              
│   │   │   ├── java/com/ehs/elearning/
│   │   │   │   ├── controller/    # REST API endpoints
│   │   │   │   ├── model/         # Data models and entities
│   │   │   │   ├── payload/       # Request/Response objects
│   │   │   │   ├── repository/    # Data access layer
│   │   │   │   ├── security/      # Authentication & authorization
│   │   │   │   └── service/       # Business logic
│   │   │   └── resources/     # Configuration files
│   │   └── test/              # Test cases
│   ├── uploads/               # Uploaded learning materials
│   └── pom.xml                # Maven dependencies
│
├── Frontend/                  # Original frontend implementation
│
├── Frontend yash/             # Frontend module contributed by Yash
│   └── ehs-learning-platform/ # React application
│       ├── src/
│       │   ├── assets/        # Static assets and styles
│       │   ├── components/    # Reusable UI components
│       │   │   ├── auth/      # Authentication components
│       │   │   ├── dashboard/ # Dashboard widgets
│       │   │   ├── layout/    # Layout components
│       │   │   ├── learning/  # Learning material components
│       │   │   └── module/    # Training module components
│       │   ├── contexts/      # React context providers
│       │   ├── hooks/         # Custom React hooks
│       │   ├── pages/         # Page components
│       │   │   ├── admin/     # Admin pages
│       │   │   └── users/     # User pages
│       │   ├── services/      # API service integrations
│       │   ├── styles/        # CSS and styling
│       │   └── utils/         # Utility functions
│       └── package.json       # NPM dependencies
```

## Features

- User authentication and authorization
- Domain-based content organization
- Interactive learning modules with various content types
- Progress tracking and reporting
- Assessment creation and evaluation
- User management with role-based access control
- Content management system for training materials
- Responsive design for desktop and mobile devices

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL

### Backend Setup
1. Navigate to the EHS directory
2. Run `mvn clean install` to build the project
3. Configure your database connection in `application.properties`
4. Run `mvn spring-boot:run` to start the backend server

### Frontend Setup
1. Navigate to the frontend directory (`Frontend yash/ehs-learning-platform`)
2. Run `npm install` to install dependencies
3. Run `npm start` to launch the development server
4. Access the application at http://localhost:3000

## API Documentation

The backend provides RESTful APIs for:
- User management
- Authentication
- Training module management
- Learning material handling
- Progress tracking
- Assessment and evaluation

## Contributors

- **Onkar Utekar** ([@OnkarUtekar1005](https://github.com/OnkarUtekar1005)): Project lead, Backend development
- **Yash** ([@yashnkm](https://github.com/yashnkm)): Frontend development, UI/UX
- **GGCtechview**: Backend features and integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.