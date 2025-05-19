# Course Creation API Guide

## Backend API Endpoints for Course Components

### 1. Get Materials List
```
GET /api/v2/materials
```
- Returns list of all available materials that can be added to a course

### 2. Add Component to Course
```
POST /api/v2/admin/courses/{courseId}/components
```

**Request Body for Material Component:**
```json
{
  "type": "MATERIAL",
  "required": false,
  "data": {
    "title": "Material Title",
    "materialId": "uuid-of-material",
    "materialUrl": "url-of-material (optional)",
    "driveFileId": "google-drive-file-id (optional)",
    "driveFileUrl": "google-drive-url (optional)" 
  }
}
```

### 3. Update Component
```
PUT /api/v2/admin/courses/{courseId}/components/{componentId}
```
Same request body structure as add

### 4. Delete Component
```
DELETE /api/v2/admin/courses/{courseId}/components/{componentId}
```

### 5. Reorder Components
```
PUT /api/v2/admin/courses/{courseId}/components/reorder
```

## Backend Validation Requirements

For Material Components, the backend requires:
- `title` field in data object
- Either `materialId` OR `materialUrl` in data object

The validation logic:
```java
case MATERIAL:
    // Validate material data
    return data.containsKey("title") && 
           (data.containsKey("materialId") || data.containsKey("materialUrl"));
```

## Frontend Changes Made

1. Fixed material fetching endpoint in MaterialForm.js:
   - Changed from `/admin/materials` to `/v2/materials`

The API call flow is now correct:
1. Frontend fetches materials from `/api/v2/materials`
2. Frontend posts to `/api/v2/admin/courses/{courseId}/components` with proper data structure
3. Backend validates and saves the component