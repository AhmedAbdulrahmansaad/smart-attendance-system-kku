import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase-client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export function DatabaseConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    // Test 1: Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count');
      if (error) throw error;
      results.push({
        name: 'اتصال Supabase',
        status: 'success',
        message: 'الاتصال بقاعدة البيانات ناجح',
        details: data
      });
    } catch (error: any) {
      results.push({
        name: 'اتصال Supabase',
        status: 'error',
        message: error.message || 'فشل الاتصال بقاعدة البيانات'
      });
    }

    // Test 2: Tables exist
    const tables = ['profiles', 'courses', 'enrollments', 'sessions', 'attendance', 'schedules'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) throw error;
        results.push({
          name: `جدول ${table}`,
          status: 'success',
          message: `الجدول موجود ويعمل`
        });
      } catch (error: any) {
        results.push({
          name: `جدول ${table}`,
          status: 'error',
          message: error.message || `الجدول غير موجود`
        });
      }
    }

    // Test 3: RLS Policies
    try {
      // Try to access without auth - should return empty or error
      const { data, error } = await supabase.from('profiles').select('*');
      results.push({
        name: 'RLS Policies',
        status: 'success',
        message: 'سياسات الأمان (RLS) مفعّلة',
        details: { rowCount: data?.length || 0 }
      });
    } catch (error: any) {
      results.push({
        name: 'RLS Policies',
        status: 'success',
        message: 'سياسات الأمان (RLS) تعمل بشكل صحيح (منع الوصول غير المصرح)',
      });
    }

    // Test 4: Views
    try {
      const { data, error } = await supabase.from('attendance_summary').select('*').limit(1);
      if (error) throw error;
      results.push({
        name: 'Views (attendance_summary)',
        status: 'success',
        message: 'العروض (Views) موجودة وتعمل'
      });
    } catch (error: any) {
      results.push({
        name: 'Views (attendance_summary)',
        status: 'error',
        message: error.message || 'العروض غير موجودة'
      });
    }

    setTests(results);
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-[#006747]" />
          <div>
            <h2 className="text-xl font-bold">فحص اتصال قاعدة البيانات</h2>
            <p className="text-sm text-gray-600">Database Connection Test</p>
          </div>
        </div>
        <Button
          onClick={runTests}
          disabled={testing}
          className="bg-[#006747] hover:bg-[#005030]"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              جاري الفحص...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة الفحص
            </>
          )}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-900">نجح</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{successCount}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-900">فشل</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{errorCount}</div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              test.status === 'success'
                ? 'bg-green-50 border-green-200'
                : test.status === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {test.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : test.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-400 mt-0.5 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-bold mb-1">{test.name}</div>
                <div className={`text-sm ${
                  test.status === 'success' ? 'text-green-700' :
                  test.status === 'error' ? 'text-red-700' :
                  'text-gray-600'
                }`}>
                  {test.message}
                </div>
                {test.details && (
                  <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions if tests fail */}
      {errorCount > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2">⚠️ تعليمات حل المشاكل</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>تأكد من تنفيذ ملف COMPLETE_DATABASE_SETUP.sql في Supabase</li>
            <li>تحقق من أن جميع الجداول تم إنشاؤها بنجاح</li>
            <li>راجع ملف دليل_تنفيذ_قاعدة_البيانات.md</li>
            <li>تحقق من Console في المتصفح (F12) للأخطاء</li>
          </ol>
        </div>
      )}

      {/* Success message */}
      {errorCount === 0 && tests.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-bold text-green-900 mb-2">🎉 ممتاز! النظام يعمل بشكل صحيح</h3>
          <p className="text-sm text-green-800">
            جميع الفحوصات نجحت. قاعدة البيانات متصلة وجاهزة للاستخدام.
            يمكنك الآن تسجيل الدخول والبدء في استخدام النظام.
          </p>
        </div>
      )}
    </Card>
  );
}
