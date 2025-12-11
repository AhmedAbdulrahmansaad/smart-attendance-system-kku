/**
 * Demo Data Generator for KKU Smart Attendance System
 * Creates realistic demo data for testing
 */

import * as kv from './kv_store.tsx';

// Sample KKU Courses (Real courses from King Khalid University)
export const DEMO_COURSES = [
  {
    id: 'course_cs101',
    code: 'CS-101',
    name: 'مقدمة في علوم الحاسب',
    name_en: 'Introduction to Computer Science',
    department: 'علوم الحاسب',
    department_en: 'Computer Science',
    semester: 'الفصل الأول 2024/2025',
    credits: 3,
    instructor_id: '', // Will be set dynamically
    instructor_name: 'د. أحمد محمد العمري',
    schedule: 'الأحد والثلاثاء 10:00-11:30',
    room: 'A-201',
    max_students: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course_cs102',
    code: 'CS-102',
    name: 'البرمجة المتقدمة',
    name_en: 'Advanced Programming',
    department: 'علوم الحاسب',
    department_en: 'Computer Science',
    semester: 'الفصل الأول 2024/2025',
    credits: 3,
    instructor_id: '',
    instructor_name: 'د. أحمد محمد العمري',
    schedule: 'الاثنين والأربعاء 08:00-09:30',
    room: 'B-105',
    max_students: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course_math201',
    code: 'MATH-201',
    name: 'الرياضيات المتقدمة',
    name_en: 'Advanced Mathematics',
    department: 'الرياضيات',
    department_en: 'Mathematics',
    semester: 'الفصل الأول 2024/2025',
    credits: 4,
    instructor_id: '',
    instructor_name: 'د. سارة علي القحطاني',
    schedule: 'الأحد والثلاثاء والخميس 12:00-13:00',
    room: 'C-301',
    max_students: 40,
    created_at: new Date().toISOString(),
  },
];

// Sample Students (Realistic KKU students)
export const DEMO_STUDENTS = [
  {
    full_name: 'أحمد محمد عبدالله',
    email: 'ahmad.abdullah@kku.edu.sa',
    university_id: '441234567',
    role: 'student',
  },
  {
    full_name: 'محمد عبدالعزيز السعيد',
    email: 'mohammed.alsaeed@kku.edu.sa',
    university_id: '441234568',
    role: 'student',
  },
  {
    full_name: 'سارة أحمد الشهري',
    email: 'sarah.alshahri@kku.edu.sa',
    university_id: '441234569',
    role: 'student',
  },
  {
    full_name: 'فاطمة علي القرني',
    email: 'fatima.alqarni@kku.edu.sa',
    university_id: '441234570',
    role: 'student',
  },
  {
    full_name: 'عبدالله خالد العمري',
    email: 'abdullah.alomari@kku.edu.sa',
    university_id: '441234571',
    role: 'student',
  },
];

/**
 * Initialize demo data for a user
 */
export async function initializeDemoData(userId: string, userRole: string, userEmail: string) {
  console.log(`🎬 [Demo] Initializing demo data for ${userRole}:`, userEmail);

  try {
    if (userRole === 'instructor') {
      await initializeInstructorDemoData(userId, userEmail);
    } else if (userRole === 'student') {
      await initializeStudentDemoData(userId, userEmail);
    }
    
    console.log('✅ [Demo] Demo data initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [Demo] Error initializing demo data:', error);
    return { success: false, error };
  }
}

/**
 * Initialize demo data for instructor
 */
async function initializeInstructorDemoData(instructorId: string, instructorEmail: string) {
  console.log('👨‍🏫 [Demo] Creating instructor courses and sessions...');

  // Create courses for this instructor
  const instructorCourses = DEMO_COURSES.map(course => ({
    ...course,
    instructor_id: instructorId,
    instructor_email: instructorEmail,
  }));

  // Save courses
  for (const course of instructorCourses) {
    await kv.set(`course:${course.id}`, course);
    await kv.set(`course_by_instructor:${instructorId}:${course.id}`, course.id);
    console.log(`✅ [Demo] Created course: ${course.name}`);
  }

  // Create demo students and enroll them
  for (let i = 0; i < DEMO_STUDENTS.length; i++) {
    const studentData = DEMO_STUDENTS[i];
    const studentId = `student_demo_${i + 1}`;
    
    // Check if student already exists
    const existing = await kv.get(`user:${studentId}`);
    if (!existing) {
      const student = {
        id: studentId,
        ...studentData,
        password: 'Kku@2025!', // Demo password
        created_at: new Date().toISOString(),
      };
      
      await kv.set(`user:${studentId}`, student);
      await kv.set(`user_by_email:${studentData.email}`, studentId);
      console.log(`✅ [Demo] Created student: ${studentData.full_name}`);
    }

    // Enroll students in courses (each student enrolled in 2-3 courses)
    const coursesToEnroll = instructorCourses.slice(0, 2 + Math.floor(Math.random() * 2));
    
    for (const course of coursesToEnroll) {
      const enrollmentId = `enrollment_${Date.now()}_${studentId}_${course.id}`;
      const enrollment = {
        id: enrollmentId,
        student_id: studentId,
        course_id: course.id,
        course_name: course.name,
        enrolled_at: new Date().toISOString(),
        status: 'active',
      };
      
      await kv.set(`enrollment:${studentId}:${course.id}`, enrollment);
      console.log(`✅ [Demo] Enrolled ${studentData.full_name} in ${course.name}`);
    }
  }

  // Create demo sessions for each course
  for (const course of instructorCourses) {
    // Create 3 sessions for each course
    for (let i = 0; i < 3; i++) {
      const sessionId = `session_${Date.now()}_${course.id}_${i}`;
      const sessionCode = generateSessionCode();
      
      const daysAgo = i * 2; // Sessions from different days
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - daysAgo);
      
      const session = {
        id: sessionId,
        course_id: course.id,
        course_name: course.name,
        instructor_id: instructorId,
        code: sessionCode,
        title: `محاضرة ${i + 1} - ${course.name}`,
        description: `جلسة تعليمية رقم ${i + 1}`,
        date: sessionDate.toISOString(),
        duration: 90,
        active: i === 0, // Only the most recent session is active
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        created_at: new Date().toISOString(),
      };
      
      await kv.set(`session:${sessionId}`, session);
      await kv.set(`session_code:${sessionCode}`, sessionId);
      console.log(`✅ [Demo] Created session: ${session.title} (${sessionCode})`);

      // Create attendance records for some students
      if (i > 0) { // Past sessions have attendance
        const enrolledStudents = await getEnrolledStudents(course.id);
        const attendanceRate = 0.7 + Math.random() * 0.2; // 70-90% attendance
        
        for (const student of enrolledStudents) {
          if (Math.random() < attendanceRate) {
            const attendanceId = `attendance_${Date.now()}_${student.id}_${sessionId}`;
            const attendance = {
              id: attendanceId,
              student_id: student.id,
              session_id: sessionId,
              course_id: course.id,
              date: sessionDate.toISOString(),
              status: 'present',
              marked_at: sessionDate.toISOString(),
            };
            
            await kv.set(`attendance:${student.id}:${sessionId}`, attendance);
          }
        }
      }
    }
  }

  console.log('✅ [Demo] Instructor demo data created successfully');
}

/**
 * Initialize demo data for student
 */
async function initializeStudentDemoData(studentId: string, studentEmail: string) {
  console.log('👨‍🎓 [Demo] Creating student enrollments...');

  // Get or create demo instructor
  const demoInstructorId = 'instructor_demo_1';
  const demoInstructor = await kv.get(`user:${demoInstructorId}`);
  
  if (!demoInstructor) {
    const instructor = {
      id: demoInstructorId,
      full_name: 'د. أحمد محمد العمري',
      email: 'ahmad.alomari@kku.edu.sa',
      role: 'instructor',
      password: 'Kku@2025!',
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`user:${demoInstructorId}`, instructor);
    await kv.set(`user_by_email:${instructor.email}`, demoInstructorId);
  }

  // Create demo courses if they don't exist
  const instructorCourses = DEMO_COURSES.map(course => ({
    ...course,
    instructor_id: demoInstructorId,
    instructor_email: 'ahmad.alomari@kku.edu.sa',
  }));

  for (const course of instructorCourses) {
    const existing = await kv.get(`course:${course.id}`);
    if (!existing) {
      await kv.set(`course:${course.id}`, course);
      await kv.set(`course_by_instructor:${demoInstructorId}:${course.id}`, course.id);
    }
  }

  // Enroll the student in 2-3 courses
  const coursesToEnroll = instructorCourses.slice(0, 2 + Math.floor(Math.random() * 2));
  
  for (const course of coursesToEnroll) {
    const enrollmentId = `enrollment_${Date.now()}_${studentId}_${course.id}`;
    const enrollment = {
      id: enrollmentId,
      student_id: studentId,
      course_id: course.id,
      course_name: course.name,
      instructor_name: course.instructor_name,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    };
    
    await kv.set(`enrollment:${studentId}:${course.id}`, enrollment);
    console.log(`✅ [Demo] Enrolled in: ${course.name}`);
  }

  // Create active session for student to join
  for (const course of coursesToEnroll) {
    const sessionId = `session_${Date.now()}_${course.id}`;
    const sessionCode = generateSessionCode();
    
    const session = {
      id: sessionId,
      course_id: course.id,
      course_name: course.name,
      instructor_id: demoInstructorId,
      instructor_name: course.instructor_name,
      code: sessionCode,
      title: `محاضرة حية - ${course.name}`,
      description: 'جلسة تعليمية مباشرة',
      date: new Date().toISOString(),
      duration: 90,
      active: true,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`session:${sessionId}`, session);
    await kv.set(`session_code:${sessionCode}`, sessionId);
    console.log(`✅ [Demo] Created active session: ${sessionCode}`);
  }

  console.log('✅ [Demo] Student demo data created successfully');
}

/**
 * Get enrolled students for a course
 */
async function getEnrolledStudents(courseId: string) {
  const enrollments = await kv.getByPrefix(`enrollment:`);
  const courseEnrollments = enrollments.filter((e: any) => e.course_id === courseId);
  
  const students = [];
  for (const enrollment of courseEnrollments) {
    const student = await kv.get(`user:${enrollment.student_id}`);
    if (student) {
      students.push(student);
    }
  }
  
  return students;
}

/**
 * Generate random session code
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if user has demo data
 */
export async function hasDemoData(userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'instructor') {
    const courses = await kv.getByPrefix(`course_by_instructor:${userId}:`);
    return courses.length > 0;
  } else if (userRole === 'student') {
    const enrollments = await kv.getByPrefix(`enrollment:${userId}:`);
    return enrollments.length > 0;
  }
  
  return false;
}
