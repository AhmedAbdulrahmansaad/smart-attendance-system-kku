import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Loader2, Database, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getCourses, createCourse, deleteCourse } from '../utils/apiWithFallback';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export function DatabaseTestPage() {
  const { token } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, details } : t);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setRunning(true);
    setTests([]);

    // Test 1: Supabase Connection
    updateTest('connection', 'pending', 'جارٍ اختبار الاتصال...');
    try {
      const { error } = await supabase
        .from('kv_store_90ad488b')
        .select('key', { count: 'exact', head: true })
        .limit(1);

      if (error) throw error;
      updateTest('connection', 'success', 'الاتصال بـSupabase ناجح ✅');
    } catch (error: any) {
      updateTest('connection', 'error', `فشل الاتصال: ${error.message}`, error);
    }

    // Test 2: Courses Table Read
    updateTest('courses-read', 'pending', 'جارٍ اختبار قراءة جدول Courses...');
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });

      if (error) throw error;
      updateTest('courses-read', 'success', `قراءة جدول Courses ناجحة ✅ (${data?.length || 0} مادة)`, data);
    } catch (error: any) {
      updateTest('courses-read', 'error', `فشل قراءة الجدول: ${error.message}`, error);
    }

    // Test 3: API with Fallback - Get Courses
    updateTest('api-get', 'pending', 'جارٍ اختبار API (getCourses)...');
    try {
      const courses = await getCourses(token);
      updateTest('api-get', 'success', `API (getCourses) يعمل ✅ (${courses.length} مادة)`, courses);
    } catch (error: any) {
      updateTest('api-get', 'error', `فشل API: ${error.message}`, error);
    }

    // Test 4: Create Course (if allowed)
    if (token) {
      updateTest('api-create', 'pending', 'جارٍ اختبار إنشاء مادة...');
      try {
        const testCourse = await createCourse({
          course_name: 'Test Course - ' + Date.now(),
          course_code: 'TEST' + Math.floor(Math.random() * 1000),
          instructor_id: 'test-instructor-id',
        }, token);
        
        updateTest('api-create', 'success', 'إنشاء المادة ناجح ✅', testCourse);

        // Test 5: Delete the test course
        updateTest('api-delete', 'pending', 'جارٍ اختبار حذف المادة...');
        try {
          await deleteCourse(testCourse.id, token);
          updateTest('api-delete', 'success', 'حذف المادة ناجح ✅');
        } catch (error: any) {
          updateTest('api-delete', 'error', `فشل الحذف: ${error.message}`, error);
        }
      } catch (error: any) {
        updateTest('api-create', 'error', `فشل الإنشاء: ${error.message}`, error);
      }
    } else {
      updateTest('api-create', 'error', 'لا يوجد token - يجب تسجيل الدخول أولاً');
    }

    // Test 6: Profiles Table
    updateTest('profiles', 'pending', 'جارٍ اختبار جدول Profiles...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (error) throw error;
      updateTest('profiles', 'success', `جدول Profiles يعمل ✅ (${data?.length || 0} مستخدم)`, data);
    } catch (error: any) {
      updateTest('profiles', 'error', `فشل: ${error.message}`, error);
    }

    setRunning(false);
    toast.success('اكتملت جميع الاختبارات!');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            اختبار قاعدة البيانات والـAPI
          </CardTitle>
          <CardDescription>
            تشخيص شامل للتأكد من أن جميع الوظائف تعمل بشكل صحيح
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ تشغيل الاختبارات...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                تشغيل جميع الاختبارات
              </>
            )}
          </Button>

          {!token && (
            <Alert>
              <AlertDescription>
                ⚠️ لم تقم بتسجيل الدخول - بعض الاختبارات قد لا تعمل
              </AlertDescription>
            </Alert>
          )}

          {tests.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold">نتائج الاختبارات:</h3>
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getStatusColor(test.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm mt-1">{test.message}</div>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:underline">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 p-2 bg-black/5 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tests.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="font-semibold mb-2">الملخص:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>✅ نجح:</span>
                  <span className="font-semibold text-green-600">
                    {tests.filter(t => t.status === 'success').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>❌ فشل:</span>
                  <span className="font-semibold text-red-600">
                    {tests.filter(t => t.status === 'error').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>⏳ قيد التنفيذ:</span>
                  <span className="font-semibold text-blue-600">
                    {tests.filter(t => t.status === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💡 نصائح لحل المشاكل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-semibold mb-1">إذا فشل "الاتصال بـSupabase":</div>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>تأكد من صحة SUPABASE_URL و SUPABASE_ANON_KEY في /config/supabase.config.ts</li>
              <li>تحقق من اتصالك بالإنترنت</li>
              <li>افتح test-supabase.html للتشخيص التفصيلي</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-1">إذا فشل "قراءة جدول Courses":</div>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>تأكد من إنشاء جدول courses في Supabase Dashboard</li>
              <li>نفذ SQL من /DATABASE_SETUP.sql</li>
              <li>تحقق من Row Level Security (RLS)</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold mb-1">إذا فشل "API":</div>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>النظام سيستخدم Supabase مباشرة تلقائياً إذا Edge Function غير متاح</li>
              <li>تأكد من أنك مسجل دخول (token موجود)</li>
              <li>افتح Console (F12) لمزيد من التفاصيل</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
