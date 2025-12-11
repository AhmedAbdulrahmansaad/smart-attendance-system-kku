import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DemoDataInitializerProps {
  onSuccess?: () => void;
}

export function DemoDataInitializer({ onSuccess }: DemoDataInitializerProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);

  const initializeDemoData = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setAlreadyExists(false);

    try {
      console.log('🎬 [Demo] Requesting demo data initialization...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/init-demo-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('✅ [Demo] Demo data initialized:', data);
        
        if (data.already_exists) {
          setAlreadyExists(true);
        } else {
          setSuccess(true);
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to initialize demo data');
      }
    } catch (err: any) {
      console.error('❌ [Demo] Error:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="font-semibold mb-2">
            {language === 'ar' ? '✅ تم تحميل البيانات التجريبية بنجاح!' : '✅ Demo Data Loaded Successfully!'}
          </p>
          <p className="text-sm">
            {language === 'ar' 
              ? 'سيتم تحديث الصفحة تلقائياً...' 
              : 'Page will refresh automatically...'}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (alreadyExists) {
    return (
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <p className="font-semibold">
            {language === 'ar' ? 'ℹ️ البيانات موجودة بالفعل' : 'ℹ️ Data Already Exists'}
          </p>
          <p className="text-sm mt-1">
            {language === 'ar' 
              ? 'لديك بيانات مسجلة بالفعل. قم بتحديث الصفحة لرؤيتها.' 
              : 'You already have data. Refresh the page to see it.'}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {language === 'ar' ? 'تفعيل البيانات التجريبية' : 'Activate Demo Data'}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'لتجربة النظام بشكل كامل، قم بتحميل البيانات التجريبية'
            : 'To experience the full system, load demo data'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 text-sm">
          <p className="font-semibold">
            {language === 'ar' ? '📊 ما الذي سيتم تحميله؟' : '📊 What will be loaded?'}
          </p>
          
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'مقررات دراسية (3 مقررات من جامعة الملك خالد)' 
                  : '3 real courses from King Khalid University'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'طلاب (5 طلاب مع بيانات حقيقية)' 
                  : '5 students with realistic data'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'تسجيلات الطلاب في المقررات' 
                  : 'Student enrollments in courses'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'جلسات تعليمية (3 جلسات لكل مقرر)' 
                  : '3 sessions per course'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'سجلات حضور للجلسات السابقة' 
                  : 'Attendance records for past sessions'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>
                {language === 'ar' 
                  ? 'جلسة نشطة جاهزة للاختبار' 
                  : 'Active session ready for testing'}
              </span>
            </li>
          </ul>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {language === 'ar' ? (
              <>
                <strong>ملاحظة:</strong> البيانات التجريبية هي بيانات وهمية لاختبار النظام فقط. 
                يمكنك حذفها لاحقاً والبدء ببيانات حقيقية.
              </>
            ) : (
              <>
                <strong>Note:</strong> Demo data is for testing purposes only. 
                You can delete it later and start with real data.
              </>
            )}
          </AlertDescription>
        </Alert>

        <Button
          onClick={initializeDemoData}
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </>
          ) : (
            <>
              <Database className="w-5 h-5 ml-2" />
              {language === 'ar' ? 'تحميل البيانات التجريبية' : 'Load Demo Data'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {language === 'ar' 
            ? '⚡ سيستغرق التحميل 5-10 ثواني' 
            : '⚡ Loading will take 5-10 seconds'}
        </p>
      </CardContent>
    </Card>
  );
}