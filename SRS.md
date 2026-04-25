# Software Requirements Specification (SRS) - Draft
## CodeSecureX

---

## 1. Introduction

### a. Purpose of the system
CodeSecureX is a comprehensive web-based platform designed to enhance the security of software development workflows by providing automated vulnerability scanning and code quality assessments. The system allows developers and security teams to seamlessly integrate security checks into their projects by identifying known vulnerabilities, analyzing code against established best practices, and generating actionable reports. 

### b. Scope of the project
The scope of CodeSecureX includes:
- **GitHub Integration**: Allowing users to import repositories via public GitHub URLs and browse associated architecture.
- **Vulnerability Scanning**: Automated static analysis to detect security flaws in the source code.
- **Reporting**: Generating intuitive and detailed reports outlining code quality metrics and identified threats.
- **Role-Based Access Control**: Secure user management differentiating between regular users and system administrators.
- **Auditing**: Admin tracking and logging capability for system oversight (e.g., suspending malicious users).
It does not currently include automated automatic code fixing or dynamic application security testing (DAST).

### c. Definitions, acronyms
- **SRS**: Software Requirements Specification
- **API**: Application Programming Interface
- **CI/CD**: Continuous Integration and Continuous Deployment
- **JWT**: JSON Web Token (used for user authentication)
- **UI/UX**: User Interface / User Experience
- **Admin**: An administrator with elevated privileges.

---

## 2. Overall Description

### a. Product perspective
CodeSecureX is a standalone web application utilizing a client-server architecture. It interacts directly with external version control systems like GitHub to read repository data. It features a frontend interface built on Next.js communicating via RESTful APIs with a backend powered by FastAPI, utilizing MongoDB as the core database.

> **[Image Placeholder: System Architecture Diagram]**
> *(Insert a diagram illustrating the Next.js frontend, FastAPI backend, MongoDB, and GitHub interaction)*

### b. User classes
1. **User (Developer/Analyst)**: Can authenticate, connect GitHub repositories, run vulnerability scans, view reports, and inspect specific file vulnerabilities.
2. **Admin**: Possesses all standard user rights, plus the ability to access the Admin Dashboard to manage users, suspend or unsuspend accounts, and view platform audit logs.
3. **Guest**: Unauthenticated users who can only view landing pages and register/login forms.

### c. Operating environment
- **Client (Frontend)**: Modern web browsers (Chrome, Firefox, Safari, Edge) on desktop or mobile environments.
- **Server (Backend)**: Any server capable of running Python 3.10+ (FastAPI) and Node.js environments.
- **Database**: MongoDB (cloud or on-premise).

### d. Assumptions and dependencies
- Users must have an active internet connection to authenticate and communicate with the system.
- Integration dependencies rely on the continued availability of the public GitHub API.
- The system assumes Next.js, FastAPI, and MongoDB are correctly configured in their respective deployment environments.

---

## 3. Functional Requirements

- **Authentication Module**: The system shall allow users to register, log in, and manage their session utilizing secure JWT-based authentication.
- **Repository Integration**: The system shall accept a valid public GitHub URL as input, fetch its directory structure, and allow users to select individual files to scan.
- **Vulnerability Engine**: The system shall analyze selected repository files for security vulnerabilities and code quality issues.
- **Dashboard & Reporting**: The system shall display historical scan results and summarize reports detailing the vulnerability severity, location, and remediation suggestions.
- **Admin Management**: The system shall provide a protected `/admin/users` interface for administrators to view all registered users and execute actions like account suspension.
- **System Auditing**: The system shall automatically log any administrative actions (e.g., suspending a user) with correct timestamps and target IDs into an AdminLog collection.

---

## 4. Non-Functional Requirements

- **Security**: All API routes containing sensitive data must be protected. Admin routes require an elevated JWT role. Passwords must be hashed via bcrypt prior to storage.
- **Performance**: The frontend shall fetch and render data promptly. Optimistic UI updates should be utilized during administrative actions (like user suspension) for seamless UX.
- **Scalability**: The backend FastAPI architecture and MongoDB collections shall be structured asynchronously to comfortably support an increasing volume of concurrent scan requests.
- **Availability**: The system aims for 99.9% uptime, ensuring error handling (e.g., handling 404s, 500s) gracefully degraded to inform, and not break the UI.
- **Usability**: The UI shall be intuitive, adhering to modern UI/UX design standards and providing loading states and toast notifications for complex operations.

---

## 5. External Interface Requirements

### a. User Interface
> **[Image Placeholder: UI Mockups / Wireframes]**
> *(Insert screenshots or wireframes for Login, User Dashboard, and Admin Dashboard here)*

- **Authentication Screens**: Modern design forms for sign-up and sign-in.
- **Dashboard User**: A central hub mapping out recent scans and a prompt to initiate new repo scans.
- **Admin Dashboard**: A secure data table interface displaying users (Email, Role, Status) and an actionable "Suspend" button.
- Notifications such as success/error toasts shall be visible upon API failures or successes.

### b. Hardware interfaces
- The system is software-based (accessed over HTTP/HTTPS) and does not require explicit, proprietary hardware interfaces beyond standard networking.

### c. Software interfaces
- **Database Interface**: Beanie ODM (acting over motor) communicating asynchronously with MongoDB.
- **External Web APIs**: GitHub REST API to fetch repository paths and file contents.
- **Frontend-Backend Interface**: A Next.js frontend communicating with FastAPI over HTTP utilizing Axios, governed by standard REST principles and JSON object configurations.

---

## 6. Use Cases and Scenarios

> **[Image Placeholder: Use Case Diagram]**
> *(Insert a Use Case diagram here illustrating the actors: User, Admin, and the System interactions)*

**Use Case 1: Scanning a GitHub Repository**
1. User logs into their CodeSecureX account.
2. User navigates to the "New Scan" tab.
3. User enters a public GitHub Repo URL.
4. The system validates the URL and displays the repository's file tree.
5. User selects a specific `backend/main.py` file to scan.
6. The system analyzes the code and generates a security report for the user to review.

**Use Case 2: Suspending a Malicious User**
1. Admin logs securely into the portal.
2. Admin navigates to `/admin/users`.
3. System fetches the user list.
4. Admin clicks the "Suspend" button next to a suspicious account.
5. The system performs the action, writes to `AdminLog`, updates the user's status, and notifies the Admin via a success toast.

---

## 7. Data Requirements

> **[Image Placeholder: Entity-Relationship (ER) Diagram]**
> *(Insert an ER diagram detailing the relationships between Users, Reports, and AdminLog collections)*

The database shall contain the following distinct data models (Collections):
- **Users**: To store authentication credentials, `id`, `email`, password hashes, `role` (user/admin), `status` (active/suspended), and `createdAt` timestamps.
- **Reports/Scans**: To store records of code scans, containing the repository identifier, scanned file paths, found vulnerabilities, severity classifications, and timestamps.
- **AdminLog**: To track audit events featuring `admin_id`, `action` (e.g., "suspend_user"), `target_user_id`, and `timestamp`.

---

## 8. System Models and Diagrams

This section reserves space for the architectural, behavioral, and structural diagrams that dictate the system's design.

### a. Data Flow Diagrams (DFDs)
> **[Image Placeholder: Level 0 DFD (Context Diagram)]**
> *(Insert the Level 0 Context Diagram showing the core system and external entities)*

> **[Image Placeholder: Level 1 DFD]**
> *(Insert the Level 1 DFD breaking down the main processes of CodeSecureX)*

### b. Behavioral UML Diagrams
> **[Image Placeholder: Use Case Diagram]**
> *(Insert the comprehensive Use Case Diagram detailing actor and system boundaries)*

> **[Image Placeholder: Sequence Diagram]**
> *(Insert Sequence Diagrams for key flows, e.g., scanning a repository or admin login)*

> **[Image Placeholder: Collaboration / Communication Diagram]**
> *(Insert Collaboration Diagrams showing message flow between objects)*

### c. Structural UML Diagrams
> **[Image Placeholder: Class Diagram]**
> *(Insert the Class Diagram showing system entities, their attributes, and relationships)*

> **[Image Placeholder: Object Diagram]**
> *(Insert the Object Diagram showing a snapshot of system instances at a specific runtime)*

> **[Image Placeholder: Package Diagram]**
> *(Insert the Package Diagram detailing the logical grouping of Next.js, FastAPI, and Database modules)*

### d. Architectural UML Diagrams
> **[Image Placeholder: Component Diagram]**
> *(Insert the Component Diagram illustrating the structural relationships between software pieces)*

> **[Image Placeholder: Deployment Diagram]**
> *(Insert the Deployment Diagram showing the physical arrangement of frontend clients, backend servers, and the Mongo cluster)*

---

## 9. Conclusion
This SRS serves as the initial blueprint for the CodeSecureX full-stack project. It clearly demarcates the functional bounds of the vulnerability scanning capabilities, administrative auditing requirements, and external API dependencies. Iterative refinement of this document will follow as development progresses through the semester.
