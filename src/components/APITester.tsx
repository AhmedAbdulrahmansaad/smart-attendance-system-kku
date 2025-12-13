import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Loader2, Send } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { apiRequest } from '../utils/api';

export function APITester() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    university_id: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Test Health Check
  const testHealth = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiRequest('/health');
      setResult({
        success: true,
        status: 'healthy',
        data: data
      });
    } catch (err: any) {
      setError(err.message);
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Signup
  const testSignup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validate inputs
      if (!signupData.email || !signupData.password || !signupData.full_name) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }

      if (signupData.role === 'student' && !signupData.university_id) {
        throw new Error('الرقم الجامعي مطلوب للطلاب');
      }

      const data = await apiRequest('/signup', {
        method: 'POST',
        body: signupData
      });

      setResult({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        data: data
      });
    } catch (err: any) {
      setError(err.message);
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Test /me endpoint
  const testMe = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiRequest('/me');
      setResult({
        success: true,
        message: 'تم جلب بيانات المستخدم بنجاح',
        data: data
      });
    } catch (err: any) {
      setError(err.message);
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-6 h-6" />
            API Tester - اختبار الـ API
          </CardTitle>
          <CardDescription>
            اختبر جميع endpoints الخاصة بالنظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="health">Health Check</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
              <TabsTrigger value="me">/me</TabsTrigger>
            </TabsList>

            {/* Health Check Tab */}
            <TabsContent value="health" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    اختبار اتصال Backend والتأكد من أنه يعمل بشكل صحيح
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={testHealth} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test Health Check
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    اختبار إنشاء حساب جديد مع التحقق من صحة البيانات
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الجامعي</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@kku.edu.sa"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">الاسم الكامل</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="أحمد محمد الأحمد"
                      value={signupData.full_name}
                      onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">الدور</Label>
                    <select
                      id="role"
                      className="w-full p-2 border rounded-md"
                      value={signupData.role}
                      onChange={(e) => setSignupData({ ...signupData, role: e.target.value })}
                    >
                      <option value="student">طالب - Student</option>
                      <option value="instructor">مدرس - Instructor</option>
                      <option value="supervisor">مشرف - Supervisor</option>
                      <option value="admin">مدير - Admin</option>
                    </select>
                  </div>

                  {signupData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="university_id">الرقم الجامعي (9 أرقام تبدأ بـ 44)</Label>
                      <Input
                        id="university_id"
                        type="text"
                        placeholder="441234567"
                        value={signupData.university_id}
                        onChange={(e) => setSignupData({ ...signupData, university_id: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={testSignup} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test Signup
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* /me Tab */}
            <TabsContent value="me" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    اختبار جلب بيانات المستخدم الحالي (يتطلب تسجيل دخول)
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={testMe} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test /me Endpoint
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Results */}
          {(result || error) && (
            <div className="mt-6 space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">النتيجة:</h3>
                
                {result && (
                  <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div className="flex-1">
                        <AlertDescription>
                          {result.success ? (
                            <div className="space-y-2">
                              <p className="font-semibold text-green-700">
                                ✅ نجح الاختبار!
                              </p>
                              {result.message && (
                                <p className="text-sm text-green-600">{result.message}</p>
                              )}
                              {result.data && (
                                <pre className="mt-2 p-3 bg-gray-800 text-gray-100 rounded-md overflow-auto text-xs">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="font-semibold text-red-700">
                                ❌ فشل الاختبار
                              </p>
                              <p className="text-sm text-red-600">
                                {result.error}
                              </p>
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                {error && (
                  <Alert className="border-red-500 bg-red-50">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <AlertDescription>
                      <p className="font-semibold text-red-700">خطأ:</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Test Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>أمثلة سريعة للاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">✅ مثال لطالب صحيح:</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`البريد: ahmad.mohammed@kku.edu.sa
كلمة المرور: Test123456!
الاسم: أحمد محمد الأحمد
الدور: student
الرقم الجامعي: 441234567`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">❌ مثال خاطئ (رقم جامعي غير صحيح):</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`الرقم الجامعي: 12345678  ❌ (لا يبدأ بـ 44)
الرقم الجامعي: 4412345   ❌ (أقل من 9 أرقام)
الرقم الجامعي: 4412345678 ❌ (أكثر من 9 أرقام)`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">❌ مثال خاطئ (بريد غير جامعي):</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-xs overflow-auto">
{`البريد: test@gmail.com     ❌
البريد: test@hotmail.com   ❌
البريد: test@yahoo.com     ❌
البريد: test@kku.edu.sa    ✅`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
