import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface InitialSetupProps {
  onSetupComplete: () => void;
}

export function InitialSetup({ onSetupComplete }: InitialSetupProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'welcome' | 'creating' | 'done' | 'error'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tablesExist, setTablesExist] = useState<boolean | 'rls_error' | null>(null);
  const [checkingTables, setCheckingTables] = useState(true);

  // Check if tables exist
  useEffect(() => {
    async function checkDatabaseTables() {
      try {
        console.log('🔍 [InitialSetup] Checking if tables exist...');
        
        // Try to query profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('❌ [InitialSetup] Table check error:', error);
          
          // Check error code
          if (error.code === '42P01') {
            // Table does not exist
            console.error('🔥 [InitialSetup] TABLE DOES NOT EXIST!');
            setTablesExist(false);
          } else if (error.code === '42P17') {
            // Infinite recursion in RLS policy
            console.error('🔥 [InitialSetup] INFINITE RECURSION IN RLS POLICY!');
            setTablesExist('rls_error');
          } else {
            // Other error (table exists but query failed)
            setTablesExist(true);
          }
        } else {
          // Table exists
          console.log('✅ [InitialSetup] Tables exist');
          setTablesExist(true);
        }
      } catch (error) {
        console.error('❌ [InitialSetup] Check error:', error);
        setTablesExist(false);
      } finally {
        setCheckingTables(false);
      }
    }
    
    checkDatabaseTables();
  }, []);

  const createInitialAdmin = async () => {
    setLoading(true);
    setStep('creating');

    try {
      console.log('🚀 [InitialSetup] Creating initial admin user...');

      // استخدام backend endpoint مباشرة
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-90ad488b/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            role: 'admin'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [InitialSetup] Backend error:', errorData);
        throw new Error(errorData.error || errorData.messageAr || 'Failed to create user');
      }

      const data = await response.json();
      console.log('✅ [InitialSetup] User created successfully:', data);

      setStep('done');
      
      toast.success('تم إنشاء المستخدم بنجاح! / User created successfully!', {
        description: 'سيتم تسجيل الدخول تلقائياً / Logging in automatically...'
      });

      // تسجيل الدخول تلقائياً
      setTimeout(async () => {
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.error('❌ [InitialSetup] Sign in error:', signInError);
            toast.error('فشل تسجيل الدخول / Login failed', {
              description: 'يرجى تسجيل الدخول يدوياً / Please login manually'
            });
            setTimeout(() => onSetupComplete(), 2000);
            return;
          }

          if (signInData.session) {
            console.log('✅ [InitialSetup] Signed in successfully');
            toast.success('تم تسجيل الدخول بنجاح! / Logged in successfully!');
          }

          onSetupComplete();
        } catch (error) {
          console.error('❌ [InitialSetup] Login error:', error);
          onSetupComplete();
        }
      }, 2000);

    } catch (error: any) {
      console.error('❌ [InitialSetup] Setup error:', error);
      toast.error('فشل إنشاء المستخدم / Failed to create user', {
        description: error.message
      });
      setStep('error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Checking tables */}
        {checkingTables && (
          <div className="text-center space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                جاري التحقق من قاعدة البيانات...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Checking database...
              </p>
            </div>
          </div>
        )}

        {/* Tables don't exist - show error */}
        {!checkingTables && tablesExist === false && (
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div>
              <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                قاعدة البيانات غير جاهزة!
              </h1>
              <p className="text-xl text-red-500 dark:text-red-400">
                Database Not Ready!
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 text-right">
              <div className="space-y-4">
                <p className="text-red-900 dark:text-red-100 font-bold text-lg">
                  ⚠️ الجداول غير موجودة في قاعدة البيانات!
                </p>
                <p className="text-red-800 dark:text-red-200">
                  The database tables do not exist!
                </p>
                
                <div className="bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg p-4 mt-4">
                  <p className="text-red-900 dark:text-red-100 font-semibold mb-2">
                    🔥 يجب تشغيل السكريبت SQL أولاً!
                  </p>
                  <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                    You MUST run the SQL script first!
                  </p>
                  
                  <div className="text-right space-y-2 text-sm">
                    <p className="text-red-700 dark:text-red-300">
                      <strong>الخطوات:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-red-700 dark:text-red-300">
                      <li>افتح Supabase Dashboard</li>
                      <li>اذهب إلى SQL Editor</li>
                      <li>انسخ محتوى: 🔥_إنشاء_الجداول_CREATE_TABLES.sql</li>
                      <li>الصق في SQL Editor</li>
                      <li>اضغط "Run"</li>
                      <li>انتظر حتى ينتهي التنفيذ</li>
                      <li>أعد تحميل هذه الصفحة</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mt-4">
                  <p className="text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
                    📖 راجع الدليل التفصيلي:
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm font-mono">
                    🚨_مهم_جداً_RUN_THIS_SQL.md
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              🔄 إعادة تحميل الصفحة / Reload Page
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 بعد تشغيل السكريبت، اضغط "إعادة تحميل الصفحة"<br/>
                💡 After running the SQL script, click "Reload Page"
              </p>
            </div>
          </div>
        )}

        {/* RLS Error - show fix */}
        {!checkingTables && tablesExist === 'rls_error' && (
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div>
              <h1 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                خطأ في سياسات الأمان!
              </h1>
              <p className="text-xl text-orange-500 dark:text-orange-400">
                RLS Policy Error!
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-6 text-right">
              <div className="space-y-4">
                <p className="text-orange-900 dark:text-orange-100 font-bold text-lg">
                  🔥 Infinite recursion detected in RLS policy!
                </p>
                <p className="text-orange-800 dark:text-orange-200">
                  خطأ: تكرار لا نهائي في سياسات الأمان
                </p>
                
                <div className="bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-800 rounded-lg p-4 mt-4">
                  <p className="text-orange-900 dark:text-orange-100 font-semibold mb-2">
                    🔧 يجب إصلاح الياسات!
                  </p>
                  <p className="text-orange-800 dark:text-orange-200 text-sm mb-3">
                    You MUST fix the RLS policies!
                  </p>
                  
                  <div className="text-right space-y-2 text-sm">
                    <p className="text-orange-700 dark:text-orange-300">
                      <strong>الخطوات:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-orange-700 dark:text-orange-300">
                      <li>افتح Supabase Dashboard</li>
                      <li>اذهب إلى SQL Editor</li>
                      <li>انسخ محتوى: 🔥_إصلاح_RLS_FIX_POLICIES.sql</li>
                      <li>الصق في SQL Editor</li>
                      <li>اضغط "Run"</li>
                      <li>انتظر "Success"</li>
                      <li>أعد تحميل هذه الصفحة</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mt-4">
                  <p className="text-yellow-900 dark:text-yellow-100 text-sm">
                    <strong>المشكلة:</strong> السياسات الأمنية القديمة تحتوي على subqueries تسبب infinite recursion
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm mt-2">
                    <strong>الحل:</strong> تعطيل RLS مؤقتاً للتطوير
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              🔄 إعادة تحميل الصفحة / Reload Page
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 بعد تشغيل سكريبت الإصلاح، اضغط "إعادة تحميل الصفحة"<br/>
                💡 After running the fix script, click "Reload Page"
              </p>
            </div>
          </div>
        )}

        {/* Tables exist - show setup */}
        {!checkingTables && tablesExist === true && step === 'welcome' && (
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            {/* Welcome Text */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                مرحباً بك في نظام الحضور الذكي
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Welcome to Smart Attendance System
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-right">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-2">
                  <p className="text-blue-900 dark:text-blue-100 font-semibold">
                    الإعداد الأولي مطلوب / Initial Setup Required
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    لا يوجد مستخدمين في النظام. يرجى إنشاء حساب المدير الأول للبدء.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                    No users found in the system. Please create the first admin account to get started.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 text-right">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم الكامل / Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مدير النظام"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني / Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="admin@kku.edu.sa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  كلمة المرور / Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="admin123"
                />
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createInitialAdmin}
              disabled={loading || !email.endsWith('@kku.edu.sa')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري الإنشاء... / Creating...</span>
                </div>
              ) : (
                <span>إنشاء حساب المدير / Create Admin Account</span>
              )}
            </button>

            {!email.endsWith('@kku.edu.sa') && (
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ يجب استخدام بريد جامعي @kku.edu.sa / Must use @kku.edu.sa email
              </p>
            )}

            {/* Tips */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 نصيحة: يمكنك تغيير كلمة المرور بعد تسجيل الدخول<br/>
                💡 Tip: You can change the password after logging in
              </p>
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="text-center space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                جاري إنشاء الحساب...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Creating account...
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>✓ إنشاء المستخدم في النظام / Creating user in system</p>
              <p>✓ إنشاء الملف الشخصي / Creating profile</p>
              <p>⏳ تسجيل الدخول التلقائي / Auto-login</p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                تم بنجاح! ✨
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Success!
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <p className="text-green-900 dark:text-green-100 font-semibold mb-2">
                تم إنشاء حساب المدير بنجاح
              </p>
              <p className="text-green-800 dark:text-green-200 text-sm">
                Admin account created successfully
              </p>
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 text-right space-y-1">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>البريد:</strong> {email}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>الدور:</strong> مدير النظام / Admin
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              سيتم تسجيل الدخول تلقائياً... / Logging in automatically...
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-6 py-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                حدث خطأ! ❌
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Error!
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <p className="text-red-900 dark:text-red-100 font-semibold mb-2">
                فشل إنشاء حساب المدير
              </p>
              <p className="text-red-800 dark:text-red-200 text-sm">
                Admin account creation failed
              </p>
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800 text-right space-y-1">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>البريد:</strong> {email}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>الدور:</strong> مدير النظام / Admin
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              يرجى إعادة المحاولة... / Please try again...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}