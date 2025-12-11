import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth, UserRole } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useTranslation } from '../utils/i18n';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { GraduationCap, AlertCircle, Globe, Moon, Sun, ArrowLeft, Sparkles, Shield, Users } from 'lucide-react';
import { AlreadyRegisteredHelper } from './AlreadyRegisteredHelper';

interface LoginPageProps {
  onBack: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation(language);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [currentTab, setCurrentTab] = useState<'signin' | 'signup'>('signin');

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpUniversityId, setSignUpUniversityId] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('student');

  // Handle email input with auto-append @kku.edu.sa
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Remove any existing @kku.edu.sa
    let cleanValue = value.replace('@kku.edu.sa', '');
    
    // If user types @ symbol, auto-complete
    if (cleanValue.includes('@')) {
      cleanValue = cleanValue.split('@')[0] + '@kku.edu.sa';
    }
    
    setSignUpEmail(cleanValue);
  };

  // On blur, ensure @kku.edu.sa is appended
  const handleEmailBlur = () => {
    if (signUpEmail && !signUpEmail.includes('@')) {
      setSignUpEmail(signUpEmail + '@kku.edu.sa');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(signInEmail, signInPassword);
    } catch (err: any) {
      setError(err.message || t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate email domain
      if (!signUpEmail.endsWith('@kku.edu.sa')) {
        setError(language === 'ar' 
          ? 'يجب استخدام البريد الجامعي @kku.edu.sa' 
          : 'Must use university email @kku.edu.sa');
        setIsLoading(false);
        return;
      }

      // Validate university ID for students only
      if (signUpRole === 'student') {
        if (!signUpUniversityId.trim()) {
          setError(language === 'ar' 
            ? 'الرقم الجامعي مطلوب للطلاب' 
            : 'University ID is required for students');
          setIsLoading(false);
          return;
        }

        // Validate university ID format: 9 digits starting with 44
        const universityIdRegex = /^44\d{7}$/;
        if (!universityIdRegex.test(signUpUniversityId)) {
          setError(language === 'ar' 
            ? 'الرقم الجامعي يجب أن يكون 9 أرقام ويبدأ بـ 44 (مثال: 441234567)' 
            : 'University ID must be 9 digits starting with 44 (e.g., 441234567)');
          setIsLoading(false);
          return;
        }
      }

      // Validate password strength
      if (signUpPassword.length < 6) {
        setError(language === 'ar' 
          ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
          : 'Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      // Validate password strength - must contain uppercase, lowercase, number, and special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(signUpPassword)) {
        setError(language === 'ar' 
          ? 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص (@$!%*?&)' 
          : 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)');
        setIsLoading(false);
        return;
      }

      await signUp(signUpEmail, signUpPassword, signUpFullName, signUpRole, signUpUniversityId);
    } catch (err: any) {
      // Handle specific error messages
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('Email already registered')) {
        setError(language === 'ar' 
          ? 'البريد الإلكتروني مسجل مسبقاً. هل لديك حساب؟ انتقل إلى تسجيل الدخول.' 
          : 'Email already registered. Already have an account? Go to Sign In.');
      } else if (errorMessage.includes('University ID already registered')) {
        setError(language === 'ar' 
          ? 'الرقم الجامعي مسجل مسبقاً. هل لديك حساب؟ انتقل إلى تسجيل الدخول.' 
          : 'University ID already registered. Already have an account? Go to Sign In.');
      } else {
        setError(errorMessage || t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const roleOptions = [
    { value: 'student', labelAr: 'طالب', labelEn: 'Student', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { value: 'instructor', labelAr: 'مدرس', labelEn: 'Instructor', icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
    { value: 'supervisor', labelAr: 'مشرف', labelEn: 'Supervisor', icon: Shield, color: 'from-purple-500 to-pink-500' },
    { value: 'admin', labelAr: 'مدير', labelEn: 'Admin', icon: Sparkles, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background with University Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjbGFzc3Jvb218ZW58MXx8fHwxNzYyODI4MDczfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Classroom"
          className="w-full h-full object-cover opacity-5 dark:opacity-[0.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>
        <div className="absolute inset-0 hero-pattern opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="glass border-b border-border/50">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-primary/10"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-primary" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="rounded-full hover:bg-primary/10"
              >
                <Globe className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden md:block"
            >
              <div className="glass rounded-3xl p-12 border-2 border-primary/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-accent to-gold shadow-2xl mx-auto mb-8 flex items-center justify-center shine"
                >
                  <GraduationCap className="w-14 h-14 text-white" />
                </motion.div>

                <h2 className="text-4xl font-black mb-4 text-center bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
                  {language === 'ar' ? 'نظام الحضور الذكي' : 'Smart Attendance System'}
                </h2>

                <p className="text-center text-xl text-muted-foreground mb-8">
                  {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
                </p>

                <div className="space-y-6">
                  {[
                    { icon: Shield, textAr: 'أمان متقدم', textEn: 'Advanced Security' },
                    { icon: Sparkles, textAr: 'تقنية حديثة', textEn: 'Modern Technology' },
                    { icon: Users, textAr: 'سهل الاستخدام', textEn: 'Easy to Use' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-4 glass rounded-2xl p-4 border border-primary/20"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-semibold text-lg">
                        {language === 'ar' ? item.textAr : item.textEn}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              {/* Mobile Logo */}
              <div className="md:hidden text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl mb-4"
                >
                  <GraduationCap className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">
                  {language === 'ar' ? 'نظام الحضور الذكي' : 'Smart Attendance System'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
                </p>
              </div>

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-14 glass border border-border">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white h-12 font-bold text-base"
                  >
                    {t('login')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white h-12 font-bold text-base"
                  >
                    {t('register')}
                  </TabsTrigger>
                </TabsList>

                {/* Sign In Tab */}
                <TabsContent value="signin">
                  <Card className="border-2 border-primary/20 shadow-2xl glass">
                    <CardHeader className="space-y-3">
                      <CardTitle className="text-2xl font-bold">{t('login')}</CardTitle>
                      <CardDescription className="text-base">
                        {language === 'ar'
                          ? 'أدخل بريدك الجامعي وكلمة المرور للدخول'
                          : 'Enter your university email and password to login'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSignIn} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-base font-semibold">{t('email')}</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="user@kku.edu.sa"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-14 text-base border-2 focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signin-password" className="text-base font-semibold">{t('password')}</Label>
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-14 text-base border-2 focus:border-primary"
                          />
                        </div>

                        {error && (
                          <Alert variant="destructive" className="border-2">
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription className="text-base">{error}</AlertDescription>
                          </Alert>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 shadow-lg" 
                          disabled={isLoading}
                        >
                          {isLoading ? t('loading') : t('signIn')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <Card className="border-2 border-primary/20 shadow-2xl glass">
                    <CardHeader className="space-y-3">
                      <CardTitle className="text-2xl font-bold">{t('register')}</CardTitle>
                      <CardDescription className="text-base">
                        {language === 'ar'
                          ? 'أنشئ حساباً جديداً في النظام'
                          : 'Create a new account in the system'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSignUp} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-base font-semibold">{t('fullName')}</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder=""
                            value={signUpFullName}
                            onChange={(e) => setSignUpFullName(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-14 text-base border-2 focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-base font-semibold">{t('email')}</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="user@kku.edu.sa"
                            value={signUpEmail}
                            onChange={handleEmailChange}
                            onBlur={handleEmailBlur}
                            required
                            disabled={isLoading}
                            className="h-14 text-base border-2 focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-base font-semibold">{t('password')}</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="h-14 text-base border-2 focus:border-primary"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base font-semibold">{t('role')}</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {roleOptions.map((role) => (
                              <motion.button
                                key={role.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSignUpRole(role.value as UserRole)}
                                disabled={isLoading}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  signUpRole === role.value
                                    ? `bg-gradient-to-br ${role.color} text-white border-transparent shadow-lg`
                                    : 'border-border hover:border-primary/50 glass'
                                }`}
                              >
                                <role.icon className={`w-6 h-6 mx-auto mb-2 ${signUpRole === role.value ? 'text-white' : 'text-primary'}`} />
                                <span className="font-semibold text-sm">
                                  {language === 'ar' ? role.labelAr : role.labelEn}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* University ID field - only for students */}
                        {signUpRole === 'student' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="signup-university-id" className="text-base font-semibold">
                              {t('universityId')} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="signup-university-id"
                              type="text"
                              placeholder={language === 'ar' ? 'مثال: 443816488' : 'Example: 443816488'}
                              value={signUpUniversityId}
                              onChange={(e) => setSignUpUniversityId(e.target.value)}
                              required={signUpRole === 'student'}
                              disabled={isLoading}
                              className="h-14 text-base border-2 focus:border-primary"
                            />
                          </motion.div>
                        )}

                        {error && (
                          <Alert variant="destructive" className="border-2">
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription className="text-base">{error}</AlertDescription>
                          </Alert>
                        )}

                        <Button 
                          type="submit" 
                          className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 shadow-lg" 
                          disabled={isLoading}
                        >
                          {isLoading ? t('loading') : t('signUp')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Footer Note */}
              <p className="text-center text-sm text-muted-foreground mt-6 glass rounded-xl p-4">
                {language === 'ar'
                  ? 'بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية لجامعة الملك خالد'
                  : 'By registering, you agree to the Terms of Service and Privacy Policy of King Khalid University'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}