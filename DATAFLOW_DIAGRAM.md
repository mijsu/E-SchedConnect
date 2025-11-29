
# Data Flow Diagram - E-Sched Connect

## Level 0: Context Diagram

```
┌─────────────────┐
│                 │
│  Administrator  │
│                 │
└────────┬────────┘
         │
         │ Manages schedules, professors, subjects, rooms
         │ Reviews adjustment requests
         │ Generates reports
         │
         ▼
┌─────────────────────────────────────────┐
│                                         │
│        E-Sched Connect System           │
│   (Class Scheduling Management)         │
│                                         │
└────────┬────────────────────────────────┘
         │
         │ Views schedules
         │ Submits adjustment requests
         │ Manages profile
         │
         ▼
┌─────────────────┐
│                 │
│    Professor    │
│                 │
└─────────────────┘

External Systems:
- Firebase Authentication (User authentication)
- Firebase Firestore (Data storage)
```

### External Entities
1. **Administrator** - Manages the entire scheduling system
2. **Professor** - Views schedules and submits adjustment requests
3. **Firebase Authentication** - Handles user authentication
4. **Firebase Firestore** - Stores all application data

---

## Level 1: Main System Processes

```
┌─────────────────┐
│  Administrator  │
└────────┬────────┘
         │
         ├──────────────────────────────────────────────┐
         │                                              │
         ▼                                              ▼
    ┌────────────────┐                          ┌──────────────┐
    │   1.0          │                          │    2.0       │
    │   User         │                          │   Schedule   │
    │   Management   │                          │  Management  │
    └────────┬───────┘                          └──────┬───────┘
         │                                              │
         │                                              │
         ▼                                              ▼
    [D1: Users]                                  [D2: Schedules]
         │                                              │
         │                                              │
         ▼                                              ▼
    ┌────────────────┐                          ┌──────────────┐
    │   3.0          │                          │    4.0       │
    │   Resource     │                          │   Request    │
    │   Management   │                          │  Management  │
    └────────┬───────┘                          └──────┬───────┘
         │                                              │
         │                                              │
         ▼                                              ▼
    [D3: Resources]                              [D4: Requests]
         │                                              │
         │                                              │
         └──────────────────┬───────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    5.0       │
                    │   Reporting  │
                    │  & Analytics │
                    └──────┬───────┘
                           │
                           ▼
                     [D5: Audit Logs]
                           │
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Professor     │                 │ Firebase Auth   │
└─────────────────┘                 └─────────────────┘
```

### Data Stores
- **D1: Users** - Professor and admin user profiles
- **D2: Schedules** - Class schedules with assignments
- **D3: Resources** - Departments, subjects, rooms
- **D4: Requests** - Adjustment requests
- **D5: Audit Logs** - System activity logs

### Main Processes
1. **User Management** - Authentication, registration, profile management
2. **Schedule Management** - Create, update, delete schedules
3. **Resource Management** - Manage departments, subjects, rooms, professors
4. **Request Management** - Handle schedule adjustment requests
5. **Reporting & Analytics** - Generate reports and audit trails

---

## Level 2: Detailed Process Breakdown

### 2.1 User Management (Process 1.0)

```
┌─────────────────┐
│  Administrator  │
│  / Professor    │
└────────┬────────┘
         │
         │ Login credentials
         ▼
    ┌────────────────┐
    │   1.1          │
    │ Authentication │◄─────── [Firebase Auth]
    └────────┬───────┘
         │
         │ User session
         ▼
    ┌────────────────┐
    │   1.2          │
    │ Authorization  │◄─────── [D1: Users]
    └────────┬───────┘
         │
         │ Access token
         ▼
    ┌────────────────┐
    │   1.3          │
    │    Profile     │
    │  Management    │◄─────── [D1: Users]
    └────────┬───────┘
         │
         │ Updated profile
         ▼
    [D1: Users]
```

**Sub-processes:**
- **1.1 Authentication** - Login/logout using Firebase
- **1.2 Authorization** - Role-based access control (admin/professor)
- **1.3 Profile Management** - View and update user profile

---

### 2.2 Schedule Management (Process 2.0)

```
┌─────────────────┐
│  Administrator  │
└────────┬────────┘
         │
         │ Schedule data
         ▼
    ┌────────────────┐
    │   2.1          │
    │   Create       │
    │   Schedule     │──────► [D2: Schedules]
    └────────┬───────┘
         │
         │ Validation request
         ▼
    ┌────────────────┐
    │   2.2          │
    │   Conflict     │◄────── [D2: Schedules]
    │   Detection    │◄────── [D3: Resources]
    └────────┬───────┘
         │
         │ Validation result
         ▼
    ┌────────────────┐
    │   2.3          │
    │   Schedule     │
    │   Assignment   │──────► [D2: Schedules]
    └────────┬───────┘        ──────► [D5: Audit Logs]
         │
         │ Assigned schedule
         ▼
┌─────────────────┐
│   Professor     │
└─────────────────┘
```

**Sub-processes:**
- **2.1 Create Schedule** - Input schedule details (day, time, subject, room, professor)
- **2.2 Conflict Detection** - Check for time/room/professor conflicts
- **2.3 Schedule Assignment** - Assign validated schedule to professor

**Data Flows:**
- Schedule data → Create Schedule
- Validation request → Conflict Detection
- Schedule data ↔ D2: Schedules
- Resource data ← D3: Resources
- Audit log → D5: Audit Logs

---

### 2.3 Resource Management (Process 3.0)

```
┌─────────────────┐
│  Administrator  │
└────────┬────────┘
         │
         ├──────────┬──────────┬──────────┐
         │          │          │          │
         ▼          ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │  3.1   │ │  3.2   │ │  3.3   │ │  3.4   │
    │Department│Subject │  Room  │Professor│
    │ Mgmt   │ │  Mgmt  │ │  Mgmt  │ │  Mgmt  │
    └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
        │          │          │          │
        └──────────┴──────────┴──────────┘
                   │
                   ▼
            [D3: Resources]
                   │
                   ▼
            [D5: Audit Logs]
```

**Sub-processes:**
- **3.1 Department Management** - Create, update, delete departments
- **3.2 Subject Management** - Manage subjects (code, name, units, type)
- **3.3 Room Management** - Manage rooms (code, name, capacity, type)
- **3.4 Professor Management** - Manage professor records and assignments

**Data Flows:**
- Resource CRUD operations → D3: Resources
- Audit entries → D5: Audit Logs

---

### 2.4 Request Management (Process 4.0)

```
┌─────────────────┐
│   Professor     │
└────────┬────────┘
         │
         │ Adjustment request
         ▼
    ┌────────────────┐
    │   4.1          │
    │    Submit      │
    │    Request     │──────► [D4: Requests]
    └────────┬───────┘        ──────► [D5: Audit Logs]
         │
         │ Request notification
         ▼
┌─────────────────┐
│  Administrator  │
└────────┬────────┘
         │
         │ Review action
         ▼
    ┌────────────────┐
    │   4.2          │
    │    Review      │◄────── [D4: Requests]
    │    Request     │◄────── [D2: Schedules]
    └────────┬───────┘
         │
         │ Decision (approve/reject)
         ▼
    ┌────────────────┐
    │   4.3          │
    │   Process      │
    │   Decision     │──────► [D4: Requests]
    └────────┬───────┘        ──────► [D2: Schedules]
         │                    ──────► [D5: Audit Logs]
         │
         │ Status update
         ▼
┌─────────────────┐
│   Professor     │
└─────────────────┘
```

**Sub-processes:**
- **4.1 Submit Request** - Professor submits schedule adjustment request
- **4.2 Review Request** - Admin reviews request with schedule context
- **4.3 Process Decision** - Approve/reject request and update schedules

**Data Flows:**
- Request data → D4: Requests
- Schedule data ← D2: Schedules
- Updated request status → D4: Requests
- Updated schedule → D2: Schedules
- Audit log → D5: Audit Logs

---

### 2.5 Reporting & Analytics (Process 5.0)

```
┌─────────────────┐
│  Administrator  │
└────────┬────────┘
         │
         │ Report request
         ▼
    ┌────────────────┐
    │   5.1          │
    │   Generate     │◄────── [D2: Schedules]
    │   Reports      │◄────── [D3: Resources]
    └────────┬───────┘◄────── [D4: Requests]
         │
         │ Report data
         ▼
    ┌────────────────┐
    │   5.2          │
    │   Analytics    │
    │   Dashboard    │
    └────────┬───────┘
         │
         │ Metrics & charts
         ▼
    ┌────────────────┐
    │   5.3          │
    │   Audit        │◄────── [D5: Audit Logs]
    │   Trail        │
    └────────┬───────┘
         │
         │ Audit report
         ▼
┌─────────────────┐
│  Administrator  │
└─────────────────┘
```

**Sub-processes:**
- **5.1 Generate Reports** - Create room utilization, professor workload reports
- **5.2 Analytics Dashboard** - Display statistics and charts
- **5.3 Audit Trail** - Track all system CRUD operations

**Data Flows:**
- Schedule data ← D2: Schedules
- Resource data ← D3: Resources
- Request data ← D4: Requests
- Audit data ← D5: Audit Logs
- Reports → Administrator

---

## Data Dictionary

### D1: Users (Firebase Auth + Firestore)
- **userId** (string) - Unique identifier
- **email** (string) - User email
- **displayName** (string) - User's full name
- **role** (enum) - "admin" or "professor"
- **avatarUrl** (string) - Profile picture URL
- **createdAt** (timestamp)

### D2: Schedules (Firestore)
- **scheduleId** (string) - Unique identifier
- **professorId** (string) - Reference to professor
- **subjectId** (string) - Reference to subject
- **roomId** (string) - Reference to room
- **dayOfWeek** (enum) - Day of the week
- **startTime** (string) - Start time (HH:MM)
- **endTime** (string) - End time (HH:MM)
- **classType** (enum) - "online" or "face-to-face"
- **section** (string) - Class section
- **weekStartDate** (number) - Week timestamp

### D3: Resources (Firestore)
#### Professors
- **professorId** (string)
- **userId** (string) - Link to user account
- **firstName**, **lastName** (string)
- **email** (string)
- **departmentId** (string)
- **specialization** (string)

#### Subjects
- **subjectId** (string)
- **code** (string)
- **name** (string)
- **units** (number)
- **type** (enum) - "lecture", "laboratory", "both"

#### Rooms
- **roomId** (string)
- **code** (string)
- **name** (string)
- **capacity** (number)
- **type** (enum) - "lecture", "laboratory", "both"

#### Departments
- **departmentId** (string)
- **code** (string)
- **name** (string)

### D4: Requests (Firestore)
- **requestId** (string)
- **professorId** (string)
- **scheduleId** (string)
- **requestType** (string)
- **reason** (string)
- **status** (enum) - "pending", "approved", "rejected"
- **submittedAt** (timestamp)
- **reviewedAt** (timestamp)
- **reviewedBy** (string)

### D5: Audit Logs (Firestore)
- **logId** (string)
- **userId** (string)
- **action** (enum) - "create", "update", "delete"
- **resourceType** (string)
- **resourceId** (string)
- **timestamp** (timestamp)
- **details** (object)

---

## System Flow Summary

### Admin Workflow
1. Login → Authentication (1.1)
2. Access dashboard → Authorization (1.2)
3. Manage resources (3.1-3.4)
4. Create schedules (2.1) → Conflict detection (2.2) → Assign (2.3)
5. Review requests (4.2) → Process decision (4.3)
6. Generate reports (5.1-5.3)

### Professor Workflow
1. Login → Authentication (1.1)
2. View dashboard → Authorization (1.2)
3. View schedules (from D2)
4. Submit adjustment request (4.1)
5. Track request status (from D4)
6. Update profile (1.3)

### Data Flow Characteristics
- **Real-time sync** via Firebase Firestore
- **Conflict detection** prevents scheduling errors
- **Audit logging** tracks all CRUD operations
- **Role-based access** controls data visibility
- **Request workflow** manages schedule changes
