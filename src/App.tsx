import React, { useState, lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Button } from './components/ui/button';
import { isSupabaseConfigured } from './utils/supabaseClient';
import { LoadingFallback } from './components/LoadingFallback';

// Lazy load heavy components for better performance
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const InstructorDashboard = lazy(() => import('./components/InstructorDashboard').then(m => ({ default: m.InstructorDashboard })));
const StudentDashboard = lazy(() => import('./components/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const UserManagement = lazy(() => import('./components/UserManagement').then(m => ({ default: m.UserManagement })));
const CourseManagement = lazy(() => import('./components/CourseManagement').then(m => ({ default: m.CourseManagement })));
const ScheduleManagement = lazy(() => import('./components/ScheduleManagement').then(m => ({ default: m.ScheduleManagement })));
const SessionManagement = lazy(() => import('./components/SessionManagement').then(m => ({ default: m.SessionManagement })));
const StudentAttendance = lazy(() => import('./components/StudentAttendance').then(m => ({ default: m.StudentAttendance })));
const MyAttendanceRecords = lazy(() => import('./components/MyAttendanceRecords').then(m => ({ default: m.MyAttendanceRecords })));
const ReportsPage = lazy(() => import('./components/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TeamPage = lazy(() => import('./components/TeamPage').then(m => ({ default: m.TeamPage })));
const BackendHealthCheck = lazy(() => import('./components/BackendHealthCheck').then(m => ({ default: m.BackendHealthCheck })));
const SupabaseSetupGuide = lazy(() => import('./components/SupabaseSetupGuide').then(m => ({ default: m.SupabaseSetupGuide })));

type Page = 'landing' | 'login' | 'team' | 'dashboard' | string;

function AppContent() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <SupabaseSetupGuide />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (loading) {
    return <LoadingFallback />;
  }

  // If user is logged in, show dashboard
  if (user) {
    const renderPage = () => {
      // Team page for all roles
      if (currentPage === 'team') {
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <TeamPage onBack={() => setCurrentPage('dashboard')} />
            </Suspense>
          </ErrorBoundary>
        );
      }

      // Admin pages
      if (user.role === 'admin') {
        switch (currentPage) {
          case 'dashboard':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              </ErrorBoundary>
            );
          case 'users':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <UserManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'courses':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <CourseManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'schedules':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ScheduleManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'reports':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              </ErrorBoundary>
            );
          default:
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              </ErrorBoundary>
            );
        }
      }

      // Instructor pages
      if (user.role === 'instructor') {
        switch (currentPage) {
          case 'dashboard':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <InstructorDashboard />
                </Suspense>
              </ErrorBoundary>
            );
          case 'courses':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <CourseManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'sessions':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <SessionManagement onNavigate={setCurrentPage} />
                </Suspense>
              </ErrorBoundary>
            );
          case 'schedules':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ScheduleManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'reports':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              </ErrorBoundary>
            );
          default:
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <InstructorDashboard />
                </Suspense>
              </ErrorBoundary>
            );
        }
      }

      // Student pages
      if (user.role === 'student') {
        switch (currentPage) {
          case 'dashboard':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StudentDashboard />
                </Suspense>
              </ErrorBoundary>
            );
          case 'attendance':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StudentAttendance />
                </Suspense>
              </ErrorBoundary>
            );
          case 'schedule':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ScheduleManagement />
                </Suspense>
              </ErrorBoundary>
            );
          case 'my-attendance':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <MyAttendanceRecords />
                </Suspense>
              </ErrorBoundary>
            );
          default:
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <StudentDashboard />
                </Suspense>
              </ErrorBoundary>
            );
        }
      }

      // Supervisor pages
      if (user.role === 'supervisor') {
        switch (currentPage) {
          case 'dashboard':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              </ErrorBoundary>
            );
          case 'reports':
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              </ErrorBoundary>
            );
          default:
            return (
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <ReportsPage />
                </Suspense>
              </ErrorBoundary>
            );
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
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <TeamPage onBack={() => setCurrentPage('landing')} />
        </Suspense>
      </ErrorBoundary>
    );
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
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <BackendHealthCheck />
            </Suspense>
          </ErrorBoundary>
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}