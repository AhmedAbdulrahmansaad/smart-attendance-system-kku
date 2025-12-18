import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../utils/i18n';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  Globe,
  UsersIcon,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const { language, setLanguage, dir } = useLanguage();
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return null;

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const menuItems = {
    admin: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'users', label: t('users'), icon: Users },
      { id: 'courses', label: t('courses'), icon: BookOpen },
      { id: 'schedules', label: t('schedules'), icon: Calendar },
      { id: 'reports', label: t('reports'), icon: FileText },
      { id: 'team', label: t('team'), icon: UsersIcon },
      { id: 'rls-verification', label: language === 'ar' ? 'التحقق من RLS' : 'RLS Verification', icon: ClipboardCheck },
    ],
    instructor: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'courses', label: t('courses'), icon: BookOpen },
      { id: 'sessions', label: t('sessions'), icon: ClipboardCheck },
      { id: 'schedules', label: t('schedules'), icon: Calendar },
      { id: 'reports', label: t('reports'), icon: FileText },
      { id: 'team', label: t('team'), icon: UsersIcon },
    ],
    student: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'attendance', label: t('attendance'), icon: ClipboardCheck },
      { id: 'schedule', label: t('schedules'), icon: Calendar },
      { id: 'my-attendance', label: language === 'ar' ? 'سجل الحضور' : 'My Attendance', icon: FileText },
      { id: 'team', label: t('team'), icon: UsersIcon },
    ],
    supervisor: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'reports', label: t('reports'), icon: FileText },
      { id: 'team', label: t('team'), icon: UsersIcon },
    ],
  };

  const items = menuItems[user.role] || [];

  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      {/* Sidebar */}
      <aside
        className={`
          fixed ${dir === 'rtl' ? 'right-0' : 'left-0'} top-0 h-full bg-sidebar text-sidebar-foreground
          transition-all duration-300 z-30
          ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-medium">{language === 'ar' ? 'نظام الحضور' : 'Attendance'}</h2>
                  <p className="text-xs text-sidebar-foreground/70">
                    {language === 'ar' ? 'جامعة الملك خالد' : 'KKU'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {t(user.role)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors mb-1
                    ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground'
                    }
                    ${!sidebarOpen && 'justify-center'}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Language Toggle & Logout */}
          <div className="p-2 border-t border-sidebar-border space-y-1">
            <button
              onClick={toggleLanguage}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                hover:bg-sidebar-accent text-sidebar-foreground transition-colors
                ${!sidebarOpen && 'justify-center'}
              `}
            >
              <Globe className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{language === 'ar' ? 'English' : 'العربية'}</span>}
            </button>
            
            <button
              onClick={() => signOut()}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                hover:bg-destructive/10 text-destructive transition-colors
                ${!sidebarOpen && 'justify-center'}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{t('logout')}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300
          ${sidebarOpen ? (dir === 'rtl' ? 'mr-64' : 'ml-64') : (dir === 'rtl' ? 'mr-0 md:mr-20' : 'ml-0 md:ml-20')}
        `}
      >
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}