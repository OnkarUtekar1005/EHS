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
- Maven for dependency management

### Frontend
- React 19
- Material UI 7.0
- React Router DOM 7.4
- Axios for API communication
- Recharts for data visualization

## Project Structure

```
EHS/
├── EHS/                       # Backend Spring Boot application
│   ├── src/                   # Source code for backend
│   └── pom.xml                # Maven dependencies
│
├── Frontend/                  # Original frontend components
│
├── Frontend yash/             # Frontend module contributed by Yash
│   └── ehs-learning-platform/ # React application
│       ├── src/
│       │   ├── components/    # Reusable UI components
│       │   ├── contexts/      # React context providers
│       │   ├── hooks/         # Custom React hooks
│       │   ├── pages/         # Page components
│       │   ├── services/      # API service integrations
│       │   ├── styles/        # CSS and styling
│       │   └── utils/         # Utility functions
│       └── package.json       # NPM dependencies
```

## Features

- User authentication and authorization
- Interactive learning modules
- Progress tracking
- Assessment and certification
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

## Contributors

- **Onkar Utekar** ([@OnkarUtekar1005](https://github.com/OnkarUtekar1005)): Project lead, Backend development
- **Yash** ([@yashnkm](https://github.com/yashnkm)): Frontend development, UI/UX
- **GGCtechview**: Backend features and integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
