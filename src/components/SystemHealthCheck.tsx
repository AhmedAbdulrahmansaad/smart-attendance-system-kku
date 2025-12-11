import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Shield, 
  Wifi,
  Globe,
  Activity
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { publicAnonKey, projectId } from '../utils/supabase/info';
import { apiRequest } from '../utils/api';

interface HealthCheckResult {
  name: string;
  nameAr: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
  messageAr: string;
  icon: React.ReactNode;
  details?: string;
}

export function SystemHealthCheck() {
  const { language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    const checks: HealthCheckResult[] = [];

    // 1. Check Supabase Configuration
    try {
      const hasProjectId = !!projectId && projectId !== 'your-project-id';
      const hasAnonKey = !!publicAnonKey && publicAnonKey !== 'your-anon-key';
      
      checks.push({
        name: 'Supabase Configuration',
        nameAr: 'إعدادات Supabase',
        status: hasProjectId && hasAnonKey ? 'success' : 'error',
        message: hasProjectId && hasAnonKey 
          ? 'Supabase is configured correctly' 
          : 'Supabase configuration is missing',
        messageAr: hasProjectId && hasAnonKey 
          ? 'إعدادات Supabase صحيحة' 
          : 'إعدادات Supabase مفقودة',
        icon: <Shield className="w-5 h-5" />,
        details: `Project ID: ${hasProjectId ? '✓' : '✗'}, Anon Key: ${hasAnonKey ? '✓' : '✗'}`
      });
    } catch (error) {
      checks.push({
        name: 'Supabase Configuration',
        nameAr: 'إعدادات Supabase',
        status: 'error',
        message: 'Failed to check Supabase configuration',
        messageAr: 'فشل التحقق من إعدادات Supabase',
        icon: <Shield className="w-5 h-5" />
      });
    }

    // 2. Check Backend Health
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      checks.push({
        name: 'Backend Server',
        nameAr: 'خادم Backend',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? 'Backend server is running' 
          : 'Backend server is not responding',
        messageAr: response.ok 
          ? 'خادم Backend يعمل بشكل صحيح' 
          : 'خادم Backend لا يستجيب',
        icon: <Server className="w-5 h-5" />,
        details: `Status: ${response.status}`
      });
    } catch (error: any) {
      checks.push({
        name: 'Backend Server',
        nameAr: 'خادم Backend',
        status: 'error',
        message: 'Cannot connect to backend server',
        messageAr: 'لا يمكن الاتصال بخادم Backend',
        icon: <Server className="w-5 h-5" />,
        details: error.message
      });
    }

    // 3. Check API Endpoints
    try {
      const startTime = Date.now();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/server/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      checks.push({
        name: 'API Response Time',
        nameAr: 'وقت استجابة API',
        status: latency < 1000 ? 'success' : latency < 3000 ? 'warning' : 'error',
        message: `Response time: ${latency}ms`,
        messageAr: `وقت الاستجابة: ${latency} ميلي ثانية`,
        icon: <Activity className="w-5 h-5" />,
        details: latency < 1000 ? 'Excellent' : latency < 3000 ? 'Good' : 'Slow'
      });
    } catch (error) {
      checks.push({
        name: 'API Response Time',
        nameAr: 'وقت استجابة API',
        status: 'error',
        message: 'Failed to measure response time',
        messageAr: 'فشل قياس وقت الاستجابة',
        icon: <Activity className="w-5 h-5" />
      });
    }

    // 4. Check Database Connection
    try {
      // Try to make a simple API call that uses the database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const data = await response.json();
      
      checks.push({
        name: 'Database Connection',
        nameAr: 'اتصال قاعدة البيانات',
        status: data.database ? 'success' : 'warning',
        message: data.database 
          ? 'Database is accessible' 
          : 'Database status unknown',
        messageAr: data.database 
          ? 'قاعدة البيانات متاحة' 
          : 'حالة قاعدة البيانات غير معروفة',
        icon: <Database className="w-5 h-5" />
      });
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        nameAr: 'اتصال قاعدة البيانات',
        status: 'warning',
        message: 'Could not verify database connection',
        messageAr: 'لم يتم التحقق من اتصال قاعدة البيانات',
        icon: <Database className="w-5 h-5" />
      });
    }

    // 5. Check Internet Connection
    try {
      const online = navigator.onLine;
      checks.push({
        name: 'Internet Connection',
        nameAr: 'اتصال الإنترنت',
        status: online ? 'success' : 'error',
        message: online ? 'Connected to internet' : 'No internet connection',
        messageAr: online ? 'متصل بالإنترنت' : 'لا يوجد اتصال بالإنترنت',
        icon: <Wifi className="w-5 h-5" />
      });
    } catch (error) {
      checks.push({
        name: 'Internet Connection',
        nameAr: 'اتصال الإنترنت',
        status: 'warning',
        message: 'Could not check internet connection',
        messageAr: 'لم يتم التحقق من اتصال الإنترنت',
        icon: <Wifi className="w-5 h-5" />
      });
    }

    // 6. Check Browser Compatibility
    try {
      const hasLocalStorage = typeof localStorage !== 'undefined';
      const hasSessionStorage = typeof sessionStorage !== 'undefined';
      const hasFetch = typeof fetch !== 'undefined';
      const hasWebRTC = typeof RTCPeerConnection !== 'undefined';
      
      const allSupported = hasLocalStorage && hasSessionStorage && hasFetch && hasWebRTC;
      
      checks.push({
        name: 'Browser Compatibility',
        nameAr: 'توافق المتصفح',
        status: allSupported ? 'success' : 'warning',
        message: allSupported 
          ? 'All browser features are supported' 
          : 'Some browser features may not be available',
        messageAr: allSupported 
          ? 'جميع ميزات المتصفح مدعومة' 
          : 'بعض ميزات المتصفح قد لا تكون متاحة',
        icon: <Globe className="w-5 h-5" />,
        details: `LocalStorage: ${hasLocalStorage ? '✓' : '✗'}, Fetch: ${hasFetch ? '✓' : '✗'}, WebRTC: ${hasWebRTC ? '✓' : '✗'}`
      });
    } catch (error) {
      checks.push({
        name: 'Browser Compatibility',
        nameAr: 'توافق المتصفح',
        status: 'warning',
        message: 'Could not check browser compatibility',
        messageAr: 'لم يتم التحقق من توافق المتصفح',
        icon: <Globe className="w-5 h-5" />
      });
    }

    setResults(checks);
    setLastCheck(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">✗</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">!</Badge>;
      default:
        return <Badge>?</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const totalCount = results.length;

  const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success';

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="w-6 h-6" />
                {language === 'ar' ? 'فحص صحة النظام' : 'System Health Check'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'التحقق من حالة جميع مكونات النظام'
                  : 'Verify the status of all system components'}
              </CardDescription>
            </div>
            <Button 
              onClick={checkSystemHealth} 
              disabled={isChecking}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {language === 'ar' ? 'إعادة الفحص' : 'Recheck'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <Alert className={
            overallStatus === 'success' 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
              : overallStatus === 'error'
              ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
          }>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(overallStatus)}
                  <span className="font-semibold">
                    {language === 'ar' 
                      ? `الحالة العامة: ${successCount}/${totalCount} اختبار ناجح`
                      : `Overall Status: ${successCount}/${totalCount} checks passed`}
                  </span>
                </div>
                {lastCheck && (
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'آخر فحص:' : 'Last check:'}{' '}
                    {lastCheck.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-xs text-green-700 dark:text-green-300">
                {language === 'ar' ? 'ناجح' : 'Success'}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                {language === 'ar' ? 'تحذير' : 'Warning'}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-xs text-red-700 dark:text-red-300">
                {language === 'ar' ? 'خطأ' : 'Error'}
              </div>
            </div>
          </div>

          {/* Individual Check Results */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              {language === 'ar' ? 'نتائج الفحص التفصيلية' : 'Detailed Check Results'}
            </h3>
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {language === 'ar' ? result.nameAr : result.name}
                    </h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? result.messageAr : result.message}
                  </p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* System Information */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              {language === 'ar' ? 'معلومات النظام' : 'System Information'}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'المتصفح:' : 'Browser:'}
                </span>
                <span className="font-mono">{navigator.userAgent.split(' ').pop()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'المنصة:' : 'Platform:'}
                </span>
                <span className="font-mono">{navigator.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'اللغة:' : 'Language:'}
                </span>
                <span className="font-mono">{navigator.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'متصل:' : 'Online:'}
                </span>
                <span className="font-mono">{navigator.onLine ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}