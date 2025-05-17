# User Experience Visual Diagram

## Complete Learning Journey Flow

```mermaid
flowchart TD
    subgraph Authentication
        A1[User Login] --> A2{Valid Credentials?}
        A2 -->|Yes| A3[Dashboard]
        A2 -->|No| A1
    end
    
    subgraph Course Selection
        A3 --> B1[My Courses Page]
        B1 --> B2[Filter by Domain]
        B2 --> B3[Course List]
        B3 --> B4{Select Course}
        B4 --> B5[Course Detail Page]
    end
    
    subgraph Course Journey
        B5 --> C1[View Course Info]
        C1 --> C2{Start Course?}
        C2 -->|Yes| D1[Pre-Assessment]
        
        D1 --> D2{Questions}
        D2 --> D3[Submit Answers]
        D3 --> D4{Pass?}
        D4 -->|Yes >= 70%| E1[Unlock Materials]
        D4 -->|No < 70%| D5[Review & Retry]
        D5 --> D1
        
        E1 --> E2[Material 1]
        E2 --> E3[Track Progress]
        E3 --> E4{More Materials?}
        E4 -->|Yes| E2
        E4 -->|No| F1[Post-Assessment]
        
        F1 --> F2{Questions}
        F2 --> F3[Submit Answers]
        F3 --> F4{Pass?}
        F4 -->|Yes >= 80%| G1[Course Complete]
        F4 -->|No < 80%| F5[Review & Retry]
        F5 --> F1
    end
    
    subgraph Completion
        G1 --> H1[Generate Certificate]
        H1 --> H2[Update Progress 100%]
        H2 --> H3[Download Certificate]
        H3 --> H4[View Achievements]
    end
    
    subgraph Progress Tracking
        D3 -.-> P1[Update Progress 20%]
        E3 -.-> P2[Update Progress 20-70%]
        F3 -.-> P3[Update Progress 70-100%]
        P1 --> P4[Progress Dashboard]
        P2 --> P4
        P3 --> P4
    end
```

## Assessment Flow Detail

```mermaid
flowchart LR
    subgraph Pre-Assessment
        PA1[Start] --> PA2[Instructions]
        PA2 --> PA3[Question 1]
        PA3 --> PA4[Question 2]
        PA4 --> PA5[...]
        PA5 --> PA6[Review]
        PA6 --> PA7[Submit]
        PA7 --> PA8{Score >= 70%?}
        PA8 -->|Yes| PA9[Pass - Unlock Materials]
        PA8 -->|No| PA10[Fail - Show Review]
        PA10 --> PA1
    end
    
    subgraph Post-Assessment
        PO1[Start] --> PO2[Instructions]
        PO2 --> PO3[Question 1]
        PO3 --> PO4[Question 2]
        PO4 --> PO5[...]
        PO5 --> PO6[Review]
        PO6 --> PO7[Submit]
        PO7 --> PO8{Score >= 80%?}
        PO8 -->|Yes| PO9[Pass - Generate Certificate]
        PO8 -->|No| PO10[Fail - Allow Retry]
        PO10 --> PO1
    end
```

## Progress Calculation Visual

```mermaid
pie title Course Progress Breakdown
    "Pre-Assessment" : 20
    "Training Materials" : 50
    "Post-Assessment" : 30
```

## Certificate Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant CertificateService
    
    User->>Frontend: Complete Course
    Frontend->>Backend: Request Certificate
    Backend->>Database: Verify Completion
    Database-->>Backend: Completion Confirmed
    Backend->>CertificateService: Generate Certificate
    CertificateService->>CertificateService: Create PDF
    CertificateService->>CertificateService: Add QR Code
    CertificateService-->>Backend: Certificate Generated
    Backend->>Database: Store Certificate Record
    Backend-->>Frontend: Certificate URL
    Frontend-->>User: Download Certificate
```

## Material Tracking System

```mermaid
stateDiagram-v2
    [*] --> NotStarted
    NotStarted --> InProgress: User Opens Material
    InProgress --> Completed: User Completes Material
    InProgress --> Paused: User Exits
    Paused --> InProgress: User Resumes
    Completed --> [*]
    
    state InProgress {
        [*] --> Viewing
        Viewing --> Tracking: Every 30s
        Tracking --> Updating: Update Progress
        Updating --> Viewing
    }
```

## User Dashboard Components

```mermaid
graph TB
    subgraph Dashboard
        D1[Header - User Info]
        D2[Course Progress Cards]
        D3[Certificates Section]
        D4[Learning History]
        D5[Achievements]
    end
    
    subgraph Course Card
        C1[Course Title]
        C2[Progress Bar]
        C3[Status Badge]
        C4[Next Action Button]
        C5[Time Remaining]
    end
    
    subgraph Certificate Card
        CE1[Certificate Preview]
        CE2[Course Name]
        CE3[Issue Date]
        CE4[Download Button]
        CE5[Verify QR Code]
    end
    
    D2 --> C1
    D2 --> C2
    D2 --> C3
    D2 --> C4
    D2 --> C5
    
    D3 --> CE1
    D3 --> CE2
    D3 --> CE3
    D3 --> CE4
    D3 --> CE5
```