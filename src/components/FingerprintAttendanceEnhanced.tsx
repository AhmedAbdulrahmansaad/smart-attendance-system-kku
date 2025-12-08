import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Fingerprint, CheckCircle, XCircle, Loader2, Shield, User } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../utils/i18n';
import { useAuth } from './AuthContext';
import { Alert, AlertDescription } from './ui/alert';

interface FingerprintAttendanceProps {
  onScanComplete?: (success: boolean, data?: any) => void;
  sessionId?: string;
  courseId?: string;
}

export function FingerprintAttendance({ onScanComplete, sessionId, courseId }: FingerprintAttendanceProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);

  const handleScan = async () => {
    if (!user) {
      setScanResult('error');
      return;
    }

    setScanning(true);
    setScanResult(null);
    setVerificationDetails(null);

    try {
      // Step 1: Simulate biometric sensor reading (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Simulate pattern matching and identity verification (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate real biometric verification with multiple checks
      const biometricChecks = {
        // Pattern match (fingerprint ridges and minutiae points)
        patternMatch: Math.random() > 0.05, // 95% success rate
        // Liveness detection (anti-spoofing - detects real finger vs fake)
        livenessDetection: Math.random() > 0.02, // 98% success rate
        // Temperature check (real finger warmth)
        temperatureCheck: Math.random() > 0.01, // 99% success rate
        // User identity verification against stored data
        identityVerification: true,
      };

      const allChecksPassed = Object.values(biometricChecks).every(check => check === true);

      if (allChecksPassed) {
        // Generate verification data
        const verificationData = {
          userId: user.id,
          userName: user.full_name,
          universityId: user.university_id,
          timestamp: new Date().toISOString(),
          sessionId,
          courseId,
          biometricScore: 0.92 + Math.random() * 0.07, // 92-99% match score
          verificationMethod: 'fingerprint',
          deviceId: navigator.userAgent,
          checks: {
            patternMatch: '✓ Pattern Verified',
            livenessDetection: '✓ Live Finger Detected',
            temperatureCheck: '✓ Temperature Normal',
            identityVerification: '✓ Identity Confirmed'
          }
        };

        setVerificationDetails(verificationData);
        setScanResult('success');

        if (onScanComplete) {
          onScanComplete(true, verificationData);
        }
      } else {
        // Failed verification - determine which check failed
        const failedCheck = Object.entries(biometricChecks).find(([_, passed]) => !passed)?.[0];
        
        setVerificationDetails({
          error: failedCheck,
          message: 
            failedCheck === 'patternMatch' ? (language === 'ar' ? 'نمط البصمة غير متطابق' : 'Fingerprint pattern does not match') :
            failedCheck === 'livenessDetection' ? (language === 'ar' ? 'فشل اكتشاف الإصبع الحي - الرجاء استخدام إصبع حقيقي' : 'Liveness detection failed - please use real finger') :
            failedCheck === 'temperatureCheck' ? (language === 'ar' ? 'فشل فحص درجة الحرارة' : 'Temperature check failed') :
            (language === 'ar' ? 'فشل التحقق من الهوية' : 'Identity verification failed')
        });
        
        setScanResult('error');

        if (onScanComplete) {
          onScanComplete(false);
        }
      }
    } catch (error) {
      console.error('Fingerprint scan error:', error);
      setScanResult('error');
      
      if (onScanComplete) {
        onScanComplete(false);
      }
    } finally {
      setScanning(false);
    }

    // Reset after 5 seconds
    setTimeout(() => {
      setScanResult(null);
      setVerificationDetails(null);
    }, 5000);
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
          {language === 'ar' ? 'التحقق من الهوية ببصمة الإصبع' : 'Fingerprint Identity Verification'}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'ضع إصبعك على المستشعر للتحقق من هويتك وتسجيل حضورك'
            : 'Place your finger on the sensor to verify your identity and mark attendance'}
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
                  {language === 'ar' ? 'جارٍ التحقق من الهوية...' : 'Verifying Identity...'}
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
                  {language === 'ar' ? 'تم التحقق من الهوية بنجاح!' : 'Identity Verified Successfully!'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' ? 'تم تسجيل حضورك' : 'Attendance marked'}
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
                  {language === 'ar' ? 'فشل التحقق من الهوية' : 'Verification Failed'}
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
                  {language === 'ar' ? 'جاهز للتحقق' : 'Ready to Verify'}
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
            disabled={scanning || !user}
            size="lg"
            className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2 h-14"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                {language === 'ar' ? 'ابدأ التحقق من الهوية' : 'Start Verification'}
              </>
            )}
          </Button>

          {/* Verification Details */}
          {verificationDetails && scanResult === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <Shield className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {language === 'ar' ? 'الطالب:' : 'Student:'}
                      </span>
                      <span>{verificationDetails.userName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {language === 'ar' ? 'الرقم الجامعي:' : 'University ID:'}
                      </span>
                      <span className="font-mono">{verificationDetails.universityId}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {language === 'ar' ? 'دقة التطابق:' : 'Match Score:'}
                      </span>
                      <span className="text-green-600 font-bold">
                        {(verificationDetails.biometricScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold mb-2">
                        {language === 'ar' ? 'فحوصات الأمان:' : 'Security Checks:'}
                      </p>
                      <div className="space-y-1 text-xs">
                        {Object.entries(verificationDetails.checks).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Error Details */}
          {verificationDetails && scanResult === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription>
                  <p className="font-semibold mt-1">
                    {language === 'ar' ? 'فشل التحقق من الهوية' : 'Identity Verification Failed'}
                  </p>
                  <p className="text-sm mt-2">{verificationDetails.message}</p>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* User Info Display */}
          {user && !scanning && !scanResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md p-4 rounded-lg border border-border bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'student' && user.university_id 
                      ? `${language === 'ar' ? 'رقم جامعي:' : 'ID:'} ${user.university_id}`
                      : user.email
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!user && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in first'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
