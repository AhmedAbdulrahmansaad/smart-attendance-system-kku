# Update Imports Script

يجب تحديث جميع الملفات التالية لاستخدام المسار الجديد:

## From:
```typescript
import { supabase } from '../utils/supabase-client';
```

## To:
```typescript
import { supabase } from '../utils/supabaseClient';
```

## Files to Update:
- [x] /components/AuthContext.tsx
- [x] /components/AdminDashboard.tsx
- [x] /components/SessionManagement.tsx
- [ ] /components/UserManagement.tsx
- [ ] /components/CourseManagement.tsx
- [ ] /components/ScheduleManagement.tsx
- [ ] /components/StudentAttendance.tsx
- [ ] /components/MyAttendanceRecords.tsx
- [ ] /components/StudentDashboard.tsx
- [ ] /components/InstructorDashboard.tsx
- [ ] /components/ReportsPage.tsx
- [ ] /components/LiveStreamHost.tsx
- [ ] /components/LiveStreamViewer.tsx
