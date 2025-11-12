import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { BookOpen, Plus, Trash2, Search, AlertCircle, Users as UsersIcon } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  instructor_id: string | null;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function CourseManagement() {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [error, setError] = useState('');

  // New course form state
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');

  // Enrollment state
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    loadCourses();
    if (currentUser?.role === 'admin') {
      loadInstructors();
      loadStudents();
    }
  }, [currentUser]);

  const loadCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/courses', {
        token: session.access_token,
      });

      setCourses(data.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('فشل تحميل المواد');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/users', {
        token: session.access_token,
      });

      setInstructors(data.users.filter((u: User) => u.role === 'instructor'));
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const data = await apiRequest('/users', {
        token: session.access_token,
      });

      setStudents(data.users.filter((u: User) => u.role === 'student'));
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const instructorId = currentUser?.role === 'instructor' 
        ? currentUser.id 
        : (newCourseInstructor || null);

      await apiRequest('/courses', {
        method: 'POST',
        body: {
          course_name: newCourseName,
          course_code: newCourseCode,
          instructor_id: instructorId,
        },
        token: session.access_token,
      });

      setIsDialogOpen(false);
      setNewCourseName('');
      setNewCourseCode('');
      setNewCourseInstructor('');
      
      await loadCourses();
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل إضافة المادة' : 'Failed to add course'));
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await apiRequest(`/courses/${courseId}`, {
        method: 'DELETE',
        token: session.access_token,
      });

      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setError('فشل حذف المادة');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await apiRequest('/enrollments', {
        method: 'POST',
        body: {
          student_id: selectedStudentId,
          course_id: selectedCourseId,
        },
        token: session.access_token,
      });

      setEnrollDialogOpen(false);
      setSelectedStudentId('');
      setSelectedCourseId('');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الطالب');
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInstructorName = (instructorId: string | null) => {
    if (!instructorId) return 'غير محدد';
    const instructor = instructors.find((i) => i.id === instructorId);
    return instructor ? instructor.full_name : 'غير معروف';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{language === 'ar' ? 'إدارة المواد الدراسية' : 'Course Management'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إضافة وحذف وإدارة المواد الدراسية' : 'Add, delete and manage courses'}
          </p>
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                {language === 'ar' ? 'إضافة مادة' : 'Add Course'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة مادة دراسية جديدة' : 'Add New Course'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'املأ البيانات التالية لإنشاء مادة جديدة' 
                    : 'Fill in the following information to create a new course'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-name">
                    {language === 'ar' ? 'اسم المادة' : 'Course Name'}
                  </Label>
                  <Input
                    id="course-name"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: البرمجة المتقدمة' : 'e.g., Advanced Programming'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-code">
                    {language === 'ar' ? 'كود المادة' : 'Course Code'}
                  </Label>
                  <Input
                    id="course-code"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: CS301' : 'e.g., CS301'}
                    required
                  />
                </div>

                {currentUser?.role === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="instructor">
                      {language === 'ar' ? 'المدرس (اختياري)' : 'Instructor (Optional)'}
                    </Label>
                    <select
                      id="instructor"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newCourseInstructor}
                      onChange={(e) => setNewCourseInstructor(e.target.value)}
                    >
                      <option value="">
                        {language === 'ar' ? '-- اختر مدرساً --' : '-- Select Instructor --'}
                      </option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {currentUser?.role === 'instructor' && (
                  <Alert>
                    <AlertDescription>
                      {language === 'ar' 
                        ? 'سيتم تعيينك كمدرس لهذه المادة تلقائياً' 
                        : 'You will be automatically assigned as the instructor for this course'}
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث عن مادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد مواد دراسية' : 'No courses found'}
              </p>
              {(currentUser?.role === 'admin' || currentUser?.role === 'instructor') && (
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' 
                    ? 'ابدأ بإضافة مادة جديدة من الزر أعلاه' 
                    : 'Start by adding a new course using the button above'}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {course.course_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {course.course_code}
                    </CardDescription>
                  </div>
                  {(currentUser?.role === 'admin' || 
                    (currentUser?.role === 'instructor' && course.instructor_id === currentUser.id)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'المدرس:' : 'Instructor:'}
                    </span>
                    <span>{getInstructorName(course.instructor_id)}</span>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setEnrollDialogOpen(true);
                      }}
                    >
                      <UsersIcon className="w-4 h-4 ml-2" />
                      {language === 'ar' ? 'تسجيل طالب' : 'Enroll Student'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل طالب في المادة</DialogTitle>
            <DialogDescription>
              اختر طالباً لتسجيله في المادة
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEnrollStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">الطالب</Label>
              <select
                id="student"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- اختر طالباً --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">تسجيل</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnrollDialogOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}