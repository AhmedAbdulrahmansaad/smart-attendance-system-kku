import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Smartphone, AlertCircle, CheckCircle, Radio } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NFCAttendanceProps {
  onSuccess?: () => void;
}

export function NFCAttendance({ onSuccess }: NFCAttendanceProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isNFCSupported, setIsNFCSupported] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      title: { ar: 'حضور NFC', en: 'NFC Attendance' },
      description: { ar: 'سجل حضورك باستخدام تقنية NFC', en: 'Mark your attendance using NFC technology' },
      supported: { ar: 'NFC مدعوم على جهازك', en: 'NFC is supported on your device' },
      notSupported: { ar: 'NFC غير مدعوم على هذا الجهاز', en: 'NFC is not supported on this device' },
      startScanning: { ar: 'بدء المسح', en: 'Start Scanning' },
      stopScanning: { ar: 'إيقاف المسح', en: 'Stop Scanning' },
      scanning: { ar: 'جارٍ المسح... قرّب هاتفك من بطاقة NFC', en: 'Scanning... Bring your phone close to NFC tag' },
      success: { ar: 'تم تسجيل الحضور بنجاح!', en: 'Attendance marked successfully!' },
      error: { ar: 'حدث خطأ أثناء تسجيل الحضور', en: 'Error marking attendance' },
      sessionNotFound: { ar: 'الجلسة غير موجودة أو منتهية', en: 'Session not found or expired' },
      alreadyMarked: { ar: 'تم تسجيل حضورك مسبقاً', en: 'Attendance already marked' },
      notEnrolled: { ar: 'غير مسجل في هذا المقرر', en: 'Not enrolled in this course' },
      lastScanned: { ar: 'آخر كود ممسوح', en: 'Last scanned code' },
      requirements: { ar: 'المتطلبات', en: 'Requirements' },
      req1: { ar: '✓ متصفح Chrome على Android', en: '✓ Chrome browser on Android' },
      req2: { ar: '✓ NFC مُفعّل في إعدادات الجهاز', en: '✓ NFC enabled in device settings' },
      req3: { ar: '✓ بطاقة NFC من المدرس', en: '✓ NFC tag from instructor' },
      howItWorks: { ar: 'كيف يعمل؟', en: 'How it works?' },
      step1: { ar: '1. اضغط على "بدء المسح"', en: '1. Tap "Start Scanning"' },
      step2: { ar: '2. قرّب هاتفك من بطاقة NFC', en: '2. Bring phone close to NFC tag' },
      step3: { ar: '3. انتظر حتى يُسجّل حضورك', en: '3. Wait for attendance confirmation' },
      limitationTitle: { ar: '⚠️ قيود مهمة', en: '⚠️ Important Limitations' },
      limitation1: { ar: '• يعمل فقط على Chrome (Android)', en: '• Works only on Chrome (Android)' },
      limitation2: { ar: '• لا يعمل على iOS أو Safari', en: '• Does not work on iOS or Safari' },
      limitation3: { ar: '• لا يعمل على معظم أجهزة الكمبيوتر', en: '• Does not work on most computers' },
      alternative: { ar: 'استخدم "الكود" أو "البصمة" كبديل', en: 'Use "Code" or "Fingerprint" as alternative' },
    };
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    // Check if NFC is supported
    if ('NDEFReader' in window) {
      setIsNFCSupported(true);
      setMessage(t('supported'));
      setMessageType('success');
    } else {
      setIsNFCSupported(false);
      setMessage(t('notSupported'));
      setMessageType('error');
    }
  }, [language]);

  const startNFCScanning = async () => {
    if (!isNFCSupported) {
      setMessage(t('notSupported'));
      setMessageType('error');
      return;
    }

    try {
      setIsScanning(true);
      setMessage(t('scanning'));
      setMessageType('info');

      // @ts-ignore - Web NFC API
      const ndef = new NDEFReader();
      
      // Request permission and start scanning
      await ndef.scan();

      console.log('🔵 [NFC] Scanning started...');

      // Listen for NFC tags
      ndef.addEventListener('reading', async ({ message, serialNumber }: any) => {
        console.log('🔵 [NFC] Tag detected:', serialNumber);
        
        try {
          // Read the first record from NFC tag
          const record = message.records[0];
          const textDecoder = new TextDecoder(record.encoding || 'utf-8');
          const sessionCode = textDecoder.decode(record.data);

          console.log('🔵 [NFC] Session code read:', sessionCode);
          setLastScannedCode(sessionCode);

          // Submit attendance
          await submitAttendance(sessionCode);
        } catch (error) {
          console.error('❌ [NFC] Error reading tag:', error);
          setMessage(t('error'));
          setMessageType('error');
        }
      });

      ndef.addEventListener('readingerror', () => {
        console.error('❌ [NFC] Error reading NFC tag');
        setMessage(language === 'ar' 
          ? 'خطأ في قراءة بطاقة NFC. حاول مرة أخرى.' 
          : 'Error reading NFC tag. Try again.');
        setMessageType('error');
      });

    } catch (error: any) {
      console.error('❌ [NFC] Error starting scan:', error);
      
      if (error.name === 'NotAllowedError') {
        setMessage(language === 'ar' 
          ? 'يجب السماح بالوصول إلى NFC في إعدادات المتصفح' 
          : 'NFC access permission denied in browser settings');
      } else if (error.name === 'NotSupportedError') {
        setMessage(t('notSupported'));
      } else {
        setMessage(error.message || t('error'));
      }
      
      setMessageType('error');
      setIsScanning(false);
    }
  };

  const stopNFCScanning = () => {
    setIsScanning(false);
    setMessage(language === 'ar' ? 'تم إيقاف المسح' : 'Scanning stopped');
    setMessageType('info');
    console.log('🔵 [NFC] Scanning stopped');
  };

  const submitAttendance = async (code: string) => {
    try {
      console.log('🔵 [NFC] Submitting attendance with code:', code);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/make-server-90ad488b/attend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            code: code.trim(),
            student_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('✅ [NFC] Attendance marked successfully');
        setMessage(t('success'));
        setMessageType('success');
        stopNFCScanning();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error('❌ [NFC] Error response:', data);
        
        // Handle specific error messages
        if (data.error?.includes('not found') || data.error?.includes('expired')) {
          setMessage(t('sessionNotFound'));
        } else if (data.error?.includes('already marked')) {
          setMessage(t('alreadyMarked'));
        } else if (data.error?.includes('not enrolled')) {
          setMessage(t('notEnrolled'));
        } else {
          setMessage(data.error || t('error'));
        }
        
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('❌ [NFC] Network error:', error);
      setMessage(language === 'ar' 
        ? 'خطأ في الاتصال بالخادم' 
        : 'Network error');
      setMessageType('error');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
              <CardDescription className="text-base mt-1">
                {t('description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* NFC Support Status */}
          <Alert className={isNFCSupported ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
            <div className="flex items-start gap-3">
              {isNFCSupported ? (
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${isNFCSupported ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {isNFCSupported ? t('supported') : t('notSupported')}
                </p>
                {!isNFCSupported && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {t('alternative')}
                  </p>
                )}
              </div>
            </div>
          </Alert>

          {/* Scanning Area */}
          <div className={`p-8 rounded-lg border-2 border-dashed transition-all ${
            isScanning 
              ? 'border-primary bg-primary/5 animate-pulse' 
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          }`}>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`relative ${isScanning ? 'animate-bounce' : ''}`}>
                <Smartphone className={`w-16 h-16 ${
                  isScanning ? 'text-primary' : 'text-gray-400'
                }`} />
                {isScanning && (
                  <div className="absolute -inset-2 border-4 border-primary rounded-full animate-ping opacity-75"></div>
                )}
              </div>
              
              <div className="text-center">
                <p className={`font-semibold text-lg ${isScanning ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                  {isScanning 
                    ? t('scanning')
                    : (language === 'ar' ? 'اضغط لبدء المسح' : 'Tap to start scanning')
                  }
                </p>
                {lastScannedCode && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-sm">
                      {t('lastScanned')}: {lastScannedCode}
                    </Badge>
                  </div>
                )}
              </div>

              <Button
                onClick={isScanning ? stopNFCScanning : startNFCScanning}
                disabled={!isNFCSupported}
                variant={isScanning ? 'destructive' : 'default'}
                size="lg"
                className="min-w-[200px]"
              >
                {isScanning ? (
                  <>
                    <WifiOff className="w-5 h-5 mr-2" />
                    {t('stopScanning')}
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5 mr-2" />
                    {t('startScanning')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <Alert className={
              messageType === 'success' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                : messageType === 'error'
                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            }>
              <div className="flex items-start gap-3">
                {messageType === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : messageType === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                )}
                <AlertDescription className={
                  messageType === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : messageType === 'error'
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-blue-800 dark:text-blue-200'
                }>
                  {message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>{t('howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-bold">1</span>
            </div>
            <p className="text-muted-foreground flex-1 pt-1">{t('step1')}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-bold">2</span>
            </div>
            <p className="text-muted-foreground flex-1 pt-1">{t('step2')}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-bold">3</span>
            </div>
            <p className="text-muted-foreground flex-1 pt-1">{t('step3')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {t('requirements')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('req1')}</p>
          <p className="text-sm text-muted-foreground">{t('req2')}</p>
          <p className="text-sm text-muted-foreground">{t('req3')}</p>
        </CardContent>
      </Card>

      {/* Limitations Warning */}
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <div className="ml-2">
          <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
            {t('limitationTitle')}
          </h4>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>{t('limitation1')}</li>
            <li>{t('limitation2')}</li>
            <li>{t('limitation3')}</li>
          </ul>
        </div>
      </Alert>
    </div>
  );
}