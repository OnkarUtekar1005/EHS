# EHS Learning Platform - User Flow

## Overview

This document outlines the comprehensive user flow for learners in the EHS Learning Platform, detailing how users interact with training modules, learning materials, assessments, and progress tracking.

## User Journey Map

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│      Login      │────▶│  Dashboard &    │────▶│ Training Module │────▶│   Module Flow   │
│                 │     │  Module Browser │     │     Details     │     │    Navigation   │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                                                  │
                                                                                  ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  View Progress  │◀────│ Post-Assessment │◀────│Learning Material│◀────│ Pre-Assessment  │
│   & Reports     │     │   Completion    │     │   Consumption   │     │  (if required)  │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Detailed User Flow

### 1. Authentication & Access

#### 1.1 Login Process
- User navigates to the login page
- Enters credentials (username/password)
- System validates domain association
- Upon successful authentication, JWT token is issued
- User is redirected to their dashboard

#### 1.2 Domain-Based Access Control
- System identifies user's assigned domain(s)
- Only training modules associated with user's domain(s) are accessible
- Content and modules outside the user's domain remain invisible

### 2. Dashboard & Module Discovery

#### 2.1 User Dashboard
- Overview of assigned/available training modules
- Progress indicators showing completion status for each module
- Quick access to recently viewed or in-progress modules
- Statistics showing overall completion percentage
- Notifications for new or required modules

#### 2.2 Module Browsing
- Filterable list of training modules by:
  - Domain/category
  - Completion status (Not Started, In Progress, Completed)
  - Due date (if applicable)
  - Required vs. optional modules
- Module cards showing:
  - Title and brief description
  - Estimated completion time
  - Progress indicator (% complete)
  - Pre/Post assessment requirements

### 3. Module Selection & Details

#### 3.1 Module Information
- Detailed module description and learning objectives
- List of components (pre-assessment, learning materials, post-assessment)
- Estimated time to complete
- Prerequisites (if any)
- Completion requirements
- Certification information (if applicable)

#### 3.2 Module Launch
- Clear "Start Module" or "Continue Module" button
- If previously started, option to resume from last position or restart
- Visual indicator of current progress within module

### 4. Pre-Assessment Flow

#### 4.1 Pre-Assessment Introduction
- Clear instructions and purpose of pre-assessment
- Explanation of how results will be used (knowledge benchmarking)
- Number of questions and time limit (if applicable)

#### 4.2 Question Navigation
- One question displayed at a time with clear navigation controls
- Question counter showing progress (e.g., "Question 3 of 10")
- Option to flag questions for review
- Ability to review all questions before final submission

#### 4.3 Question Types
- Multiple choice (single and multiple answers)
- True/False
- Clear visual indication of selected answers

#### 4.4 Pre-Assessment Completion
- Submission confirmation dialog
- Results page showing:
  - Score and pass/fail status (if applicable)
  - Recommended focus areas based on performance
  - Option to review incorrect answers (if allowed by admin settings)
- Clear "Continue to Learning Materials" button

### 5. Learning Materials Consumption

#### 5.1 Learning Material Navigation
- Sequential navigation through learning materials
- Progress bar showing position within the overall module
- Sidebar navigation to jump to specific materials (if allowed)
- Clear indication of completed vs. pending materials

#### 5.2 Content Type Handling
- PDF Viewer
  - Embedded viewer with zoom, page navigation controls
  - Progress tracking based on scroll position or time spent
  - Download option (if allowed)

- Video Player
  - Embedded player with standard controls
  - Progress tracking based on watch percentage
  - Playback rate and quality controls
  - Remembers last position if user returns later

- Document Viewer
  - Support for various document types (DOCX, PPT, etc.)
  - Progress tracking based on time spent or interactions

- HTML/Rich Text Content
  - Responsive layout for various screen sizes
  - Progress tracking based on scroll depth or time spent

#### 5.3 Progress Tracking
- Automatic tracking of material completion based on:
  - View time (minimum required time viewed)
  - Scroll depth (for documents/HTML)
  - Video watch percentage
- "Mark as Complete" button for manual completion
- Clear visual indicators showing completion status

#### 5.4 Material Completion
- Confirmation of material completion
- Option to revisit completed materials
- Clear "Next" button to proceed to next material or assessment

### 6. Post-Assessment Flow

#### 6.1 Post-Assessment Introduction
- Clear instructions and purpose of post-assessment
- Passing requirements and retry policy
- Number of questions and time limit (if applicable)

#### 6.2 Assessment Interface
- Similar to pre-assessment interface for consistency
- One question per screen with navigation controls
- Progress indicator and time remaining (if applicable)
- Question flagging and review capabilities

#### 6.3 Assessment Submission
- Review screen showing all questions with answers
- Option to revise answers before final submission
- Clear submission button with confirmation dialog

#### 6.4 Results & Feedback
- Comprehensive results page showing:
  - Score and pass/fail status
  - Feedback on incorrect answers (if enabled)
  - Section-by-section performance breakdown
  - Comparison to pre-assessment (if applicable)
- Certificate generation (if passing and enabled)
- Retry options (if failed and retries are allowed)

### 7. Module Completion

#### 7.1 Completion Notification
- Clear congratulatory message
- Summary of achievements (scores, time spent)
- Certificate download option (if applicable)

#### 7.2 Next Steps
- Recommendations for related modules
- Return to dashboard button
- Option to provide module feedback

### 8. Progress Tracking & Reports

#### 8.1 My Progress Dashboard
- Overall progress across all assigned modules
- Detailed breakdown by module and component
- Performance metrics on assessments
- Time spent on learning materials
- Graphical representations of progress over time

#### 8.2 Certificate Management
- List of earned certificates
- Download/print options
- Expiration dates and renewal reminders (if applicable)

#### 8.3 Learning History
- Chronological record of all completed modules and assessments
- Searchable and filterable history
- Performance trends over time

## Technical Implementation Considerations

### 1. Progress Tracking Mechanism

The system will implement a multi-level progress tracking model:

```
UserModuleProgress
  └── UserComponentProgress (for each component in the module)
       └── MaterialProgress (for learning materials)
```

Progress states will include:
- NOT_STARTED: User hasn't begun this item
- IN_PROGRESS: User has started but not completed
- COMPLETED: User has met all completion criteria

### 2. Assessment Engine

- Question randomization (if configured)
- Time tracking for timed assessments
- Support for various question types
- Automatic scoring with custom feedback
- Retry management with attempt tracking

### 3. Mobile Responsiveness

- Adaptive layout for all screen sizes
- Touch-friendly navigation controls
- Offline capability for selected content (future enhancement)
- Resume capability across devices

## Implementation Phases

### Phase 1: Core User Flow
- Authentication and module browsing
- Basic learning material consumption
- Simple assessments with scoring
- Basic progress tracking

### Phase 2: Enhanced User Experience
- Advanced assessment types
- Improved progress visualization
- Certificate generation and management
- Enhanced material viewers

### Phase 3: Advanced Features
- Offline learning capabilities
- AI-powered recommendations
- Gamification elements
- Social learning features

## Conclusion

This user flow design ensures a seamless, intuitive learning experience while maintaining the structural rigor needed for EHS training. The flow is designed to be both engaging for users and to provide accurate tracking and reporting for administrators.