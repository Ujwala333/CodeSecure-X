I am building a full-stack application (Next.js 14 + TypeScript frontend and FastAPI + MongoDB backend).

I want to implement an Admin User Management module with the following requirements:

1. Admin Authentication:
- Admin is authenticated using JWT
- Token is sent in Authorization header (Bearer token)
- Backend must validate admin role using a dependency (require_admin)

2. Backend APIs (FastAPI):
Create or refine the following endpoints inside routes/admin.py:

- GET /api/admin/users
  → Return list of all users with fields: id, email, role, status (active/suspended), created_at

- POST /api/admin/suspend
  → Input: user_id
  → Action: Update user status to "suspended"
  → Return success message

- (Optional) POST /api/admin/unsuspend
  → Input: user_id
  → Action: Restore user status

3. Audit Logging:
- Create a new collection/model: AdminLog
- Fields:
  - admin_id
  - action (e.g., "suspend_user")
  - target_user_id
  - timestamp

- Every admin action (suspend/unsuspend) must create a log entry

4. Error Handling:
- Invalid token → 401 Unauthorized
- Non-admin access → 403 Forbidden
- User not found → 404 error
- Database failure → 500 error with safe message

5. Frontend (Next.js):
Create an Admin User Management page (/admin/users):

- Fetch users using protected API
- Display in table:
  - Email
  - Role
  - Status
  - Action button (Suspend)

- On click:
  → Call suspend API
  → Update UI instantly (optimistic or refetch)

6. Route Protection:
- Protect /admin/users using withAuth HOC
- Only allow admin access
- Redirect unauthorized users

7. API Layer:
- Use Axios with interceptor to attach JWT token
- Handle 401/403 globally

8. UX:
- Show loading state while fetching users
- Show success/error toast messages
- Disable button while action is processing

9. Flow Explanation:
Implement the full flow:
Admin login → Access /admin/users → Fetch users → Perform suspend → Log action → Update UI

Please:
- Follow clean architecture
- Keep backend and frontend modular
- Focus on logic, not unnecessary code

