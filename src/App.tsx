import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { AdminDashboard } from './components/AdminDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { UserManagement } from './components/UserManagement';
import { CourseManagement } from './components/CourseManagement';
import { ScheduleManagement } from './components/ScheduleManagement';
import { SessionManagement } from './components/SessionManagement';
import { StudentAttendance } from './components/StudentAttendance';
import { MyAttendanceRecords } from './components/MyAttendanceRecords';
import { ReportsPage } from './components/ReportsPage';
import { TeamPage } from './components/TeamPage';
import { BackendHealthCheck } from './components/BackendHealthCheck';
import { SupabaseSetupGuide } from './components/SupabaseSetupGuide';
import { Button } from './components/ui/button';
import { isSupabaseConfigured } from './utils/supabaseClient';

type Page = 'landing' | 'login' | 'team' | 'dashboard' | string;

function AppContent() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupGuide />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    const renderPage = () => {
      // Team page for all roles
      if (currentPage === 'team') {
        return <TeamPage onBack={() => setCurrentPage('dashboard')} />;
      }

      // Admin pages
      if (user.role === 'admin') {
        switch (currentPage) {
          case 'dashboard':
            return <AdminDashboard />;
          case 'users':
            return <UserManagement />;
          case 'courses':
            return <CourseManagement />;
          case 'schedules':
            return <ScheduleManagement />;
          case 'reports':
            return <ReportsPage />;
          default:
            return <AdminDashboard />;
        }
      }

      // Instructor pages
      if (user.role === 'instructor') {
        switch (currentPage) {
          case 'dashboard':
            return <InstructorDashboard />;
          case 'courses':
            return <CourseManagement />;
          case 'sessions':
            return <SessionManagement onNavigate={setCurrentPage} />;
          case 'schedules':
            return <ScheduleManagement />;
          case 'reports':
            return <ReportsPage />;
          default:
            return <InstructorDashboard />;
        }
      }

      // Student pages
      if (user.role === 'student') {
        switch (currentPage) {
          case 'dashboard':
            return <StudentDashboard />;
          case 'attendance':
            return <StudentAttendance />;
          case 'schedule':
            return <ScheduleManagement />;
          case 'my-attendance':
            return <MyAttendanceRecords />;
          default:
            return <StudentDashboard />;
        }
      }

      // Supervisor pages
      if (user.role === 'supervisor') {
        switch (currentPage) {
          case 'dashboard':
            return <ReportsPage />;
          case 'reports':
            return <ReportsPage />;
          default:
            return <ReportsPage />;
        }
      }

      return <div>صفحة غير موجودة</div>;
    };

    return (
      <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </DashboardLayout>
    );
  }

  // If no user, show public pages
  if (currentPage === 'login') {
    return <LoginPage onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'team') {
    return <TeamPage onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'health-check') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#006747]/5 via-white to-[#006747]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage('landing')}
              className="gap-2"
            >
              ← {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </div>
          <BackendHealthCheck />
        </div>
      </div>
    );
  }

  return (
    <LandingPage
      onNavigate={(page) => setCurrentPage(page)}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}