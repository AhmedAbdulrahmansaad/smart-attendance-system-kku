import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, Mail, Key } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AlreadyRegisteredHelperProps {
  email: string;
  language: 'ar' | 'en';
  onSwitchToSignIn: () => void;
}

export function AlreadyRegisteredHelper({ 
  email, 
  language,
  onSwitchToSignIn 
}: AlreadyRegisteredHelperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Alert className="border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        <AlertTitle className="text-amber-900 dark:text-amber-100 font-bold">
          {language === 'ar' ? 'الحساب موجود مسبقاً!' : 'Account Already Exists!'}
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200 space-y-3">
          <p>
            {language === 'ar' 
              ? `البريد الإلكتروني "${email}" مسجل مسبقاً في النظام.`
              : `The email "${email}" is already registered in the system.`
            }
          </p>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">
                {language === 'ar' ? 'لتسجيل الدخول:' : 'To sign in:'}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-300">
                <li>{language === 'ar' ? 'انقر على زر "تسجيل الدخول" أدناه' : 'Click the "Sign In" button below'}</li>
                <li>{language === 'ar' ? 'أدخل بريدك الإلكتروني وكلمة المرور' : 'Enter your email and password'}</li>
                <li>{language === 'ar' ? 'اضغط على "دخول"' : 'Click "Sign In"'}</li>
              </ol>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <Key className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">
                {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                {language === 'ar' 
                  ? 'تواصل مع مدير النظام لإعادة تعيين كلمة المرور.'
                  : 'Contact the system administrator to reset your password.'
                }
              </p>
            </div>
          </div>

          <Button
            onClick={onSwitchToSignIn}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 text-base"
          >
            {language === 'ar' ? 'الانتقال إلى تسجيل الدخول' : 'Go to Sign In'}
            <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
