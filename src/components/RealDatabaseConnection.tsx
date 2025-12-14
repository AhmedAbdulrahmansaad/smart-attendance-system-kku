import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, XCircle, Loader2, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'sonner';

interface TableInfo {
  name: string;
  count: number;
  columns: string[];
  sample?: any[];
  error?: string;
}

interface DiagnosticResult {
  connected: boolean;
  tables: TableInfo[];
  missingTables: string[];
  totalRecords: number;
}

export function RealDatabaseConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    setCurrentStep('جارٍ الاتصال بقاعدة البيانات...');

    const expectedTables = [
      'profiles',
      'courses',
      'sessions',
      'enrollments',
      'attendance',
      'live_sessions',
      'notifications',
      'kv_store_90ad488b'
    ];

    const tables: TableInfo[] = [];
    const missingTables: string[] = [];
    let connected = false;
    let totalRecords = 0;

    try {
      // Test connection
      setCurrentStep('اختبار الاتصال...');
      const { error: connError } = await supabase
        .from('kv_store_90ad488b')
        .select('key', { count: 'exact', head: true })
        .limit(1);

      if (!connError) {
        connected = true;
        console.log('✅ Connected to Supabase successfully');
      }

      // Test each table
      for (const tableName of expectedTables) {
        setCurrentStep(`فحص جدول ${tableName}...`);

        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(3);

          if (error) {
            if (error.message.includes('does not exist') || error.code === '42P01') {
              missingTables.push(tableName);
              console.log(`❌ Table ${tableName} does not exist`);
            } else {
              // Table exists but has RLS or other error
              tables.push({
                name: tableName,
                count: 0,
                columns: [],
                error: error.message
              });
              console.log(`⚠️ Table ${tableName} exists but has error:`, error.message);
            }
          } else {
            const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
            tables.push({
              name: tableName,
              count: count || 0,
              columns: columns,
              sample: data || []
            });
            totalRecords += count || 0;
            console.log(`✅ Table ${tableName}: ${count} records`);
          }
        } catch (err: any) {
          missingTables.push(tableName);
          console.log(`❌ Error testing table ${tableName}:`, err.message);
        }
      }

      setResult({
        connected,
        tables,
        missingTables,
        totalRecords
      });

      if (connected) {
        toast.success('تم الاتصال بقاعدة البيانات بنجاح!');
      } else {
        toast.error('فشل الاتصال بقاعدة البيانات');
      }
    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast.error('حدث خطأ أثناء التشخيص');
      setResult({
        connected: false,
        tables: [],
        missingTables: expectedTables,
        totalRecords: 0
      });
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              فحص قاعدة البيانات الحقيقية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-lg">{currentStep}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const populatedTables = result.tables.filter(t => t.count > 0);
  const emptyTables = result.tables.filter(t => t.count === 0 && !t.error);
  const errorTables = result.tables.filter(t => t.error);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#006747]">
            🔍 فحص قاعدة البيانات الحقيقية
          </h1>
          <p className="text-muted-foreground">
            تشخيص كامل لجميع الجداول والبيانات في Supabase
          </p>
        </div>
        <Button onClick={runDiagnostic} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          إعادة الفحص
        </Button>
      </div>

      {/* Connection Status */}
      <Alert variant={result.connected ? 'default' : 'destructive'}>
        <div className="flex items-center gap-2">
          {result.connected ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <AlertTitle>
            {result.connected ? 'متصل بـSupabase ✅' : 'غير متصل بـSupabase ❌'}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {result.connected ? (
            <span>الاتصال بقاعدة البيانات يعمل بشكل صحيح</span>
          ) : (
            <span>فشل الاتصال - تحقق من إعدادات Supabase في /config/supabase.config.ts</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>جداول موجودة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#006747]">
              {result.tables.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>جداول مفقودة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {result.missingTables.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>إجمالي السجلات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {result.totalRecords}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>جداول تحتوي بيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {populatedTables.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Populated Tables */}
      {populatedTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              جداول تحتوي على بيانات ({populatedTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {populatedTables.map((table) => (
                <div key={table.name} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">📊 {table.name}</h3>
                    <span className="text-sm font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      {table.count} سجل
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <strong>الأعمدة ({table.columns.length}):</strong> {table.columns.join(', ')}
                  </div>

                  {table.sample && table.sample.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium hover:underline">
                        عرض عينة من البيانات ({table.sample.length} سجل)
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded border overflow-x-auto text-xs">
                        {JSON.stringify(table.sample, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty Tables */}
      {emptyTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              جداول فارغة ({emptyTables.length})
            </CardTitle>
            <CardDescription>
              هذه الجداول موجودة لكن لا تحتوي على بيانات بعد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emptyTables.map((table) => (
                <div key={table.name} className="border rounded-lg p-3 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">📭 {table.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {table.columns.length} أعمدة
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {table.columns.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables with Errors */}
      {errorTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              جداول بها مشاكل ({errorTables.length})
            </CardTitle>
            <CardDescription>
              هذه الجداول موجودة لكن هناك مشكلة في الوصول إليها (غالباً RLS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorTables.map((table) => (
                <div key={table.name} className="border rounded-lg p-3 bg-orange-50">
                  <div className="font-medium">⚠️ {table.name}</div>
                  <div className="text-sm text-red-600 mt-1">
                    خطأ: {table.error}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Tables */}
      {result.missingTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              جداول مفقودة ({result.missingTables.length})
            </CardTitle>
            <CardDescription className="text-red-600">
              يجب إنشاء هذه الجداول!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>تحذير: جداول مفقودة!</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div>الجداول التالية غير موجودة في قاعدة البيانات:</div>
                <ul className="list-disc list-inside">
                  {result.missingTables.map((table) => (
                    <li key={table}>{table}</li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-black/10 rounded">
                  <strong>الحل:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>افتح Supabase Dashboard</li>
                    <li>اذهب إلى SQL Editor</li>
                    <li>نفذ الملف: <code className="bg-black/20 px-2 py-1 rounded">/DATABASE_SETUP.sql</code></li>
                    <li>أعد تحميل هذه الصفحة</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 الخطوات التالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.missingTables.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>1️⃣ أنشئ الجداول المفقودة (ضروري!)</AlertTitle>
                <AlertDescription>
                  نفذ <code>/DATABASE_SETUP.sql</code> في Supabase SQL Editor
                </AlertDescription>
              </Alert>
            )}

            {emptyTables.length > 0 && (
              <Alert>
                <AlertTitle>2️⃣ أضف بيانات للجداول الفارغة</AlertTitle>
                <AlertDescription>
                  ابدأ باستخدام النظام لإضافة مستخدمين، مواد، وجلسات
                </AlertDescription>
              </Alert>
            )}

            {errorTables.length > 0 && (
              <Alert>
                <AlertTitle>3️⃣ أصلح RLS Policies</AlertTitle>
                <AlertDescription>
                  بعض الجداول لديها مشاكل في الوصول - راجع Row Level Security
                </AlertDescription>
              </Alert>
            )}

            {result.connected && result.missingTables.length === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertTitle className="text-green-700">✅ النظام جاهز!</AlertTitle>
                <AlertDescription className="text-green-600">
                  قاعدة البيانات متصلة وجميع الجداول موجودة. يمكنك البدء باستخدام النظام!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
