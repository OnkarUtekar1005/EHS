# EHS E-Learning Platform - Complete Flow Documentation v4

## Table of Contents
1. [Authentication Flows](#authentication-flows)
2. [User Learning Flows](#user-learning-flows)
3. [Admin Management Flows](#admin-management-flows)
4. [Assessment Flows](#assessment-flows)
5. [Progress Tracking Flows](#progress-tracking-flows)
6. [File Management Flows](#file-management-flows)
7. [Domain Management Flows](#domain-management-flows)
8. [Certificate Generation Flow](#certificate-generation-flow)
9. [Issues and Mistakes Found](#issues-and-mistakes-found)

---

## 1. Authentication Flows

### 1.1 User Registration Flow
```
1. User navigates to /register
2. Fills registration form:
   - Username (unique)
   - Email (unique)
   - Password
   - Role selection (USER/ADMIN)
3. Frontend POST /api/auth/register
4. Backend validates:
   - Username uniqueness
   - Email uniqueness
   - Password strength (if any)
5. Password encrypted with BCrypt
6. User saved to database
7. Success response returned
8. User redirected to login

Issues Found:
- No email verification process
- No password strength requirements enforced
- Role can be set during registration (security risk)
```

### 1.2 Login Flow
```
1. User navigates to /login
2. Enters credentials:
   - Username
   - Password
3. Frontend POST /api/auth/login
4. Backend process:
   - AuthenticationManager validates credentials
   - UserDetailsService loads user from DB
   - BCrypt password verification
   - JWT token generation (24hr expiry)
5. Response includes:
   - JWT token
   - User ID
   - Username
   - Email
   - Role
6. Frontend stores token in localStorage
7. Axios interceptor configured for Bearer token
8. User redirected based on role:
   - ADMIN → /admin/dashboard
   - USER → /dashboard

Issues Found:
- Token stored in localStorage (XSS vulnerable)
- No refresh token mechanism
- 24hr expiry might be too long
```

### 1.3 Password Reset Flow
```
1. User clicks "Forgot Password" on login
2. Enters email address
3. Frontend POST /api/auth/forgot-password
4. Backend process:
   - Find user by email
   - Generate UUID reset token
   - Save token to password_reset_tokens table
   - Send email with reset link
5. User receives email with link
6. Clicks link → /reset-password?token=xxx
7. Frontend GET /api/auth/reset-password/validate?token=xxx
8. If valid, show password reset form
9. User enters new password
10. Frontend POST /api/auth/reset-password
11. Backend updates password and marks token as used
12. User redirected to login

Issues Found:
- Reset tokens don't expire
- No rate limiting on reset requests
- Token not deleted after use
- Email service credentials in plain text config
```

### 1.4 Logout Flow
```
1. User clicks logout
2. Frontend clears:
   - localStorage token
   - Auth context state
3. Redirect to /login

Issues Found:
- No server-side token invalidation
- JWT remains valid until expiry
```

---

## 2. User Learning Flows

### 2.1 Course Discovery Flow
```
1. User logs in → redirected to /dashboard
2. Frontend GET /api/v2/user/courses
3. Backend returns courses filtered by user's domains
4. Courses displayed with:
   - Title, description
   - Domain badge
   - Enrollment status
   - Progress (if enrolled)
5. User can toggle "Show All" to see all published courses
6. Search functionality available

Issues Found:
- "Show All" might expose courses user shouldn't access
- No pagination implemented (performance issue)
```

### 2.2 Course Enrollment Flow
```
1. User clicks on non-enrolled course
2. Views course details page
3. Clicks "Enroll" button
4. Frontend POST /api/v2/user/progress/courses/{courseId}/enroll
5. Backend creates:
   - UserCourseProgress record
   - ComponentProgress for each component
6. Status set to ENROLLED
7. User redirected to course learning page

Issues Found:
- No enrollment restrictions
- No capacity limits
- No approval workflow
```

### 2.3 Course Learning Flow
```
1. Enrolled user accesses course
2. Frontend GET /api/v2/user/progress/courses/{courseId}
3. Course components displayed in order:
   - Pre-assessment (if exists)
   - Materials
   - Post-assessment (if exists)
4. Progress tracked for each component
5. Components locked until previous completed
6. User navigates through components sequentially

Component Access Rules:
- First component always accessible
- Next component unlocked when previous completed
- Materials require pre-assessment pass (if exists)
- Certificate requires all components complete

Issues Found:
- Component locking logic inconsistent
- Can sometimes skip components
```

### 2.4 Material Viewing Flow
```
1. User clicks on material component
2. Frontend POST /api/v2/user/progress/components/{componentId}/start
3. Backend marks component as IN_PROGRESS
4. Material viewer renders based on type:
   - PDF: Google Drive preview
   - Video: HTML5 video player
   - PPT: Google Drive preview
   - DOC: Google Drive preview
5. Time tracking starts
6. User views/completes material
7. Frontend POST /api/v2/user/progress/components/{componentId}/complete
8. Progress updated to COMPLETED

Issues Found:
- No actual completion validation for materials
- Time tracking can be manipulated
- Google Drive permissions sometimes fail
```

---

## 3. Admin Management Flows

### 3.1 User Management Flow
```
1. Admin navigates to /admin/users
2. Frontend GET /api/users (with pagination)
3. User list displayed with actions:
   - Edit
   - Delete
   - Assign Domains
   - Reset Password

Create User:
1. Click "Add User"
2. Fill form (username, email, password, role)
3. POST /api/users
4. Optional: Generate secure password
5. User created with encrypted password

Bulk Import:
1. Upload CSV file
2. Frontend parses CSV
3. POST /api/users/bulk
4. Batch creation with validation

Issues Found:
- Generated passwords shown in UI (security risk)
- No user deactivation (only delete)
- Bulk operations lack transaction support
```

### 3.2 Course Creation Flow
```
1. Admin navigates to /admin/courses
2. Click "Create Course"
3. Fill course details:
   - Title
   - Description
   - Domain assignment
   - Icon selection
   - Time limit
   - Passing score
4. POST /api/v2/admin/courses
5. Course created in DRAFT status
6. Redirect to Course Builder

Course Builder:
1. Add components via drag-drop
2. Three types available:
   - Pre-Assessment
   - Material (select from library)
   - Post-Assessment
3. Configure each component
4. Save changes
5. Publish when ready

Issues Found:
- No course versioning
- Can't edit published courses safely
- Component deletion is permanent
```

### 3.3 Assessment Creation Flow
```
1. In Course Builder, add assessment component
2. Configure assessment:
   - Questions (JSON format)
   - Type (MCQ/True-False)
   - Options and correct answers
   - Time limit (optional)
3. POST /api/admin/courses/{courseId}/assessments
4. Assessment saved with component

Question Format:
{
  "questions": [{
    "id": 1,
    "text": "Question text",
    "type": "MCQ",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A"
  }]
}

Issues Found:
- No question bank/reuse
- JSON editing is error-prone
- No question validation
```

### 3.4 Domain Management Flow
```
1. Admin navigates to /admin/domains
2. Create domain:
   - Name
   - Description
   - Code (unique)
3. POST /api/domains
4. Assign users to domain
5. Assign courses to domain

Issues Found:
- Can't rename domain code
- No hierarchical domains
- Domain deletion affects users/courses
```

---

## 4. Assessment Flows

### 4.1 Assessment Taking Flow
```
1. User clicks assessment component
2. Frontend GET /api/v2/user/assessments/{componentId}/questions
3. Assessment details shown:
   - Number of questions
   - Time limit
   - Passing score
   - Attempts remaining
4. User clicks "Start Assessment"
5. POST /api/v2/user/assessments/{componentId}/start
6. Creates AssessmentAttempt record
7. Timer starts (if time limit set)
8. User answers questions
9. Submit assessment:
   - POST /api/v2/user/assessments/attempts/{attemptId}/submit
10. Backend calculates score
11. Result shown immediately:
    - Score
    - Pass/Fail status
    - Correct answers (if enabled)

Issues Found:
- Timer is client-side only
- Can manipulate submission time
- No question randomization
```

### 4.2 Assessment Retry Flow
```
1. Failed assessment shows retry option
2. Check attempts < maxAttempts (3)
3. GET /api/v2/user/assessments/{componentId}/can-retry
4. If allowed, show "Retry" button
5. User clicks retry
6. New attempt created
7. Previous answers not shown
8. Process repeats

Issues Found:
- All attempts use same questions
- No cooldown between attempts
```

### 4.3 Incomplete Assessment Handling
```
1. User starts assessment but doesn't complete
2. On next login:
   - GET /api/v2/user/assessments/incomplete
3. Warning shown about incomplete attempts
4. Options:
   - Continue (if within time)
   - Auto-submit (forfeit)
5. Auto-submit:
   - POST /api/v2/user/assessments/attempts/{attemptId}/auto-submit
   - Scores only answered questions

Issues Found:
- No automatic timeout handling
- Incomplete attempts block new attempts
```

---

## 5. Progress Tracking Flows

### 5.1 Component Progress Flow
```
1. User interacts with component
2. Progress events:
   - Start: POST /components/{id}/start
   - Update: PUT /components/{id}/progress
   - Complete: POST /components/{id}/complete
3. Backend updates:
   - Status (NOT_STARTED → IN_PROGRESS → COMPLETED)
   - Progress percentage
   - Time spent
4. Overall course progress recalculated

Progress Calculation:
- Total components = 100%
- Each component = 100/total %
- Only COMPLETED components count

Issues Found:
- Progress can be manually manipulated
- No server-side time validation
```

### 5.2 Course Completion Flow
```
1. All required components completed
2. Backend checks:
   - All components COMPLETED
   - Post-assessment PASSED (if exists)
3. UserCourseProgress status → COMPLETED
4. Completion date recorded
5. Certificate generation triggered

Issues Found:
- Optional components affect progress
- No partial completion recognition
```

---

## 6. File Management Flows

### 6.1 Material Upload Flow
```
1. Admin navigates to /admin/materials
2. Click "Upload Material"
3. Select file (PDF/Video/PPT/DOC)
4. Frontend validates:
   - File type
   - File size (<200MB)
5. POST /api/v2/materials/upload
6. Backend process:
   - Save file metadata
   - Upload to Google Drive
   - Get Drive file ID
   - Set permissions
7. Material available in library

Issues Found:
- No virus scanning
- Large files timeout
- Google Drive quota not checked
```

### 6.2 Google Drive Integration Flow
```
1. File upload triggers Drive service
2. Uses service account credentials
3. Upload to configured folder
4. Set permissions:
   - Anyone with link can view
   - Disable download (optional)
5. Store Drive metadata:
   - File ID
   - Web view link
   - Embed link

Permission Fix Flow:
1. If permissions fail
2. Admin can POST /api/v2/materials/{id}/fix-permissions
3. Reapplies permission settings

Issues Found:
- Service account key in repository
- Permissions sometimes don't apply
- No backup storage option
```

---

## 7. Domain Management Flows

### 7.1 User-Domain Assignment Flow
```
1. Admin selects user(s)
2. Choose "Assign Domains"
3. Select domains from list
4. PUT /api/users/{id}/domains
5. Updates user_domains junction table
6. User immediately sees domain courses

Bulk Assignment:
1. Select multiple users
2. PUT /api/users/domains/assign
3. Batch update domains

Issues Found:
- No domain change notifications
- Can't request domain access as user
- No approval workflow
```

### 7.2 Domain-Based Access Control Flow
```
1. User logs in
2. System loads user's domains
3. Course queries filtered by domains
4. Only matching courses shown
5. "Show All" overrides filter

Access Check:
- User domains ∩ Course domain
- If match, allow access
- Admin bypass all checks

Issues Found:
- "Show All" bypasses domain security
- No multi-domain courses
```

---

## 8. Certificate Generation Flow

### 8.1 Certificate Creation
```
1. Course completion triggers certificate
2. Backend generates:
   - Unique certificate number (CERT-YYYY-000001)
   - Issue date
   - Expiry date (+1 year)
   - QR code for verification
3. PDF generation with:
   - User name
   - Course title
   - Completion date
   - Certificate number
   - QR code
4. Stored in database

Issues Found:
- No certificate templates
- Can't revoke certificates
- QR code links might break
```

### 8.2 Certificate Verification
```
1. Scan QR code or enter certificate number
2. Public endpoint: /api/certificates/verify/{number}
3. Returns:
   - Validity status
   - User name
   - Course name
   - Issue date

Issues Found:
- No rate limiting on verification
- Expiry not properly checked
```

---

## 9. Issues and Mistakes Found

### Critical Security Issues
1. **JWT in localStorage** - Vulnerable to XSS attacks
2. **No refresh tokens** - Users must re-login every 24 hours
3. **Service account key in repo** - Google Drive credentials exposed
4. **No rate limiting** - Vulnerable to brute force attacks
5. **Role setting on registration** - Users can make themselves admin
6. **Generated passwords shown** - Should be sent via secure channel

### Data Integrity Issues
1. **No transaction support** - Bulk operations can partially fail
2. **Progress manipulation** - Client-side progress can be faked
3. **Time tracking unreliable** - Based on client-side timing
4. **No versioning** - Course changes affect active learners
5. **Component deletion** - No soft delete, data permanently lost

### User Experience Issues
1. **No email verification** - Users can register with fake emails
2. **Password reset tokens don't expire** - Security risk
3. **No assessment randomization** - Same questions on retry
4. **Timer client-side only** - Can be manipulated
5. **No offline support** - Requires constant connection

### Performance Issues
1. **No pagination on courses** - Will slow down with many courses
2. **Large file uploads timeout** - 200MB limit but no chunking
3. **No caching strategy** - Repeated API calls
4. **Batch operations not optimized** - Individual queries in loops

### Business Logic Issues
1. **"Show All" courses** - Bypasses domain restrictions
2. **No enrollment limits** - Unlimited users per course
3. **No approval workflows** - Instant enrollment
4. **Can't edit published courses** - Have to unpublish first
5. **No course prerequisites** - Can't require course A before B

### Missing Features
1. **No audit logging** - Can't track who did what
2. **No notifications** - Users don't know about updates
3. **No reporting/analytics** - Basic stats only
4. **No content versioning** - Can't track changes
5. **No backup/restore** - Data loss risk

### Code Quality Issues
1. **Hardcoded values** - Magic numbers throughout
2. **Inconsistent error handling** - Some endpoints don't handle errors
3. **No input validation** - Some endpoints accept any data
4. **Mixed response formats** - Some return data, others messages
5. **No API documentation** - Swagger/OpenAPI not configured

### Recommendations
1. Move JWT to httpOnly cookies
2. Implement refresh token mechanism
3. Add comprehensive audit logging
4. Implement proper transaction support
5. Add server-side validation for all inputs
6. Implement rate limiting on all endpoints
7. Add email verification for registration
8. Move sensitive config to environment variables
9. Implement proper error handling globally
10. Add automated testing suite