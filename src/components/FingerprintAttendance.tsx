import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Fingerprint, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../utils/i18n';

interface FingerprintAttendanceProps {
  onScanComplete?: (success: boolean) => void;
}

export function FingerprintAttendance({ onScanComplete }: FingerprintAttendanceProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);

    // Simulate fingerprint scan
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;
    setScanResult(success ? 'success' : 'error');
    setScanning(false);

    if (onScanComplete) {
      onScanComplete(success);
    }

    // Reset after 3 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 3000);
  };

  return (
    <Card className="border-2 border-primary/20 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary animate-pulse"></div>
      </div>

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-6 h-6 text-primary" />
          {language === 'ar' ? 'تسجيل الحضور ببصمة الإصبع' : 'Fingerprint Attendance'}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'ضع إصبعك على المستشعر لتسجيل حضورك'
            : 'Place your finger on the sensor to mark your attendance'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Fingerprint Scanner Visual */}
          <div className="relative">
            {/* Outer ring - animated pulse */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/30"
              animate={scanning ? {
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3],
              } : {}}
              transition={{
                duration: 2,
                repeat: scanning ? Infinity : 0,
                ease: 'easeInOut',
              }}
              style={{ width: '220px', height: '220px', left: '-35px', top: '-35px' }}
            />

            {/* Middle ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/50"
              animate={scanning ? {
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              } : {}}
              transition={{
                duration: 2,
                repeat: scanning ? Infinity : 0,
                ease: 'easeInOut',
                delay: 0.3,
              }}
              style={{ width: '180px', height: '180px', left: '-15px', top: '-15px' }}
            />

            {/* Scanner circle */}
            <motion.div
              className={`w-[150px] h-[150px] rounded-full flex items-center justify-center border-4 ${
                scanResult === 'success'
                  ? 'bg-green-500/20 border-green-500'
                  : scanResult === 'error'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-primary/10 border-primary'
              }`}
              animate={scanning ? { scale: [1, 1.05, 1] } : {}}
              transition={{
                duration: 1.5,
                repeat: scanning ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <AnimatePresence mode="wait">
                {scanning && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="text-center"
                  >
                    <Fingerprint className="w-20 h-20 text-primary fingerprint-pulse" />
                  </motion.div>
                )}

                {!scanning && !scanResult && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Fingerprint className="w-20 h-20 text-primary" />
                  </motion.div>
                )}

                {scanResult === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-500" />
                  </motion.div>
                )}

                {scanResult === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, rotate: [0, -10, 10, -10, 0] }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <XCircle className="w-20 h-20 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Status text */}
          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div
                key="scanning-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-lg font-semibold text-primary">
                  {language === 'ar' ? 'جارٍ المسح...' : 'Scanning...'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? 'الرجاء الانتظار' : 'Please wait'}
                </p>
              </motion.div>
            )}

            {scanResult === 'success' && (
              <motion.div
                key="success-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-lg font-semibold text-green-600">
                  {language === 'ar' ? 'تم تسجيل الحضور بنجاح!' : 'Attendance Marked Successfully!'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? 'شكراً لك' : 'Thank you'}
                </p>
              </motion.div>
            )}

            {scanResult === 'error' && (
              <motion.div
                key="error-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-lg font-semibold text-red-600">
                  {language === 'ar' ? 'فشل التعرف على البصمة' : 'Fingerprint Not Recognized'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? 'الرجاء المحاولة مرة أخرى' : 'Please try again'}
                </p>
              </motion.div>
            )}

            {!scanning && !scanResult && (
              <motion.div
                key="idle-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <p className="text-lg font-semibold">
                  {language === 'ar' ? 'جاهز للمسح' : 'Ready to Scan'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? 'اضغط على الزر للبدء' : 'Press button to start'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan button */}
          <Button
            onClick={handleScan}
            disabled={scanning}
            size="lg"
            className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2 h-14"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'ar' ? 'جارٍ المسح...' : 'Scanning...'}
              </>
            ) : (
              <>
                <Fingerprint className="w-5 h-5" />
                {language === 'ar' ? 'ابدأ المسح' : 'Start Scan'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
