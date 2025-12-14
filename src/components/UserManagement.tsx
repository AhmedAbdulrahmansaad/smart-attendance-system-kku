import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { getUsers, createUser } from '../utils/apiWithFallback';
import { Users, Trash2, UserPlus, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function UserManagement() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserUniversityId, setNewUserUniversityId] = useState('');

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    if (!token) return;
    
    try {
      console.log('👥 [UserManagement] Loading users...');
      
      // Use fallback API (tries Backend first, falls back to Supabase)
      const data = await getUsers(token);
      
      console.log('✅ [UserManagement] Loaded', data?.length, 'users');
      setUsers(data || []);
      setError('');
    } catch (error: any) {
      console.error('❌ [UserManagement] Error loading users:', error);
      toast.error('فشل تحميل المستخدمين / Failed to load users');
      setError(error.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('غير مصرح');
      return;
    }

    try {
      console.log('➕ [UserManagement] Adding new user...');
      
      await createUser({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName,
        role: newUserRole,
        university_id: newUserRole === 'student' ? newUserUniversityId : undefined,
      }, token);

      console.log('✅ [UserManagement] User added successfully');
      toast.success('تم إضافة المستخدم بنجاح / User added successfully');

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('student');
      setNewUserUniversityId('');
      setShowAddForm(false);

      // Reload users
      await loadUsers();
    } catch (error: any) {
      console.error('❌ [UserManagement] Error adding user:', error);
      
      // Special handling for Backend required error
      if (error.message.includes('Backend is required')) {
        toast.error('يجب deploy Edge Function لإنشاء مستخدمين / Backend required to create users', {
          description: error.message
        });
      } else {
        toast.error('فشل إضافة المستخدم / Failed to add user', {
          description: error.message
        });
      }
      
      setError(error.message || 'فشل إضافة المستخدم');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'DELETE',
        token,
      });

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('فشل حذف المستخدم');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'instructor':
        return 'bg-blue-100 text-blue-700';
      case 'student':
        return 'bg-green-100 text-green-700';
      case 'supervisor':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return language === 'ar' ? 'مدير' : 'Admin';
      case 'instructor':
        return language === 'ar' ? 'مدرس' : 'Instructor';
      case 'student':
        return language === 'ar' ? 'طالب' : 'Student';
      case 'supervisor':
        return language === 'ar' ? 'مشرف' : 'Supervisor';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#006747]">
            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إضافة وحذف وإدارة المستخدمين' : 'Add, delete, and manage users'}
          </p>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#006747] hover:bg-[#005438]">
          <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'املأ البيانات التالية لإنشاء مستخدم جديد' : 'Fill in the details to create a new user'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <Input
                    id="full-name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@kku.edu.sa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="******"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{language === 'ar' ? 'الدور' : 'Role'}</Label>
                  <select
                    id="role"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="student">{language === 'ar' ? 'طالب' : 'Student'}</option>
                    <option value="instructor">{language === 'ar' ? 'مدرس' : 'Instructor'}</option>
                    <option value="supervisor">{language === 'ar' ? 'مشرف' : 'Supervisor'}</option>
                    <option value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                  </select>
                </div>

                {newUserRole === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="university-id">{language === 'ar' ? 'الرقم الجامعي' : 'University ID'}</Label>
                    <Input
                      id="university-id"
                      value={newUserUniversityId}
                      onChange={(e) => setNewUserUniversityId(e.target.value)}
                      placeholder="441234567"
                      pattern="44[0-9]{7}"
                      required={newUserRole === 'student'}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-[#006747] hover:bg-[#005438]">
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4`} />
            <Input
              placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search for a user...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={language === 'ar' ? 'pr-10' : 'pl-10'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? `المستخدمون (${filteredUsers.length})` : `Users (${filteredUsers.length})`}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'قائمة جميع المستخدمين في النظام' : 'List of all users in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} p-3`}>
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </th>
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} p-3`}>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </th>
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} p-3`}>
                    {language === 'ar' ? 'الدور' : 'Role'}
                  </th>
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} p-3`}>
                    {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                  </th>
                  <th className={`${language === 'ar' ? 'text-right' : 'text-left'} p-3`}>
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">{user.full_name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}