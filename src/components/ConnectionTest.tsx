import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

export function ConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    // Test 1: Supabase Connection
    results.push({ name: 'اتصال Supabase / Supabase Connection', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        results[0] = {
          name: 'اتصال Supabase / Supabase Connection',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[0] = {
          name: 'اتصال Supabase / Supabase Connection',
          status: 'success',
          message: '✅ الاتصال ناجح / Connection successful'
        };
      }
    } catch (err: any) {
      results[0] = {
        name: 'اتصال Supabase / Supabase Connection',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 2: Profiles Table
    results.push({ name: 'جدول Profiles / Profiles Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(5);
      
      if (error) {
        results[1] = {
          name: 'جدول Profiles / Profiles Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[1] = {
          name: 'جدول Profiles / Profiles Table',
          status: 'success',
          message: `✅ ${data?.length || 0} مستخدمين / users found`,
          details: data
        };
      }
    } catch (err: any) {
      results[1] = {
        name: 'جدول Profiles / Profiles Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 3: Courses Table
    results.push({ name: 'جدول Courses / Courses Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('courses').select('*').limit(5);
      
      if (error) {
        results[2] = {
          name: 'جدول Courses / Courses Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[2] = {
          name: 'جدول Courses / Courses Table',
          status: 'success',
          message: `✅ ${data?.length || 0} مقررات / courses found`,
          details: data
        };
      }
    } catch (err: any) {
      results[2] = {
        name: 'جدول Courses / Courses Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 4: Sessions Table
    results.push({ name: 'جدول Sessions / Sessions Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('sessions').select('*').limit(5);
      
      if (error) {
        results[3] = {
          name: 'جدول Sessions / Sessions Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[3] = {
          name: 'جدول Sessions / Sessions Table',
          status: 'success',
          message: `✅ ${data?.length || 0} جلسات / sessions found`,
          details: data
        };
      }
    } catch (err: any) {
      results[3] = {
        name: 'جدول Sessions / Sessions Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 5: Attendance Table
    results.push({ name: 'جدول Attendance / Attendance Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('attendance').select('*').limit(5);
      
      if (error) {
        results[4] = {
          name: 'جدول Attendance / Attendance Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[4] = {
          name: 'جدول Attendance / Attendance Table',
          status: 'success',
          message: `✅ ${data?.length || 0} سجلات حضور / attendance records found`,
          details: data
        };
      }
    } catch (err: any) {
      results[4] = {
        name: 'جدول Attendance / Attendance Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 6: Live Sessions Table
    results.push({ name: 'جدول Live Sessions / Live Sessions Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('live_sessions').select('*').limit(5);
      
      if (error) {
        results[5] = {
          name: 'جدول Live Sessions / Live Sessions Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[5] = {
          name: 'جدول Live Sessions / Live Sessions Table',
          status: 'success',
          message: `✅ ${data?.length || 0} جلسات مباشرة / live sessions found`,
          details: data
        };
      }
    } catch (err: any) {
      results[5] = {
        name: 'جدول Live Sessions / Live Sessions Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    
    // Test 7: Enrollments Table
    results.push({ name: 'جدول Enrollments / Enrollments Table', status: 'loading', message: 'جاري الاختبار...' });
    setTests([...results]);
    
    try {
      const { data, error } = await supabase.from('enrollments').select('*').limit(5);
      
      if (error) {
        results[6] = {
          name: 'جدول Enrollments / Enrollments Table',
          status: 'error',
          message: error.message,
          details: error
        };
      } else {
        results[6] = {
          name: 'جدول Enrollments / Enrollments Table',
          status: 'success',
          message: `✅ ${data?.length || 0} تسجيلات / enrollments found`,
          details: data
        };
      }
    } catch (err: any) {
      results[6] = {
        name: 'جدول Enrollments / Enrollments Table',
        status: 'error',
        message: err.message
      };
    }
    
    setTests([...results]);
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const allSuccess = tests.length > 0 && tests.every(t => t.status === 'success');
  const hasError = tests.some(t => t.status === 'error');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {allSuccess ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : hasError ? (
              <XCircle className="w-6 h-6 text-red-500" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            )}
            فحص الاتصال بقاعدة البيانات
            <br />
            Database Connection Test
          </CardTitle>
          <Button 
            onClick={runTests} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
      </CardHeader>
      <CardContent className="space-y-3">
        {tests.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            جاري تحميل الاختبارات...
          </div>
        )}
        
        {tests.map((test, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="mt-0.5">
              {test.status === 'loading' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
              {test.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {test.status === 'error' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{test.name}</p>
                <Badge 
                  variant={
                    test.status === 'success' ? 'default' : 
                    test.status === 'error' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {test.status === 'loading' && 'جاري...'}
                  {test.status === 'success' && 'نجح'}
                  {test.status === 'error' && 'فشل'}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {test.message}
              </p>
              
              {test.details && test.status === 'success' && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                    عرض التفاصيل / Show details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
              
              {test.details && test.status === 'error' && (
                <pre className="mt-2 text-xs bg-red-50 text-red-800 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        
        {allSuccess && tests.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium text-center">
              🎉 جميع الاختبارات نجحت! النظام متصل بقاعدة البيانات بنجاح!
              <br />
              All tests passed! System is successfully connected to database!
            </p>
          </div>
        )}
        
        {hasError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium text-center">
              ❌ بعض الاختبارات فشلت. يرجى التحقق من قاعدة البيانات.
              <br />
              Some tests failed. Please check database configuration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
