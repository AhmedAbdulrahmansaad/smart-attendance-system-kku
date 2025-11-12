export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    universityId: 'الرقم الجامعي',
    role: 'نوع الحساب',
    loading: 'جارٍ التحميل...',
    loginError: 'فشل تسجيل الدخول',
    back: 'رجوع',
    
    // Roles
    student: 'طالب',
    instructor: 'مدرس',
    admin: 'مدير',
    supervisor: 'مشرف',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    users: 'المستخدمون',
    courses: 'المواد الدراسية',
    schedules: 'الجداول الدراسية',
    sessions: 'الجلسات',
    attendance: 'تسجيل الحضور',
    myAttendance: 'سجل حضوري',
    reports: 'التقارير',
    team: 'الفريق',
    teamMembers: 'أعضاء الفريق',
    academicSupervision: 'الإشراف الأكاديمي',
    
    // Dashboard
    overview: 'نظرة عامة',
    stats: 'الإحصائيات',
    recentActivity: 'النشاط الأخير',
    
    // Common
    save: 'حفظ',
    cancel: 'لغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    actions: 'الإجراءات',
    name: 'الاسم',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    description: 'الوصف',
    
    // Messages
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    confirm: 'تأكيد',
    areYouSure: 'هل أنت متأكد؟',
    
    // Time
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    
    // Days
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  },
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    universityId: 'University ID',
    role: 'Role',
    loading: 'Loading...',
    loginError: 'Login failed',
    back: 'Back',
    
    // Roles
    student: 'Student',
    instructor: 'Instructor',
    admin: 'Admin',
    supervisor: 'Supervisor',
    
    // Navigation
    dashboard: 'Dashboard',
    users: 'Users',
    courses: 'Courses',
    schedules: 'Schedules',
    sessions: 'Sessions',
    attendance: 'Mark Attendance',
    myAttendance: 'My Attendance',
    reports: 'Reports',
    team: 'Team',
    teamMembers: 'Team Members',
    academicSupervision: 'Academic Supervision',
    
    // Dashboard
    overview: 'Overview',
    stats: 'Statistics',
    recentActivity: 'Recent Activity',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    actions: 'Actions',
    name: 'Name',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    description: 'Description',
    
    // Messages
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm',
    areYouSure: 'Are you sure?',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    
    // Days
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations.ar): string => {
    return translations[lang][key] || key;
  };
};