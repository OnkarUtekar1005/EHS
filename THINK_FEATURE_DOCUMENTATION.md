# Think Feature Documentation

## Overview
The Think feature is a feedback/complaint/ideas management system that allows users to submit their thoughts to improve the platform. It supports both authenticated and anonymous submissions.

## Features

### User Features
- **Submit Feedback**: Users can submit queries, complaints, or new ideas
- **Anonymous Option**: Logged-in users can choose to submit anonymously
- **View Submissions**: Users can view their submission history and admin responses
- **Track Status**: See the status of submissions (Open, In Progress, Resolved)

### Admin Features
- **View All Submissions**: Admins can view and filter all submissions
- **Respond to Submissions**: Add responses to user submissions
- **Update Status**: Change submission status as they are processed
- **Filter by Type**: View submissions by type (Query, Complaint, New Idea)

### Public Features
- **Public Submission**: Anyone can submit feedback from the landing page (always anonymous)
- **No Login Required**: Public users don't need an account to submit feedback

## Technical Implementation

### Backend Components
1. **Model**: `Think.java` - Entity for storing submissions
2. **Repository**: `ThinkRepository.java` - Database operations
3. **Service**: `ThinkService.java` - Business logic
4. **Controller**: `ThinkController.java` - REST endpoints
5. **DTOs**: Request/Response objects for data transfer

### Frontend Components
1. **ThinkForm**: Reusable form component for submissions
2. **UserThinkView**: User interface for viewing/submitting
3. **AdminThinkView**: Admin interface for managing submissions
4. **Landing Page Integration**: Public submission form

### API Endpoints

#### Public Endpoints
- `POST /api/think/public/submit` - Submit anonymous feedback (no auth required)

#### Authenticated User Endpoints
- `POST /api/think/submit` - Submit feedback (with optional anonymity)
- `GET /api/think/user/submissions` - Get user's submissions

#### Admin Endpoints
- `GET /api/think/admin/all` - Get all submissions
- `GET /api/think/admin/type/{type}` - Get submissions by type
- `POST /api/think/admin/{id}/respond` - Add response to submission
- `PUT /api/think/admin/{id}/status` - Update submission status
- `GET /api/think/admin/stats` - Get statistics

## Database Schema

```sql
Table: think_submissions
- id (BIGSERIAL PRIMARY KEY)
- type (VARCHAR - QUERY/COMPLAINT/NEW_IDEA)
- subject (VARCHAR)
- description (TEXT)
- user_id (BIGINT - nullable for anonymous)
- is_anonymous (BOOLEAN)
- created_at (TIMESTAMP)
- status (VARCHAR - OPEN/IN_PROGRESS/RESOLVED)
- admin_response (TEXT)
- responded_by (BIGINT)
- responded_at (TIMESTAMP)
```

## Usage Instructions

### For Users
1. Navigate to "Think" in the sidebar
2. Click "New Submission" button
3. Select type (Query/Complaint/New Idea)
4. Enter subject and description
5. Choose whether to submit anonymously
6. Submit the form

### For Admins
1. Navigate to "Think" in the admin sidebar
2. View submissions in the table
3. Use tabs to filter by type
4. Click "Respond" to add admin response
5. Update status as needed

### For Public Users
1. Scroll to "Share Your Thoughts" section on landing page
2. Select feedback type
3. Enter subject and description
4. Submit (always anonymous)

## Security Considerations
- Public endpoint is rate-limited to prevent spam
- Authentication required for user submissions
- Admin role required for management endpoints
- XSS protection through input sanitization
- SQL injection prevention through parameterized queries

## Future Enhancements
- Email notifications for status updates
- File attachments for submissions
- Export functionality for reports
- Analytics dashboard for submission trends
- Automatic categorization using AI