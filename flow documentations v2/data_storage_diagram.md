# Data Storage Architecture for Assessments

## Overview
This document explains where and how assessment data is stored in the EHS E-Learning Platform.

## Database Schema

```
┌─────────────────────┐
│      courses        │
├─────────────────────┤
│ id (UUID) PK        │
│ title (VARCHAR)     │
│ description (TEXT)  │
│ domain_id (UUID) FK │
│ status (VARCHAR)    │
│ ...                 │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────┐
│      course_components           │
├─────────────────────────────────┤
│ id (UUID) PK                    │
│ course_id (UUID) FK             │
│ type (VARCHAR)                  │ ← "PRE_ASSESSMENT", "POST_ASSESSMENT", "MATERIAL"
│ order_index (INTEGER)           │
│ required (BOOLEAN)              │
│ data (JSONB)                    │ ← ALL ASSESSMENT DATA STORED HERE
│ created_at (TIMESTAMP)          │
│ updated_at (TIMESTAMP)          │
└─────────────────────────────────┘
```

## Data Column Structure (JSONB)

The `data` column in `course_components` stores all assessment-specific information as JSON:

```json
{
  "title": "Safety Knowledge Pre-Assessment",
  "passingScore": 70,
  "timeLimit": 30,
  "shuffleQuestions": false,
  "showResults": true,
  "allowRetake": true,
  "maxAttempts": 3,
  "questions": [
    {
      "id": "q1",
      "question": "What is the primary purpose of PPE?",
      "type": "MCQ",
      "points": 10,
      "required": true,
      "options": [
        {
          "id": "opt1",
          "text": "To look professional",
          "isCorrect": false
        },
        {
          "id": "opt2",
          "text": "To protect workers from hazards",
          "isCorrect": true
        }
      ],
      "correctAnswer": "To protect workers from hazards",
      "explanation": "PPE's primary purpose is..."
    },
    {
      "id": "q2",
      "question": "Hard hats are required in construction zones",
      "type": "TRUE_FALSE",
      "points": 5,
      "required": true,
      "correctAnswer": true,
      "explanation": "Hard hats are mandatory..."
    }
  ]
}
```

## Data Flow

### 1. Frontend to Backend

```
Frontend (AssessmentForm.js)
    │
    ├── Collects assessment data
    ├── Validates form
    └── Sends POST/PUT request
        │
        ▼
Backend API (/api/admin/courses/{courseId}/components)
    │
    ├── Receives JSON payload
    ├── Creates CourseComponent object
    ├── Sets type = "PRE_ASSESSMENT" or "POST_ASSESSMENT"
    ├── Sets required = true/false
    └── Sets data = JSON object with all assessment details
        │
        ▼
Database (course_components table)
    │
    └── Stores as JSONB in data column
```

### 2. Backend to Frontend

```
Database (course_components table)
    │
    ├── Retrieves component with JSONB data
    │
    ▼
Backend API
    │
    ├── Fetches CourseComponent
    ├── Returns JSON response
    │
    ▼
Frontend
    │
    └── Displays assessment data in UI
```

## Example API Calls

### Creating an Assessment
```javascript
POST /api/admin/courses/{courseId}/components
{
  "type": "PRE_ASSESSMENT",
  "required": true,
  "data": {
    "title": "Pre-Course Assessment",
    "passingScore": 70,
    "timeLimit": 30,
    "questions": [
      {
        "id": "q1",
        "question": "What is safety?",
        "type": "MCQ",
        "points": 10,
        "options": [...]
      }
    ]
  }
}
```

### Retrieving Components
```javascript
GET /api/admin/courses/{courseId}/components
// Returns array of components with full data
[
  {
    "id": "component-uuid",
    "type": "PRE_ASSESSMENT",
    "orderIndex": 1,
    "required": true,
    "data": {
      // Full assessment data
    }
  }
]
```

## Benefits of JSONB Storage

1. **Flexibility**: Can store complex nested structures without schema changes
2. **Performance**: PostgreSQL JSONB provides indexing and fast queries
3. **Simplicity**: No need for separate tables for questions, options, etc.
4. **Extensibility**: Easy to add new fields without migration

## Alternative Approach (Not Currently Used)

If we wanted normalized storage:

```
course_components
    │
    ├── assessments (1:1)
    │   ├── id
    │   ├── component_id
    │   ├── title
    │   ├── passing_score
    │   └── time_limit
    │
    └── questions (1:N)
        ├── id
        ├── assessment_id
        ├── question_text
        ├── type
        └── points
            │
            └── question_options (1:N)
                ├── id
                ├── question_id
                ├── option_text
                └── is_correct
```

But JSONB is preferred for this use case due to:
- Simpler queries
- Better performance for read-heavy operations
- Easier to maintain
- Natural fit for JSON API responses