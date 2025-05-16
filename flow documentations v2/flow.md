# Course Creation and Management Flow

## Overview
This document outlines the complete flow for course creation and management functionality for the admin role in the EHS E-Learning Platform.

## Visual Flow Diagram

```
Admin Dashboard
    │
    ├── Sidebar Menu
    │   └── Course Management ─── Click
    │              │
    │              ▼
    │       Course Management Page
    │              │
    │              ├── Course List Table
    │              │   ├── Search Bar (with domain filter)
    │              │   ├── Pagination (5 items per page)
    │              │   └── Course Actions (per row)
    │              │       ├── Edit
    │              │       ├── Publish/Take Down
    │              │       ├── Delete
    │              │       └── Clone
    │              │
    │              └── Create Course Button ─── Click
    │                         │
    │                         ▼
    │                  Course Creation Form
    │                         │
    │                         ├── Basic Details
    │                         │   ├── Title*
    │                         │   ├── Domain*
    │                         │   ├── Description
    │                         │   ├── Icon/Image
    │                         │   ├── Time Limit
    │                         │   └── Passing Score
    │                         │
    │                         └── Component Builder
    │                             ├── Add Component
    │                             │   ├── Pre-Assessment
    │                             │   ├── Material
    │                             │   └── Post-Assessment
    │                             │
    │                             └── Component List
    │                                 ├── Reorderable
    │                                 ├── Edit/Delete per component
    │                                 └── Required flag toggle
```

## Backend API Design

### Course Management APIs

#### 1. Get Courses List
```
GET /api/admin/courses
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 5)
  - search: string (optional)
  - domainId: UUID (optional)
  - status: string (optional: DRAFT, PUBLISHED)

Response:
{
  "courses": [
    {
      "id": "UUID",
      "title": "string",
      "domain": {
        "id": "UUID",
        "name": "string"
      },
      "description": "string",
      "icon": "string (URL)",
      "timeLimit": number (minutes),
      "passingScore": number (percentage),
      "status": "DRAFT/PUBLISHED",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "publishedAt": "timestamp",
      "completionRate": number,
      "enrolledUsers": number
    }
  ],
  "pagination": {
    "page": number,
    "totalPages": number,
    "totalItems": number,
    "itemsPerPage": number
  }
}
```

#### 2. Create Course
```
POST /api/admin/courses
Body:
{
  "title": "string",
  "domainId": "UUID",
  "description": "string",
  "icon": "string (file upload URL)",
  "timeLimit": number,
  "passingScore": number
}

Response:
{
  "id": "UUID",
  "title": "string",
  ...
}
```

#### 3. Update Course
```
PUT /api/admin/courses/{courseId}
Body: Same as Create Course

Response: Updated course object
```

#### 4. Delete Course
```
DELETE /api/admin/courses/{courseId}

Response: 
{
  "message": "Course deleted successfully"
}
```

#### 5. Publish Course
```
POST /api/admin/courses/{courseId}/publish

Response:
{
  "message": "Course published successfully",
  "publishedAt": "timestamp"
}
```

#### 6. Take Down Course
```
POST /api/admin/courses/{courseId}/takedown

Response:
{
  "message": "Course taken down successfully"
}
```

#### 7. Clone Course
```
POST /api/admin/courses/{courseId}/clone

Response: New course object with "(Copy)" appended to title
```

### Course Component APIs

#### 1. Get Course Components
```
GET /api/admin/courses/{courseId}/components

Response:
{
  "components": [
    {
      "id": "UUID",
      "type": "PRE_ASSESSMENT/MATERIAL/POST_ASSESSMENT",
      "order": number,
      "required": boolean,
      "data": {
        // Component-specific data
        // For assessments, see assessment_flow.md
      }
    }
  ]
}
```

#### 2. Add Component
```
POST /api/admin/courses/{courseId}/components
Body:
{
  "type": "PRE_ASSESSMENT/MATERIAL/POST_ASSESSMENT",
  "order": number,
  "required": boolean,
  "data": {
    // For assessments:
    "questions": [
      {
        "question": "string",
        "type": "MCQ/TRUE_FALSE",
        "options": ["string"],
        "correctAnswer": "string/boolean"
      }
    ]
    
    // For materials:
    "title": "string",
    "type": "PDF/VIDEO/PPT",
    "driveFileId": "string", // Google Drive file ID
    "driveFileUrl": "string", // Google Drive shared link
    "fileName": "string",
    "fileSize": number,
    "duration": number (for videos)
  }
}

Response: Created component object
```

### 8. Upload Material to Google Drive
```
POST /api/admin/courses/upload-material
Body: multipart/form-data
{
  "file": File,
  "type": "PDF/VIDEO/PPT"
}

Response:
{
  "driveFileId": "string",
  "driveFileUrl": "string", 
  "fileName": "string",
  "fileSize": number,
  "mimeType": "string"
}
```

#### 3. Update Component
```
PUT /api/admin/courses/{courseId}/components/{componentId}
Body: Same as Add Component

Response: Updated component object
```

#### 4. Delete Component
```
DELETE /api/admin/courses/{courseId}/components/{componentId}

Response: 
{
  "message": "Component deleted successfully"
}
```

#### 5. Reorder Components
```
PUT /api/admin/courses/{courseId}/components/reorder
Body:
{
  "componentOrders": [
    {
      "componentId": "UUID",
      "newOrder": number
    }
  ]
}

Response:
{
  "message": "Components reordered successfully"
}
```

## Frontend Component Structure

### Course Management Page Components

```
src/pages/admin/CourseManagement/
├── CourseManagement.js (Main component)
├── CourseList.js (Table with courses)
├── CourseSearch.js (Search bar with filters)
├── CourseModal/
│   ├── CreateCourseModal.js
│   ├── EditCourseModal.js
│   └── CourseForm.js (Shared form component)
├── CourseBuilder/
│   ├── CourseBuilder.js (Component builder main)
│   ├── ComponentList.js (List of course components)
│   ├── ComponentForm/
│   │   ├── AssessmentForm.js
│   │   └── MaterialForm.js
│   └── ComponentCard.js (Individual component display)
└── utils/
    ├── courseValidation.js
    └── courseHelpers.js
```

### State Management
```javascript
// Course Management State
{
  courses: [],
  currentCourse: null,
  selectedComponents: [],
  filters: {
    search: '',
    domainId: null,
    status: 'all'
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  },
  loading: false,
  error: null
}
```

## UI/UX Layout

### Course Management Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│                        Header Bar                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Course Management                                          │
│                                                             │
│  ┌───────────────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Search courses...    │  │ Domain ▼ │  │ + New Course │ │
│  └───────────────────────┘  └──────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Title          Domain    Status    Actions              ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Safety 101    Warehouse  Published ✏️ 📤 🗑️ 📋          ││
│  │ Fire Training  General   Draft     ✏️ 📤 🗑️ 📋          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  < 1 2 3 4 5 >  Showing 1-5 of 23                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Course Creation Modal Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Course                                      X   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Course Details                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Title: _______________________________________________││
│  │ Domain: [Select Domain ▼]                              ││
│  │ Description: _________________________________________ ││
│  │ Icon: [Choose File] or use default                     ││
│  │ Time Limit: ___ minutes                                ││
│  │ Passing Score: ____%                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Course Components                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [+ Add Pre-Assessment] [+ Add Material] [+ Add Post-   ││
│  │                                          Assessment]    ││
│  │                                                        ││
│  │ 1. Pre-Assessment (Required ✓)              [✏️] [🗑️]  ││
│  │ 2. Video Material                          [✏️] [🗑️]  ││
│  │ 3. Post-Assessment (Required ✓)            [✏️] [🗑️]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancel]                              [Save Draft] [Create]│
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Backend Setup
1. Create Course model/entity
2. Create CourseComponent model/entity
3. Implement Course CRUD APIs
4. Implement CourseComponent CRUD APIs
5. Add validation and error handling

### Phase 2: Frontend Course List
1. Create CourseManagement page
2. Implement course list table
3. Add search and filter functionality
4. Implement pagination
5. Add course action buttons

### Phase 3: Course Creation
1. Create course creation modal
2. Implement basic course form
3. Add component builder UI
4. Implement component forms (assessment/material)
5. Add drag-and-drop reordering

### Phase 4: Course Operations
1. Implement edit functionality
2. Add publish/takedown features
3. Implement delete with confirmation
4. Add clone functionality
5. Add validation and error handling

### Phase 5: Polish and Testing
1. Add loading states
2. Implement error handling
3. Add success notifications
4. Write unit tests
5. Perform integration testing

## Security Considerations
- Only ADMIN role can access course management
- Validate all inputs on backend
- Sanitize file uploads
- Check user permissions before operations
- Audit log for course changes

## Future Enhancements
- Course versioning
- Draft auto-save
- Bulk operations
- Course templates
- Analytics dashboard
- Course preview mode